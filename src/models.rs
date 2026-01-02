use serde::{Deserialize, Serialize};
use mongodb::bson::DateTime;
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct UrlMapping {
    pub original_url: String,
    pub short_code: String,
    pub custom_code: Option<String>,
    pub clicks: i32,
    pub created_at: DateTime,
    pub expires_at: Option<DateTime>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClickEvent {
    pub short_code: String,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub timestamp: DateTime,
}

pub enum AppError {
    Internal(String),
    NotFound(String),
    BadRequest(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AppError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
        };

        let body = Json(serde_json::json!({
            "error": error_message,
        }));

        (status, body).into_response()
    }
}
