use axum::{extract::Path, http::StatusCode, response::Json, Extension};
use mongodb::Database;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct ShortenRequest {
    pub url: String,
}

#[derive(Serialize, Deserialize)]
pub struct ShortenResponse {
    pub short_code: String,
}

pub async fn hello() -> &'static str {
    println!("We hit the hello router");
    "Rust URL Shortener is running!"
}

use crate::models::UrlMapping;
use nanoid::nanoid;
use mongodb::bson::DateTime;

pub async fn shorten_url(
    Extension(db): Extension<Database>,
    Json(payload): Json<ShortenRequest>,
) -> Result<Json<ShortenResponse>, StatusCode> {
    let collection = db.collection::<UrlMapping>("urls");
    let short_code = nanoid!(6);
    
    let mapping = UrlMapping {
        original_url: payload.url,
        short_code: short_code.clone(),
        clicks: 0,
        created_at: DateTime::now(),
    };

    collection.insert_one(mapping, None)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(ShortenResponse {
        short_code,
    }))
}

pub async fn redirect(
    Extension(_db): Extension<Database>,
    Path(_code): Path<String>,
) -> Result<String, StatusCode> {
    println!("We hit the redirect router");
    Ok("Redirecting...".to_string())
}

pub async fn stats(
    Extension(_db): Extension<Database>,
    Path(_code): Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    println!("We hit the stats router");
    Ok(Json(serde_json::json!({
        "clicks": 0,
        "created_at": "2023-01-01T00:00:00Z"
    })))
}