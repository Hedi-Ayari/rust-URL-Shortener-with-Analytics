use axum::{extract::Path, response::Json, Extension};
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

pub async fn shorten_url(
    Extension(db): Extension<Database>,
    Json(payload): Json<ShortenRequest>,
) -> Result<Json<ShortenResponse>, AppError> {
    tracing::info!("Shorten request received for URL: {}", payload.url);

    if payload.url.is_empty() || !payload.url.starts_with("http") {
        return Err(AppError::BadRequest("Invalid URL format. URL must start with http:// or https://".to_string()));
    }

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


pub async fn redirect(
    Extension(db): Extension<Database>,
    Path(code): Path<String>,
) -> Result<Redirect, AppError> {
    tracing::info!("Redirect request received for code: {}", code);

    let collection = db.collection::<UrlMapping>("urls");
    
    let filter = doc! { "short_code": &code };
    let update = doc! { "$inc": { "clicks": 1 } };
    
    tracing::debug!("Fetching and updating click count for code: {}", code);
    let mapping = collection.find_one_and_update(filter, update, None)
        .await
        .map_err(|e| {
            tracing::error!("Database update failed for code {}: {}", code, e);
            AppError::Internal("Database error during redirection".to_string())
        })?
        .ok_or_else(|| {
            tracing::warn!("Short code not found: {}", code);
            AppError::NotFound("Short code not found".to_string())
        })?;

    tracing::info!("Redirecting code {} to: {}", code, mapping.original_url);
    Ok(Redirect::to(&mapping.original_url))
}

pub async fn stats(
    Extension(db): Extension<Database>,
    Path(code): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    tracing::info!("Stats request received for code: {}", code);

    let collection = db.collection::<UrlMapping>("urls");
    
    let filter = doc! { "short_code": &code };
    
    tracing::debug!("Fetching stats for code: {}", code);
    let mapping = collection.find_one(filter, None)
        .await
        .map_err(|e| {
            tracing::error!("Database fetch failed for code {}: {}", code, e);
            AppError::Internal("Database error while fetching stats".to_string())
        })?
        .ok_or_else(|| {
            tracing::warn!("Short code not found: {}", code);
            AppError::NotFound("Short code not found".to_string())
        })?;

    tracing::info!("Stats retrieved successfully for code: {}", code);
    Ok(Json(serde_json::json!({
        "original_url": mapping.original_url,
        "clicks": mapping.clicks,
        "created_at": mapping.created_at.try_to_rfc3339_string().unwrap_or_default(),
    })))
}
