# Rust URL Shortener with Analytics

A high-performance URL shortener service built with Rust, Axum, and MongoDB, featuring analytics and click tracking.

## Features

- **URL Shortening**: Convert long URLs into short, shareable links
- **Analytics**: Track click statistics for each shortened URL
- **RESTful API**: Clean and simple API endpoints
- **MongoDB Integration**: Persistent storage with MongoDB
- **High Performance**: Built with Rust for speed and reliability

## API Endpoints

### POST /shorten
Shorten a URL.

**Request Body:**
```json
{
  "url": "https://example.com/very/long/url"
}
```

**Response:**
```json
{
  "short_code": "abc123"
}
```

### GET /:code
Redirect to the original URL using the short code.

### GET /stats/:code
Get analytics for a shortened URL.

**Response:**
```json
{
  "clicks": 42,
  "created_at": "2023-01-01T00:00:00Z"
}
```

## Prerequisites

- Rust (latest stable version)
- MongoDB (running locally or remote)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Hedi-Ayari/rust-URL-Shortener-with-Analytics.git
cd rust-url-shortener/backend
```

2. Install dependencies:
```bash
cargo build
```

3. Set up MongoDB connection (optional):
```bash
export MONGO_URI="mongodb://localhost:27017"
```

## Running the Server

```bash
cargo run
```

The server will start on `http://localhost:8080`.

## Development

### Project Structure

```
src/
├── main.rs      # Application entry point
├── routes.rs    # HTTP route handlers
├── db.rs        # MongoDB connection and utilities
└── models.rs    # Data models (to be implemented)
```

### Building

```bash
cargo build
```

### Testing

```bash
cargo test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.