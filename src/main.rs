use axum::{routing::{get, post}, Router, Extension};
use tokio::net::TcpListener;
mod db;
mod routes;

async fn hello() -> &'static str {
    "Rust URL Shortener is running!"
}

#[tokio::main]
async fn main() {
    let db = match db::get_db().await {
        Ok(db) => {
            println!("Connected to MongoDB successfully");
            db
        }
        Err(e) => {
            println!("Failed to connect to MongoDB: {}", e);
            return;
        }
    };

    let app = Router::new()
        .route("/", get(routes::hello))
        .route("/shorten", post(routes::shorten_url))
        .route("/:code", get(routes::redirect))
        .route("/stats/:code", get(routes::stats))
        .layer(Extension(db));

    println!("Server running on http://localhost:8080");

    let listener = TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
