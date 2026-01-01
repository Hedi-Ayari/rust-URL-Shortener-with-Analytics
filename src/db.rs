use mongodb::{Client, Database};
use std::env;

pub async fn get_db() -> Result<Database, mongodb::error::Error> {
    let uri = env::var("MONGO_URI").expect("MONGO_URI must be set in .env file");

    let client = Client::with_uri_str(&uri).await?;

    Ok(client.database("url_shortener"))
}
