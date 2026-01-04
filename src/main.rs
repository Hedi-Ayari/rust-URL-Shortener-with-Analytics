use axum::{routing::{get, post}, Router, Extension};
use std::sync::Arc;
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod db;
mod routes;
mod models;

use tower_governor::{GovernorLayer, governor::GovernorConfigBuilder};

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

    let governor_config = Arc::new(
        GovernorConfigBuilder::default()
            .per_second(2)
            .burst_size(5)
            .finish()
            .unwrap()
    );

    let cors = CorsLayer::new()
        .allow_origin(tower_http::cors::Any)
        .allow_methods(tower_http::cors::Any)
        .allow_headers(tower_http::cors::Any);

    let app = Router::new()
        .route("/shorten", post(routes::shorten_url))
        .route("/:code", get(routes::redirect))
        .route("/stats/:code", get(routes::stats))
        .route("/qr/:code", get(routes::generate_qr_code))
        .layer(tower_http::trace::TraceLayer::new_for_http())
        .layer(GovernorLayer { config: governor_config })
        .layer(Extension(db))
        .layer(cors);

    tracing::info!("Server running on http://localhost:8080");

    let listener = TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
