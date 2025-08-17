# DevSuite 🚀

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.18+-blue.svg)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue.svg)](https://postgresql.org)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![API](https://img.shields.io/badge/API-REST-orange.svg)]()

> **Developer productivity tools on steroids** - A comprehensive REST API suite providing essential utilities that every developer needs in their daily workflow.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Contributing](#contributing)
- [License](#license)

## 🔍 Overview

DevSuite is a powerful collection of developer productivity tools exposed through a clean, RESTful API. Built with Node.js and Express, it provides essential utilities that developers frequently need, all accessible through simple HTTP requests.

### Why DevSuite?

- **🎯 All-in-One**: Multiple essential tools in a single API
- **⚡ High Performance**: Optimized for speed and reliability
- **🔒 Secure**: Built with security best practices
- **📊 Analytics**: Built-in monitoring and usage analytics
- **🐳 Docker Ready**: Easy deployment with Docker support
- **📚 Well Documented**: Comprehensive API documentation

## ✨ Features

### 🔗 URL Shortener
Transform long URLs into short, manageable links with comprehensive analytics.

- **Link Shortening**: Generate short URLs using Base62 encoding
- **Click Tracking**: Real-time analytics with click counts
- **Expiration Control**: Set custom expiration times (7d, 24h, etc.)
- **Analytics Dashboard**: Detailed metrics including creation time, last accessed, and click trends

### 📝 Text Transformation Utilities
Powerful text processing and encoding tools for various use cases.

- **Base64 Encoding/Decoding**: Secure data encoding and decoding
- **URL Encoding/Decoding**: Handle URL-safe text transformations  
- **UTF-8 Encoding**: Universal character encoding support
- **Slugify**: Convert text to URL-friendly slugs with customizable separators
- **Case Conversion**: Multiple case formats (camelCase, snake_case, kebab-case, PascalCase, etc.)
- **Morse Code**: Encode/decode text to/from Morse code

### 🌍 Timezone & Time Utilities
Comprehensive timezone management and time conversion capabilities.

- **Universal Time Conversion**: Convert between any timezones using IANA database
- **ISO 8601 Support**: Full support for ISO 8601 with timezone offsets
- **Current Time Retrieval**: Get current time for any location (city, country, coordinates, IP)
- **Timezone Lookup**: Comprehensive timezone metadata including DST rules
- **Custom Time Formats**: User-defined time format patterns
- **Robust Error Handling**: Graceful handling of invalid timezone IDs and malformed datetime strings

### ⏰ Cron Expression Generator
Intelligent cron expression management with natural language processing.

- **English to Cron**: Convert natural language to cron syntax ("every Monday at 9 AM")
- **Expression Parsing**: Parse and validate complex cron expressions
- **Validation**: Comprehensive cron expression validation
- **Next Execution**: Calculate next execution times
- **Human Readable**: Convert cron back to human-readable format

### 🏥 Health Check & Monitoring
Comprehensive monitoring solution for your applications and dependencies.

- **Third-party Monitoring**: Ping and monitor external services
- **Latency Tracking**: Real-time latency measurements
- **HTTP Status Monitoring**: Track response codes and trends
- **Self-Health Monitoring**: Built-in API health checks
- **Uptime Statistics**: Detailed availability reports

### 🔍 Text Validation Utilities
Essential validation tools for common data formats.

- **JSON Validation**: Validate JSON structure and syntax
- **UUID Validation**: Check UUID format compliance
- **IP Address Validation**: Validate IPv4 and IPv6 addresses
- **Email Validation**: RFC-compliant email address validation
- **Number Validation**: Numeric format validation
- **URL Validation**: Comprehensive URL structure validation
- **Alphanumeric Validation**: Character set validation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 13+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/devsuite.git
   cd devsuite
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Initialize database**
   ```bash
   npm run setup
   ```

5. **Start the server**
   ```bash
   npm run dev  # Development mode
   npm start    # Production mode
   ```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
Currently, no authentication is required. Rate limiting is applied (1000 requests per 15 minutes per IP).

### Response Format
All API responses follow a consistent format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `devsuite` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | - |
| `BASE_URL` | Application base URL | `http://localhost:3000` |

### Database Configuration

DevSuite uses PostgreSQL for data persistence. The database schema is automatically created when you run the setup script.

## 📖 Usage Examples

### URL Shortener

**Shorten a URL**
```bash
curl -X POST http://localhost:3000/api/v1/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "originalUrl": "https://github.com/yourusername/devsuite",
    "expiresIn": "7d"
  }'
```

**Access shortened URL**
```bash
curl -L http://localhost:3000/abc123
```

**Get analytics**
```bash
curl http://localhost:3000/api/v1/analytics/abc123
```

### Text Transformation

**Base64 Encode**
```bash
curl -X POST "http://localhost:3000/api/v1/text/base64?op=encode" \
  -H "Content-Type: application/json" \
  -d '{"input": "Hello DevSuite!"}'
```

**Convert to slug**
```bash
curl -X POST "http://localhost:3000/api/v1/text/slugify?separator=hyphen" \
  -H "Content-Type: application/json" \
  -d '{"input": "The Amazing DevSuite 2024"}'
```

**Case conversion**
```bash
curl -X POST "http://localhost:3000/api/v1/text/case?type=camel" \
  -H "Content-Type: application/json" \
  -d '{"input": "convert this to camel case"}'
```

### Timezone Operations

**Convert timezone**
```bash
curl -X POST http://localhost:3000/api/v1/timezone/convert \
  -H "Content-Type: application/json" \
  -d '{
    "datetime": "2024-01-15T10:30:00",
    "from": "America/New_York", 
    "to": "Asia/Tokyo"
  }'
```

**Get current time**
```bash
curl "http://localhost:3000/api/v1/timezone/current?location=London"
```

### Cron Generator

**Generate cron from English**
```bash
curl -X POST http://localhost:3000/api/v1/cron/generate \
  -H "Content-Type: application/json" \
  -d '{"description": "every Monday at 9 AM"}'
```

**Validate cron expression**
```bash
curl -X POST http://localhost:3000/api/v1/cron/validate \
  -H "Content-Type: application/json" \
  -d '{"expression": "0 9 * * 1"}'
```

### Health Check

**Monitor a service**
```bash
curl -X POST http://localhost:3000/api/v1/health/monitor \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.github.com"}'
```

**Check API health**
```bash
curl http://localhost:3000/health
```

## 🐳 Docker Deployment

Build and run with Docker:

```bash
# Build image
docker build -t devsuite .

# Run with docker-compose
docker-compose up -d
```

The `docker-compose.yml` includes PostgreSQL setup and environment configuration.

## 🏗️ Architecture

DevSuite follows a clean, layered architecture:

```
├── src/
│   ├── controllers/     # HTTP request handlers
│   ├── services/        # Business logic layer  
│   ├── models/          # Data access layer
│   ├── routes/          # API route definitions
│   ├── middleware/      # Express middleware
│   ├── utils/           # Utility functions
│   └── config/          # Configuration files
├── scripts/             # Setup and deployment scripts
├── docs/                # API documentation
└── tests/               # Test suites
```

## 🔒 Security

- **Rate Limiting**: 1000 requests per 15 minutes per IP
- **Input Validation**: Comprehensive input sanitization and validation
- **SQL Injection Protection**: Parameterized queries
- **Security Headers**: Helmet.js for security headers
- **CORS**: Configurable cross-origin resource sharing

## 📊 Performance

- **Connection Pooling**: PostgreSQL connection pooling for optimal performance
- **Caching**: In-memory caching for frequently accessed data
- **Optimized Queries**: Indexed database queries for fast lookups
- **Lightweight**: Minimal overhead with efficient algorithms

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -am 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Submit a pull request

### Code Style

- Follow existing code style and conventions
- Add JSDoc comments for new functions
- Include tests for new features
- Update documentation as needed

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes.

## 🛠️ Roadmap

- [ ] **Authentication & Authorization**: JWT-based authentication system
- [ ] **API Rate Limiting**: Per-user rate limiting with different tiers
- [ ] **Webhook Support**: Real-time notifications for URL clicks and health checks
- [ ] **Data Export**: Export analytics data in various formats (CSV, JSON, PDF)
- [ ] **Custom Domains**: Support for custom short domains
- [ ] **Bulk Operations**: Batch processing for multiple URLs and text transformations
- [ ] **GraphQL API**: Alternative GraphQL interface
- [ ] **Real-time Dashboard**: Web-based analytics dashboard
- [ ] **Monitoring Alerts**: Email/SMS alerts for health check failures
- [ ] **Advanced Cron**: Support for more complex scheduling patterns

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Express.js** - Fast, unopinionated web framework
- **PostgreSQL** - Powerful, open-source relational database
- **Joi** - Object schema validation
- **Helmet** - Security middleware for Express

## 📞 Support

- **Documentation**: [API Docs](https://devsuite-docs.example.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/devsuite/issues)
- **Discord**: [Community Discord](https://discord.gg/devsuite)
- **Email**: support@devsuite.com

---

<div align="center">

**[Website](https://devsuite.example.com)** • 
**[Documentation](https://docs.devsuite.example.com)** • 
**[API Reference](https://api.devsuite.example.com)** • 
**[Discord](https://discord.gg/devsuite)**

Made with ❤️ by developers, for developers.

</div>
