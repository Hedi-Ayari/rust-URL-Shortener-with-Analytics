use serde::{Deserialize, Serialize};
use mongodb::bson::DateTime;

#[derive(Debug, Serialize, Deserialize)]
pub struct UrlMapping {
    pub original_url: String,
    pub short_code: String,
    pub clicks: i32,
    pub created_at: DateTime,
}
