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

pub async fn shorten_url(
    Extension(_db): Extension<Database>,
    Json(_payload): Json<ShortenRequest>,
) -> Result<Json<ShortenResponse>, StatusCode> {
    println!("We hit the shorten_url router");
    Ok(Json(ShortenResponse {
        short_code: "abc123".to_string(),
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