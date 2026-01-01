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

use axum::response::Redirect;
use mongodb::bson::doc;

pub async fn redirect(
    Extension(db): Extension<Database>,
    Path(code): Path<String>,
) -> Result<Redirect, StatusCode> {
    let collection = db.collection::<UrlMapping>("urls");
    
    let filter = doc! { "short_code": &code };
    let update = doc! { "$inc": { "clicks": 1 } };
    
    let mapping = collection.find_one_and_update(filter, update, None)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Redirect::to(&mapping.original_url))
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