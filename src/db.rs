use mongodb::{Client, Database};
use std::env;

pub async fn get_db() -> Result<Database, mongodb::error::Error> {
    let uri = env::var("MONGO_URI").unwrap_or_else(|_| "mongodb://localhost:27017".to_string());

    let client = Client::with_uri_str(&uri).await?;

    Ok(client.database("url_shortener"))
}
