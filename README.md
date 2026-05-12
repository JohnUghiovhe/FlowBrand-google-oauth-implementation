# FlowBrand Google OAuth 2.0 Implementation

A standalone, production-ready NestJS server implementing Google OAuth 2.0 authentication for the FlowBrand platform.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Database](#database)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

## ✨ Features

- **Google OAuth 2.0 Integration** - Seamless Google sign-in using Passport.js
- **JWT Authentication** - Secure token-based authentication with refresh tokens
- **PostgreSQL Database** - Persistent user and session storage
- **TypeScript Strict Mode** - Full type safety without `any` types
- **Error Handling** - Comprehensive exception filters and guards
- **Request/Response Interceptors** - Standardized response format
- **Swagger Documentation** - Auto-generated API documentation
- **Environment Validation** - Joi schema validation for configuration
- **CORS Support** - Cross-origin request handling
- **Health Checks** - Server health and readiness endpoints

## 🛠 Tech Stack

- **Framework:** NestJS 11
- **Language:** TypeScript 5.7
- **Database:** PostgreSQL with TypeORM
- **Authentication:** Passport.js (Google OAuth 2.0, JWT)
- **Testing:** Jest with ts-jest
- **Linting:** ESLint with TypeScript support
- **Formatting:** Prettier
- **API Docs:** Swagger/OpenAPI

## 📦 Prerequisites

- Node.js >= 18.x
- npm >= 9.x or yarn >= 3.x
- PostgreSQL >= 12
- Docker & Docker Compose (optional, for containerized PostgreSQL)
- Google OAuth Application (credentials from Google Cloud Console)

## 🚀 Installation

### 1. Clone and Setup

```bash
# Navigate to the project directory
cd FlowBrand-Google-Oauth-Implementation

# Install dependencies
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required Environment Variables:**
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `GOOGLE_REDIRECT_URI` - OAuth callback URL (e.g., `http://localhost:3000/api/v1/auth/google/callback`)
- `JWT_SECRET` - Strong random secret for JWT signing
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - PostgreSQL connection details
- `FRONTEND_URL` - Frontend application URL for redirects

### 3. Database Setup

#### Option A: Using Docker (Recommended for Development)

```bash
# Start PostgreSQL container
docker run --name flowbrand-postgres \
  -e POSTGRES_DB=flowbrand \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:15-alpine

# Verify connection
docker exec flowbrand-postgres psql -U postgres -d flowbrand -c "SELECT 1"
```

#### Option B: Existing PostgreSQL Installation

```bash
# Create database
createdb flowbrand -U postgres

# Verify connection
psql -U postgres -d flowbrand -c "SELECT 1"
```

### 4. Run Database Migrations

```bash
# TypeORM synchronization will auto-create tables in development
npm run build
npm run dev
```

## ⚙️ Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application type)
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/v1/auth/google/callback` (development)
   - `https://yourdomain.com/api/v1/auth/google/callback` (production)
6. Copy `Client ID` and `Client Secret` to `.env`

### JWT Configuration

Generate strong secrets for production:

```bash
# Using OpenSSL
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For JWT_REFRESH_SECRET
```

### Database Configuration

PostgreSQL connection settings in `.env`:

```
DB_HOST=localhost          # Database host
DB_PORT=5432              # PostgreSQL default port
DB_USER=postgres          # Database user
DB_PASSWORD=postgres      # Database password
DB_NAME=flowbrand         # Database name
DB_LOGGING=false          # Enable query logging (dev only)
DB_SSL=false              # Enable SSL (production)
```

## 🏃 Running the Server

### Development Mode (with Hot Reload)

```bash
npm run dev
```

### Watch Mode (auto-rebuild on changes)

```bash
npm run start:dev
```

### Production Mode

```bash
npm run build
npm run start
```

### Debug Mode

```bash
npm run start:debug
```

## 📡 API Endpoints

### Health & Status

```
GET  /health
GET  /ping
```

### Authentication

```
GET  /api/v1/auth/google
     ↓ (Redirects to Google consent screen)

GET  /api/v1/auth/google/callback
     ↑ (Google redirects here after authentication)
     ↓ (Redirects to frontend dashboard on success)
```

### Response Format

Success:
```json
{
  "status_code": 200,
  "message": "OAuth login successful",
  "access_token": "eyJhbGc...",
  "refresh_token": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "full_name": "John Doe",
      "email": "john@example.com",
      "avatar_url": "https://example.com/avatar.jpg"
    }
  }
}
```

Error:
```json
{
  "status_code": 400,
  "error": "Bad Request",
  "message": "Invalid credentials"
}
```

## 🧪 Testing

### Run Tests

```bash
npm run test
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:cov
```

### Create Tests

Tests should be placed next to the implementation file with `.spec.ts` extension:

```typescript
// src/modules/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import AuthenticationService from './auth.service';

describe('AuthenticationService', () => {
  let service: AuthenticationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthenticationService],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

## 📁 Project Structure

```
.
├── config/
│   ├── auth.config.ts          # OAuth & JWT configuration
│   └── server.config.ts        # Server configuration
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── entities/
│   │   │   │   └── user-session.entity.ts
│   │   │   ├── dto/
│   │   │   │   └── google-oauth.dto.ts
│   │   │   └── strategies/
│   │   │       └── jwt.strategy.ts
│   │   ├── strategies/
│   │   │   └── google.strategy.ts
│   │   └── user/
│   │       └── entities/
│   │           └── user.entity.ts
│   ├── shared/
│   │   ├── constants/
│   │   │   └── SystemMessages.ts
│   │   ├── helpers/
│   │   │   ├── skipAuth.ts
│   │   │   ├── custom-http-filter.ts
│   │   │   └── http-exception-filter.ts
│   │   └── interceptors/
│   │       └── response.interceptor.ts
│   ├── guards/
│   │   └── auth.guard.ts
│   ├── database/
│   │   ├── data-source.ts
│   │   └── index.ts
│   ├── entities/
│   │   └── base.entity.ts
│   ├── app.module.ts
│   ├── main.ts
│   └── health.controller.ts
├── .env.example
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── jest.config.js
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md
```

## 🗄️ Database

### Entities

#### User Entity (`users` table)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| full_name | VARCHAR(100) | User's full name |
| email | VARCHAR(255) | Unique email |
| password | TEXT | Hashed password (null for OAuth) |
| avatar_url | TEXT | Profile picture URL |
| auth_provider | VARCHAR(20) | 'google' or 'email' |
| provider_user_id | TEXT | Google user ID |
| is_verified | BOOLEAN | Email verification status |
| is_active | BOOLEAN | Account active status |
| terms_accepted | BOOLEAN | Terms acceptance |
| created_at | TIMESTAMP | Created timestamp |
| updated_at | TIMESTAMP | Updated timestamp |
| deleted_at | TIMESTAMP | Soft delete timestamp |

#### UserSession Entity (`user_sessions` table)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| refresh_token | TEXT | Unique refresh token |
| expires_at | TIMESTAMP | Token expiration |
| is_revoked | BOOLEAN | Revocation status |
| created_at | TIMESTAMP | Created timestamp |

## 🔒 Security Considerations

1. **Environment Variables** - Never commit `.env` files; use `.env.example` as template
2. **HTTPS** - Always use HTTPS in production
3. **CORS** - Configure CORS origins explicitly, avoid wildcards in production
4. **JWT Secrets** - Use strong, randomly generated secrets (minimum 32 characters)
5. **Secure Cookies** - Access tokens are set with `httpOnly`, `secure`, `sameSite` flags
6. **SQL Injection** - Use TypeORM parameterized queries (no string concatenation)
7. **Sensitive Data** - Redact tokens in logs and error messages
8. **Rate Limiting** - Consider implementing rate limiting for OAuth endpoints
9. **CSRF Protection** - Validate state parameters in OAuth callbacks
10. **Dependency Updates** - Regularly update dependencies: `npm audit fix`

## 🔧 Troubleshooting

### "Missing Google OAuth environment variables"

**Issue:** Application fails to start with this error.

**Solution:**
```bash
# Verify .env file exists and contains:
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
echo $GOOGLE_REDIRECT_URI

# If empty, update .env with correct values from Google Cloud Console
```

### Database Connection Failed

**Issue:** "Error: connect ECONNREFUSED 127.0.0.1:5432"

**Solution:**
```bash
# Check PostgreSQL is running
docker ps | grep postgres
# or
psql -U postgres -d postgres -c "SELECT 1"

# Verify DB_HOST and DB_PORT in .env
```

### Port Already in Use

**Issue:** "Error: listen EADDRINUSE :::3000"

**Solution:**
```bash
# Use different port
PORT=3001 npm run dev

# Or kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Migrations Failed

**Issue:** "Error executing migration"

**Solution:**
```bash
# Rebuild and run migrations
npm run build
npm run typeorm migration:run

# Or reset in development (warning: deletes data)
rm -rf src/database/migrations/*
npm run dev
```

### JWT Token Invalid

**Issue:** "Invalid token" errors

**Solution:**
```bash
# Regenerate JWT_SECRET
openssl rand -base64 32

# Update .env and restart server
npm run dev
```

### Google Callback Fails

**Issue:** "OAuth login failed" or redirect loop

**Solution:**
1. Verify `GOOGLE_REDIRECT_URI` matches exactly in Google Cloud Console
2. Check `FRONTEND_URL` is reachable from your network
3. Inspect browser console for redirect URL details
4. Check server logs: `npm run dev` and look for error messages

## 📚 API Documentation

When the server is running, visit:

```
http://localhost:3000/api/docs
```

Full Swagger/OpenAPI documentation is automatically generated.

## 🤝 Contributing

When making changes:

1. Ensure no `any` types in TypeScript code
2. Run linter: `npm run lint`
3. Format code: `npm run format`
4. Add tests for new features
5. Commit with conventional messages: `feat:`, `fix:`, `docs:`

## 📄 License

UNLICENSED - Proprietary FlowBrand Technology

---

**Last Updated:** May 2026  
**Maintainer:** FlowBrand Team
