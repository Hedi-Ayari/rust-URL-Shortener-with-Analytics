use axum::{routing::get, Router};
use tokio::net::TcpListener;

async fn hello() -> &'static str {
    "Rust URL Shortener is running!"
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(hello));

    println!("Server running on http://localhost:8080");

    let listener = TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
