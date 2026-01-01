use axum::{routing::{get, post}, Router, Extension};
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod db;
mod routes;
mod models;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let db = match db::get_db().await {
        Ok(db) => {
            tracing::info!("Connected to MongoDB successfully");
            db
        }
        Err(e) => {
            tracing::error!("Failed to connect to MongoDB: {}", e);
            return;
        }
    };

    let app = Router::new()
        .route("/shorten", post(routes::shorten_url))
        .route("/:code", get(routes::redirect))
        .route("/stats/:code", get(routes::stats))
        .layer(Extension(db))
        .layer(CorsLayer::permissive());

    tracing::info!("Server running on http://localhost:8080");

    let listener = TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
