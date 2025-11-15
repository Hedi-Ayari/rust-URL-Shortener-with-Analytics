use axum::{routing::get, Router};
use tokio::net::TcpListener;
mod db;

async fn hello() -> &'static str {
    "Rust URL Shortener is running!"
}

#[tokio::main]
async fn main() {
    match db::get_db().await {
        Ok(_) => println!("Connected to MongoDB successfully"),
        Err(e) => {
            println!("Failed to connect to MongoDB: {}", e);
            return;
        }
    }

    let app = Router::new()
        .route("/", get(hello));

    println!("Server running on http://localhost:8080");

    let listener = TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
