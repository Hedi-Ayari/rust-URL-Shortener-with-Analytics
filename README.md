# 🔗 Rust URL Shortener with Analytics

<div align="center">

![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)
![Axum](https://img.shields.io/badge/Axum-FF5733?style=for-the-badge&logo=rust&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

A high-performance URL shortener service built with **Rust**, **Axum**, and **MongoDB**, featuring real-time analytics, QR code generation, and a modern React dashboard.

[Features](#-features) • [Quick Start](#-quick-start) • [API Reference](#-api-reference) • [Frontend](#-frontend) • [Contributing](#-contributing)

</div>

---

## ✨ Features

| Feature                    | Description                                                     |
| -------------------------- | --------------------------------------------------------------- |
| 🚀 **URL Shortening**      | Convert long URLs into short, shareable links with custom codes |
| 📊 **Real-time Analytics** | Track click statistics, IP addresses, and user agents           |
| 📱 **QR Code Generation**  | Auto-generate QR codes for each shortened URL                   |
| ⏰ **Link Expiration**     | Set TTL (Time-to-Live) for temporary links                      |
| 🛡️ **Rate Limiting**       | Built-in rate limiting with Tower Governor                      |
| 🎨 **Modern Dashboard**    | Sleek React frontend with real-time metrics                     |

---

## 🛠️ Tech Stack

### Backend

- **Rust** - Systems programming language
- **Axum** - Ergonomic web framework
- **MongoDB** - NoSQL database for persistent storage
- **Tokio** - Async runtime
- **Tower HTTP** - HTTP middleware (CORS, tracing)
- **nanoid** - Short ID generation
- **qrcode** - QR code generation

### Frontend

- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Next-gen frontend tooling
- **Framer Motion** - Animation library
- **Axios** - HTTP client
- **Lucide React** - Icon library

---

## 🚀 Quick Start

### Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally or remote)
- [Node.js](https://nodejs.org/) 18+ (for frontend)

### Backend Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/Hedi-Ayari/rust-URL-Shortener-with-Analytics.git
   cd rust-url-shortener/backend
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB connection string
   ```

   `.env` example:

   ```env
   MONGO_URI=mongodb://localhost:27017
   RUST_LOG=info
   ```

3. **Run the server**

   ```bash
   cargo run
   ```

   The server will start on `http://localhost:8080`

### Frontend Setup

1. **Navigate to frontend directory**

   ```bash
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

---

## 📚 API Reference

### Create Short URL

```http
POST /shorten
Content-Type: application/json

{
  "url": "https://example.com/very/long/url",
  "custom_code": "my-link",      // optional
  "expires_at": "2025-12-31T23:59:59Z"  // optional
}
```

**Response:**

```json
{
  "short_code": "my-link"
}
```

### Redirect to Original URL

```http
GET /:code
```

Automatically redirects to the original URL and logs analytics.

### Get Link Statistics

```http
GET /stats/:code
```

**Response:**

```json
{
  "short_code": "my-link",
  "original_url": "https://example.com/very/long/url",
  "total_clicks": 42,
  "created_at": "2025-01-15T10:00:00Z",
  "expires_at": null,
  "last_clicks": [
    {
      "ip": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "timestamp": "2025-01-30T15:30:00Z"
    }
  ]
}
```

### Generate QR Code

```http
GET /qr/:code
```

Returns a PNG image of the QR code for the shortened URL.

---

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── main.rs       # Application entry point & server setup
│   ├── routes.rs     # HTTP route handlers
│   ├── db.rs         # MongoDB connection utilities
│   └── models.rs     # Data models (UrlMapping, ClickEvent)
├── frontend/         # React dashboard application
│   ├── src/
│   │   ├── App.tsx   # Main dashboard component
│   │   └── index.css # Styles
│   └── package.json
├── Cargo.toml        # Rust dependencies
└── .env.example      # Environment template
```

---

## 🧪 Development

### Build

```bash
cargo build --release
```

### Run Tests

```bash
cargo test
```

### API Testing with Postman

Import the included `postman_collection.json` for ready-to-use API tests.

---

## 📝 Environment Variables

| Variable    | Description                          | Default                     |
| ----------- | ------------------------------------ | --------------------------- |
| `MONGO_URI` | MongoDB connection string            | `mongodb://localhost:27017` |
| `RUST_LOG`  | Log level (debug, info, warn, error) | `info`                      |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ by [Hedi Ayari](https://github.com/Hedi-Ayari)

⭐ Star this repo if you find it useful!

</div>
