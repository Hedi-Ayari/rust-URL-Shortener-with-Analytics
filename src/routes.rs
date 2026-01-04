use axum::{extract::Path, response::Json, Extension, http::HeaderMap};
use futures::StreamExt;
use qrcode::QrCode;
use image::{Luma, GrayImage};
use std::io::Cursor;
use mongodb::Database;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct ShortenRequest {
    pub url: String,
    pub custom_code: Option<String>,
    pub expires_at: Option<String>, // RFC3339 string
}

#[derive(Serialize, Deserialize)]
pub struct ShortenResponse {
    pub short_code: String,
}

pub async fn hello() -> &'static str {
    println!("We hit the hello router");
    "Rust URL Shortener is running!"
}

use crate::models::{UrlMapping, AppError};
use nanoid::nanoid;
use mongodb::bson::{doc, DateTime as BsonDateTime};

pub fn validate_url(url: &str) -> Result<(), AppError> {
    if url.is_empty() || !url.starts_with("http") {
        return Err(AppError::BadRequest("Invalid URL format. URL must start with http:// or https://".to_string()));
    }
    Ok(())
}

pub async fn shorten_url(
    Extension(db): Extension<Database>,
    Json(payload): Json<ShortenRequest>,
) -> Result<Json<ShortenResponse>, AppError> {
    tracing::info!("Shorten request received for URL: {}", payload.url);

    validate_url(&payload.url)?;

    let collection = db.collection::<UrlMapping>("urls");
    
    let has_custom = payload.custom_code.is_some();
    let short_code = if let Some(custom) = &payload.custom_code {
        // Check if custom code exists
        let filter = doc! { "short_code": custom };
        if collection.find_one(filter, None).await.map_err(|_| AppError::Internal("DB Error".into()))?.is_some() {
            return Err(AppError::BadRequest("Custom code already in use".into()));
        }
        custom.clone()
    } else {
        nanoid!(6)
    };

    let expires_at = if let Some(expires) = &payload.expires_at {
        let dt = chrono::DateTime::parse_from_rfc3339(expires)
            .map_err(|_| AppError::BadRequest("Invalid expiration date format. Use RFC3339".into()))?;
        Some(BsonDateTime::from_millis(dt.timestamp_millis()))
    } else {
        None
    };
    
    let mapping = UrlMapping {
        original_url: payload.url,
        short_code: short_code.clone(),
        custom_code: if has_custom { Some(short_code.clone()) } else { None },
        clicks: 0,
        created_at: BsonDateTime::now(),
        expires_at,
    };

    tracing::debug!("Inserting new URL mapping for code: {}", short_code);
    collection.insert_one(mapping, None)
        .await
        .map_err(|e| {
            tracing::error!("Database insertion failed: {}", e);
            AppError::Internal("Failed to save URL to database".to_string())
        })?;

    tracing::info!("URL shortened successfully. Short code: {}", short_code);
    Ok(Json(ShortenResponse {
        short_code,
    }))
}

use axum::response::Redirect;


use crate::models::ClickEvent;

pub async fn redirect(
    Extension(db): Extension<Database>,
    headers: HeaderMap,
    Path(code): Path<String>,
) -> Result<Redirect, AppError> {
    tracing::info!("Redirect request received for code: {}", code);

    let collection = db.collection::<UrlMapping>("urls");
    let clicks_collection = db.collection::<ClickEvent>("clicks");
    
    let filter = doc! { "short_code": &code };
    
    let mapping = collection.find_one(filter.clone(), None)
        .await
        .map_err(|e| {
            tracing::error!("Database fetch failed for code {}: {}", code, e);
            AppError::Internal("Database error during redirection".to_string())
        })?
        .ok_or_else(|| {
            tracing::warn!("Short code not found: {}", code);
            AppError::NotFound("Short code not found".to_string())
        })?;

    // Check expiration
    if let Some(expires_at) = mapping.expires_at {
        if expires_at.timestamp_millis() < BsonDateTime::now().timestamp_millis() {
            return Err(AppError::BadRequest("This short URL has expired".into()));
        }
    }

    // Record click event
    let user_agent = headers.get("user-agent")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());
    
    // In a real app, you'd get the IP from ConnectInfo or headers like X-Forwarded-For
    let ip_address = headers.get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.split(',').next())
        .map(|s| s.trim().to_string());

    let click_event = ClickEvent {
        short_code: code.clone(),
        ip_address,
        user_agent,
        timestamp: BsonDateTime::now(),
    };

    // Update click count and record event (fire and forget or await)
    let update = doc! { "$inc": { "clicks": 1 } };
    let _ = collection.update_one(filter, update, None).await;
    let _ = clicks_collection.insert_one(click_event, None).await;

    tracing::info!("Redirecting code {} to: {}", code, mapping.original_url);
    Ok(Redirect::to(&mapping.original_url))
}

pub async fn stats(
    Extension(db): Extension<Database>,
    Path(code): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    tracing::info!("Stats request received for code: {}", code);

    let urls_collection = db.collection::<UrlMapping>("urls");
    let clicks_collection = db.collection::<ClickEvent>("clicks");
    
    let filter = doc! { "short_code": &code };
    
    let mapping = urls_collection.find_one(filter.clone(), None)
        .await
        .map_err(|_| AppError::Internal("Database error".into()))?
        .ok_or_else(|| AppError::NotFound("Short code not found".into()))?;

    // Aggregate click data (mocking geo-location for now or using IP)
    let total_clicks = mapping.clicks;
    
    // Get last 10 clicks
    let mut cursor = clicks_collection.find(filter, None).await.map_err(|_| AppError::Internal("DB Error".into()))?;
    let mut last_clicks = Vec::new();
    
    while let Some(click) = cursor.next().await {
        if let Ok(c) = click {
            last_clicks.push(serde_json::json!({
                "timestamp": c.timestamp.try_to_rfc3339_string().unwrap_or_default(),
                "ip": c.ip_address,
                "ua": c.user_agent,
            }));
        }
    }

    Ok(Json(serde_json::json!({
        "original_url": mapping.original_url,
        "short_code": mapping.short_code,
        "total_clicks": total_clicks,
        "created_at": mapping.created_at.try_to_rfc3339_string().unwrap_or_default(),
        "expires_at": mapping.expires_at.map(|e| e.try_to_rfc3339_string().unwrap_or_default()),
        "last_clicks": last_clicks,
    })))
}



pub async fn generate_qr_code(
    Path(code): Path<String>,
) -> Result<impl axum::response::IntoResponse, AppError> {
    tracing::info!("QR code request received for code: {}", code);

    let base_url = std::env::var("BASE_URL").unwrap_or_else(|_| "http://localhost:8080".into());
    let short_url = format!("{}/{}", base_url, code);

    let qr = QrCode::new(short_url.as_bytes())
        .map_err(|_| AppError::Internal("Failed to generate QR code".into()))?;

    let width = qr.width() as u32;
    let mut img = GrayImage::new(width, width);

    for x in 0..width {
        for y in 0..width {
            let is_dark = qr[(x as usize, y as usize)] == qrcode::Color::Dark;
            let color = if is_dark { 0u8 } else { 255u8 };
            img.put_pixel(x, y, Luma([color]));
        }
    }

    // Scale up for better visibility (optional but recommended)
    let dynamic_img = image::DynamicImage::ImageLuma8(img);
    let scaled_img = dynamic_img.resize(512, 512, image::imageops::FilterType::Nearest);

    let mut buffer = Cursor::new(Vec::new());
    scaled_img.write_to(&mut buffer, image::ImageFormat::Png)
        .map_err(|_| AppError::Internal("Failed to encode QR code image".into()))?;

    let body = buffer.into_inner();

    Ok((
        [(axum::http::header::CONTENT_TYPE, "image/png")],
        body,
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_url_valid() {
        assert!(validate_url("http://google.com").is_ok());
        assert!(validate_url("https://rust-lang.org").is_ok());
    }

    #[test]
    fn test_validate_url_invalid() {
        assert!(validate_url("google.com").is_err());
        assert!(validate_url("ftp://files.com").is_err());
        assert!(validate_url("").is_err());
    }
}
