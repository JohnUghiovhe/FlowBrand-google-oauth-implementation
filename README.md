# FlowBrand Google OAuth 2.0 Implementation

A standalone, production-ready NestJS server implementing Google OAuth 2.0 authentication for the FlowBrand platform with built-in Swagger UI testing and Railway deployment support.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
- [Testing with Swagger UI](#testing-with-swagger-ui)
- [Authorization Workflows](#authorization-workflows)
- [Railway Deployment](#railway-deployment)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Database](#database)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

## ⚡ Quick Start

### 5-Minute Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run start:dev

# 3. Open Swagger UI
open http://localhost:3010/api/docs

# 4. Test OAuth endpoint (instant, no Google account needed)
# In Swagger: POST /api/v1/test/oauth-flow-simulation
# Response includes access_token and refresh_token
```

**Ready to test? Head to [Testing with Swagger UI](#testing-with-swagger-ui)**

## ✨ Features

- **Google OAuth 2.0 Integration** - Seamless Google sign-in using Passport.js with state validation
- **JWT Authentication** - Secure token-based auth with 1-hour access tokens, 7-day refresh tokens
- **Redis Session Caching** - Hashed refresh tokens stored in Redis for performance
- **PostgreSQL Database** - Optional persistent user/session storage (can run without database)
- **TypeScript Strict Mode** - Full type safety without `any` types
- **Comprehensive Testing Endpoints** - Mock OAuth flow simulation, health checks, config validation
- **Swagger/OpenAPI Documentation** - OAuth 2.0 configured, interactive testing with "Authorize" button
- **Production-Ready Deployment** - Dockerfile included, Railway/Docker deployment instructions
- **Environment Validation** - Joi schema validation for configuration
- **CORS Support** - Cross-origin request handling with configurable origins
- **Error Handling** - Standardized exception filters and guards
- **Request/Response Interceptors** - Standardized response format
- **RFC Compliance** - New OAuth users have `is_verified: false` (no auto-email verification)

## 🛠 Tech Stack


## 📦 Prerequisites
- **Framework:** NestJS 11 (Express adapter)
- **Language:** TypeScript 5.7 (strict mode)
- **Database:** PostgreSQL (optional) with TypeORM 0.3.x
- **Caching:** Redis (ioredis v5.3.2) for session token storage
- **Authentication:** Passport.js v0.7 (Google OAuth 2.0, JWT)
- **JWT:** @nestjs/jwt v11.0.2 with secure signing
- **Testing:** Jest with ts-jest
- **Linting:** ESLint (flat config)
- **Formatting:** Prettier
- **API Docs:** Swagger/OpenAPI 3.0 with OAuth 2.0 flow
- **Deployment:** Docker, Railway-ready
- **Validation:** Joi, class-validator, class-transformer
- npm >= 9.x or yarn >= 3.x
- PostgreSQL >= 12
- Docker & Docker Compose (optional, for containerized PostgreSQL)
### Run Tests
- Google OAuth Application (credentials from Google Cloud Console)
```bash
# Run all tests
npm run test

# Watch mode (re-run on changes)
npm run test:watch

# Coverage report
npm run test:cov
```

### Optional Database
### Create Tests
⚠️ **Database is optional** - Server runs without PostgreSQL (with mocked providers).

To enable PostgreSQL:
1. Update `.env`: Set `DATABASE_URL` or `DB_*` variables
2. Restart server
3. Uncomment `TypeOrmModule` in `src/app.module.ts` (currently commented out)
4. Run migrations: `npm run typeorm migration:run`

To run without database (default):
- All user data is mocked
- Refresh tokens stored only in Redis
- Perfect for development and testing

### Entities

#### User Entity (`users` table)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR(255) | Unique email address |
| full_name | VARCHAR(100) | User's full name |
| password | TEXT | Hashed password (null for OAuth users) |
| auth_provider | VARCHAR(20) | 'google' or 'email' |
| provider_user_id | TEXT | Provider-specific user ID (Google ID) |
| avatar_url | TEXT | Profile picture URL |
| is_verified | BOOLEAN | **RFC Compliance:** False for new OAuth users (no auto-verification) |
| is_active | BOOLEAN | Account active status |
| terms_accepted | BOOLEAN | Terms acceptance |
| otp_code | VARCHAR(6) | OTP for email verification |
| expires_at | TIMESTAMP | OTP expiration |
| created_at | TIMESTAMP | Created timestamp |
| updated_at | TIMESTAMP | Updated timestamp |
| deleted_at | TIMESTAMP | Soft delete timestamp |

#### UserSession Entity (`user_sessions` table)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| refresh_token_hash | TEXT | Hashed refresh token (stored in DB) |
| expires_at | TIMESTAMP | Token expiration (7 days) |
| is_revoked | BOOLEAN | Revocation status |
| created_at | TIMESTAMP | Created timestamp |

#### Redis Session Cache

Refresh tokens stored temporarily in Redis for performance:
- **Key:** `refresh:<sessionId>`
- **Value:** Hashed refresh token
- **TTL:** 7 days
- **Purpose:** Fast token validation without database queries
Tests use `.spec.ts` extension next to implementation:

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
## 📡 API Endpoints

### OAuth Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/api/v1/auth/google` | Initiate Google OAuth flow | ❌ |
| GET | `/api/v1/auth/google/callback` | OAuth callback (Google redirects here) | ❌ |

### Testing & Playground Endpoints (Development)

These endpoints are provided for local development and Swagger UI testing:

| Method | Endpoint | Description | Purpose |
|--------|----------|-------------|---------|
| GET | `/api/v1/test/health` | Server health check | Verify server is running |
| GET | `/api/v1/test/config-check` | Check required environment variables | Debug missing config |
| GET | `/api/v1/test/oauth-endpoints` | List all OAuth endpoints | API reference |
| GET | `/api/v1/test/auth-code-guide` | **Comprehensive authorization guide** | Learn 3 ways to get tokens |
| POST | `/api/v1/test/oauth-flow-simulation` | **Simulate OAuth flow (instant tokens)** | Get access/refresh tokens without Google |
| GET | `/api/v1/test/session-info` | Check session/token status | Verify authentication |

### OAuth Flow Simulation Endpoint (⭐ Fastest for Testing)

**POST** `/api/v1/test/oauth-flow-simulation`

Request body:
```json
{
  "email": "test@example.com",
  "full_name": "Test User",
  "provider": "google",
  "providerId": "google-user-123",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

Response (200 OK):
```json
{
  "status_code": 200,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "ef586de76459c416a3cbe6f86b47f8e7...",
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "full_name": "Test User",
    "auth_provider": "google",
    "is_verified": false
  }
}
```

**Use this endpoint for:**
- ✅ Instant local testing (no Google account needed)
- ✅ Development & iteration
- ✅ CI/CD automated tests
- ✅ Swagger UI token generation

### Real OAuth Flow

1. **Initiate:** `GET /api/v1/auth/google` (redirects to Google)
2. **Callback:** Google redirects to `/api/v1/auth/google/callback`
3. **Result:** Access token + refresh token set as HttpOnly cookies
4. **Testing:** Use Swagger UI "Authorize" button (handles cookies automatically)

**Use this for:**
- ✅ Production-like testing
- ✅ Integration testing
- ✅ Manual QA with real Google account

### Standard Response Format

**Success (200 OK):**
```json
{
  "status_code": 200,
  "message": "Success message",
  "data": { /* endpoint-specific data */ }
}
```

**Error (4xx/5xx):**
```json
{
  "status_code": 400,
  "error": "Bad Request",
  "message": "Detailed error message"
}
```

## 🧪 Testing

### Run Tests
## 🧪 Testing with Swagger UI

### Overview

The project includes an interactive Swagger UI at **`http://localhost:3010/api/docs`** with:
- ✅ OAuth 2.0 configured with "Authorize" button
- ✅ Comprehensive authorization guide endpoint
- ✅ OAuth flow simulation endpoint (instant tokens)
- ✅ Real-time API testing for all endpoints
- ✅ Response schemas and examples

### Local Testing Workflows

#### Workflow 1: Instant Testing (Recommended) ⭐

1. **Open Swagger UI**
  ```
  http://localhost:3010/api/docs
  ```

2. **Get Tokens Instantly** (no Google account needed)
  - Find: `POST /api/v1/test/oauth-flow-simulation`
  - Click "Try it out"
  - Click "Execute"
  - Response includes: `access_token`, `refresh_token`, user data
  - ⏱️ Takes <1 second

3. **Add Token to Swagger**
  - Copy `access_token` from response
  - Click green "Authorize" button (top-right)
  - Select "bearer" tab
  - Paste token in "Value" field
  - Click "Apply credentials"

4. **Test Other Endpoints**
  - All endpoints now include the token automatically
  - Try `GET /api/v1/test/health`, `/api/v1/test/config-check`, etc.

#### Workflow 2: Real Google OAuth Testing

1. **Open Swagger UI**
  ```
  http://localhost:3010/api/docs
  ```

2. **Authenticate with Google**
  - Click green "Authorize" button
  - Select "OAuth2" tab
  - Fill in `client_id` and `client_secret` (optional for public apps)
  - Select scopes: `email`, `profile`
  - Click "Authorize"
  - Browser redirects to Google login
  - Grant permissions
  - Tokens automatically set in cookies

3. **Test Endpoints**
  - All requests now include the token
  - Response headers show `Set-Cookie` with access_token

**ℹ️ Note:** Tokens are HttpOnly cookies (secure, not extractable). Swagger UI handles this automatically.

#### Workflow 3: Manual Testing with curl

**Get tokens:**
```bash
curl -X POST http://localhost:3010/api/v1/test/oauth-flow-simulation \
  -H "Content-Type: application/json" \
  -d '{
   "email": "test@example.com",
   "full_name": "Test User",
   "provider": "google",
   "providerId": "123",
   "avatar_url": "https://example.com/avatar.jpg"
  }'
```

**Use token in requests:**
```bash
curl -X GET http://localhost:3010/api/v1/test/health \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Production Testing (After Railway Deployment)

1. **Open Swagger in Production**
  ```
  https://<your-railway-domain>/api/docs
  ```

2. **Use Same Workflows**
  - Instant testing: POST to `/api/v1/test/oauth-flow-simulation`
  - Real OAuth: Click "Authorize" button
  - Manual curl: Replace `localhost:3010` with your Railway domain

3. **Verify OAuth Callback**
  - Configure Google Cloud Console with your Railway domain:
    ```
    https://<your-railway-domain>/api/v1/auth/google/callback
    ```
  - Test the real OAuth flow:
    ```
    https://<your-railway-domain>/api/v1/auth/google
    ```
  - After Google authentication, check for tokens in cookies

## ✅ Authorization Workflows

### Get Authorization Codes / Access Tokens

The **`GET /api/v1/test/auth-code-guide`** endpoint provides comprehensive documentation on 3 ways to get tokens. Access it via Swagger or:

```bash
curl http://localhost:3010/api/v1/test/auth-code-guide
```

**Three Methods:**

| Method | Duration | Google Account? | Best For |
|--------|----------|-----------------|----------|
| **Real OAuth** (Swagger Authorize button) | 30-60 sec | ✅ Required | Production testing, staging, manual QA |
| **Simulation Endpoint** (POST /test/oauth-flow-simulation) | <1 sec | ❌ Not needed | Development, CI/CD, instant iteration |
| **OAuth2 Flow** (Swagger OAuth2 config) | 30-60 sec | ✅ Required | Interactive Swagger testing |

**Quick Decision:**
- **Local development?** → Use simulation endpoint ⭐
- **Production-like testing?** → Use real OAuth
- **CI/CD pipelines?** → Use simulation endpoint

## 🚀 Railway Deployment

### Prerequisites
- Railway account (https://railway.app)
- GitHub repository (this project)
- Google OAuth credentials with production domain added

### One-Click Setup (Recommended)

1. **Connect GitHub to Railway**
  - Log into Railway
  - Create new Project
  - Connect repository
  - Railway auto-detects Dockerfile and builds image

2. **Configure Environment Variables**
  - Go to Project Settings → Variables
  - Add all required variables (see Environment Variables section)
  - Pay special attention to: `GOOGLE_REDIRECT_URI` must include your Railway domain

3. **Deploy**
  - Railway automatically deploys on push to main branch
  - Watch deployment logs in Railway dashboard
  - Your app is live at `https://<your-railway-domain>`

### Environment Variables for Railway

Set these in Railway project settings:

```
# Server
PORT=3010
NODE_ENV=production
PROFILE=production

# Google OAuth (update redirect URI for your domain)
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_REDIRECT_URI=https://<your-railway-domain>/api/v1/auth/google/callback

# Frontend
FRONTEND_URL=https://<your-frontend-domain>

# JWT (use strong random values)
JWT_SECRET=<generate with: openssl rand -base64 32>
JWT_REFRESH_SECRET=<generate with: openssl rand -base64 32>
JWT_EXPIRY_TIMEFRAME=3600000
JWT_REFRESH_EXPIRY_TIMEFRAME=604800000

# Redis (can use Railway's Redis add-on)
REDIS_HOST=<from Railway Redis plugin>
REDIS_PORT=<from Railway Redis plugin>

# Database (optional - can use Railway PostgreSQL add-on)
DB_TYPE=postgres
DB_HOST=<from Railway PostgreSQL plugin>
DB_PORT=5432
DB_USER=<from Railway PostgreSQL plugin>
DB_PASSWORD=<from Railway PostgreSQL plugin>
DB_DATABASE=flowbrand
```

### Manual Deployment (CLI)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Set variables
railway variable set GOOGLE_CLIENT_ID=<value>
railway variable set GOOGLE_CLIENT_SECRET=<value>
# ... set all variables

# Deploy
railway up
```

### Testing on Railway

1. **Verify Deployment**
  ```bash
  curl https://<your-railway-domain>/api/v1/test/health
  ```

2. **Open Swagger UI**
  ```
  https://<your-railway-domain>/api/docs
  ```

3. **Test OAuth Flow**
  - POST to `/api/v1/test/oauth-flow-simulation` for instant tokens
  - Or use "Authorize" button for real Google OAuth

### Full Deployment Documentation

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed step-by-step instructions.

## 🧪 Unit & Integration Tests

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
.
├── .github/
│   └── workflows/
│       └── deploy-railway.yml     # GitHub Actions for Railway deployment
├── config/
│   ├── auth.config.ts            # OAuth & JWT configuration
│   └── server.config.ts          # Server configuration
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts      # Real OAuth endpoints
│   │   │   ├── test.controller.ts      # Testing endpoints (new)
│   │   │   ├── auth.service.ts         # OAuth flow orchestration
│   │   │   ├── session.service.ts      # Refresh token management
│   │   │   ├── queue.service.ts        # Email queue management
│   │   │   ├── auth.module.ts
│   │   │   ├── entities/
│   │   │   │   └── user-session.entity.ts
│   │   │   ├── dto/
│   │   │   │   └── google-oauth.dto.ts
│   │   │   └── strategies/
│   │   │       ├── google.strategy.ts
│   │   │       └── jwt.strategy.ts
│   │   ├── redis/
│   │   │   ├── redis.module.ts    # Redis provider
│   │   │   └── redis.service.ts   # Session caching
│   │   └── user/
│   │       ├── user.controller.ts
│   │       ├── user.service.ts
│   │       └── entities/
│   │           └── user.entity.ts
│   ├── shared/
│   │   ├── constants/
│   │   ├── helpers/
│   │   │   ├── skipAuth.ts               # Skip auth decorator
│   │   │   └── http-exception-filter.ts
│   │   └── interceptors/
│   │       └── response.interceptor.ts
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── super-admin.guard.ts
│   ├── database/
│   │   ├── data-source.ts
│   │   └── migrations/
│   │       └── InitSchemaFromErd.ts
│   ├── entities/
│   │   └── base.entity.ts
│   ├── app.module.ts
│   ├── app.e2e.spec.ts
│   ├── main.ts
│   ├── health.controller.ts
│   └── probe.controller.ts
├── Dockerfile                  # Multi-stage Docker build for production
├── RAILWAY_DEPLOYMENT.md      # Detailed Railway deployment guide
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
## 🔒 Security Considerations

### Token Management
1. **Access Tokens**
  - JWT format with `kid=none` signature
  - Valid for 1 hour (configurable)
  - Set as HttpOnly, Secure, SameSite cookies
  - Not accessible to JavaScript (XSS protection)

2. **Refresh Tokens**
  - Random 32-byte hex strings
  - Hashed with SHA256 before storage
  - Valid for 7 days (configurable)
  - Stored in Redis for fast validation
  - Can be revoked immediately

3. **RFC 6749 Compliance**
  - New OAuth users have `is_verified: false` (no auto-email verification)
  - Authorization code flow with proper state validation
  - PKCE support recommended for mobile apps

### Best Practices

1. **Environment Variables**
  - Never commit `.env` files
  - Use `.env.example` as template
  - Use `openssl rand -base64 32` for generating secrets
  - Rotate secrets periodically in production

2. **HTTPS & CORS**
  - Enforce HTTPS in production (Railway provides HTTPS)
  - Configure CORS origins explicitly (no wildcards)
  - Validate Referer headers on OAuth callbacks

3. **OAuth Callbacks**
  - Validate state parameter in callback
  - Verify redirect_uri matches configured value
  - Only accept HTTPS callbacks in production
  - Log and audit failed authentication attempts

4. **Database & SQL**
  - Always use TypeORM parameterized queries
  - No string concatenation for SQL
  - Enable SSL for production database connections
  - Encrypt sensitive columns at rest

5. **Logging & Monitoring**
  - Never log tokens or secrets
  - Redact sensitive data in error messages
  - Monitor for rate limit bypasses
  - Alert on suspicious login patterns

6. **Dependencies**
  - Run `npm audit` regularly
  - Keep dependencies updated
  - Review security advisories
  - Use `npm audit fix` to apply patches

7. **Password Management** (if implementing email auth)
  - Bcrypt hashing with salt rounds 10+
  - Never store plaintext passwords
  - Enforce strong password policies
  - Implement login attempt rate limiting

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
