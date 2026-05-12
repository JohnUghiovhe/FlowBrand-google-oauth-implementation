# FlowBrand Google OAuth 2.0 Implementation

Standalone NestJS server for FlowBrand Google OAuth 2.0 authentication, with Swagger UI testing, optional database support, and Railway deployment support.

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Server](#-running-the-server)
- [API Endpoints](#-api-endpoints)
- [Testing with Swagger UI](#-testing-with-swagger-ui)
- [Authorization Workflows](#-authorization-workflows)
- [Railway Deployment](#-railway-deployment)
- [Project Structure](#-project-structure)
- [Database](#-database)
- [Security Considerations](#-security-considerations)
- [Troubleshooting](#-troubleshooting)

## ⚡ Quick Start

```bash
npm install
npm run start:dev
```

Open Swagger UI at `http://localhost:3010/api/docs`.

For instant token testing, use `POST /api/v1/test/oauth-flow-simulation` in Swagger.

## ✨ Features

- Google OAuth 2.0 with Passport.js
- JWT access tokens and hashed refresh tokens
- Redis-backed session caching
- Optional PostgreSQL support, with mocked providers for local testing
- Swagger UI with OAuth 2.0 configuration and test endpoints
- RFC-compliant OAuth users start with `is_verified: false`
- Dockerfile and Railway deployment guide included

## 🛠 Tech Stack

- NestJS 11 + Express
- TypeScript 5.7
- Passport.js, @nestjs/jwt, swagger-ui-express
- TypeORM 0.3.x, PostgreSQL, ioredis
- Jest, ESLint (flat config), Prettier

## 📦 Prerequisites

- Node.js 18+
- npm 9+ or Yarn 3+
- Google OAuth app credentials
- PostgreSQL and Redis only if you want persistence in your environment

## 🚀 Installation

```bash
git clone <repo-url>
cd FlowBrand-Google-Oauth-Implementation
npm install
```

Create a `.env` file from your existing values or from the example below.

## ⚙️ Configuration

Required environment variables:

- `PORT`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `FRONTEND_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_EXPIRY_TIMEFRAME`
- `JWT_REFRESH_EXPIRY_TIMEFRAME`
- `REDIS_HOST`
- `REDIS_PORT`

Optional database variables:

- `DB_TYPE`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_DATABASE`

Production reminder:
- Set `GOOGLE_REDIRECT_URI` to `https://<your-domain>/api/v1/auth/google/callback`
- Use strong random JWT secrets
- Use Railway HTTPS URLs in production

## 🏃 Running the Server

```bash
# Development with watch
npm run start:dev

# Production build
npm run build
npm run start

# Tests
npm run test
npm run test:watch
npm run test:cov
```

## 📡 API Endpoints

### OAuth

- `GET /api/v1/auth/google` - start Google OAuth
- `GET /api/v1/auth/google/callback` - OAuth callback

### Testing and playground

- `GET /api/v1/test/health` - health check
- `GET /api/v1/test/config-check` - config status
- `GET /api/v1/test/oauth-endpoints` - list auth endpoints
- `GET /api/v1/test/auth-code-guide` - token acquisition guide
- `POST /api/v1/test/oauth-flow-simulation` - instant token simulation
- `GET /api/v1/test/session-info` - token/session inspection

## 🧪 Testing with Swagger UI

Swagger UI is available at `http://localhost:3010/api/docs` and in production at `https://<your-railway-domain>/api/docs`.

Local workflow:
1. Open Swagger UI.
2. Run `GET /api/v1/test/health` to verify the app is up.
3. Run `POST /api/v1/test/oauth-flow-simulation` to get an `access_token` and `refresh_token` instantly.
4. Click the green **Authorize** button.
5. Paste the access token into the bearer field or use the OAuth2 option for real Google sign-in.
6. Retry the protected or auth-aware endpoints.

## ✅ Authorization Workflows

There are three practical ways to test auth:

1. **Real Google OAuth** - use `GET /api/v1/auth/google`, then complete the Google consent flow.
2. **Swagger OAuth2 button** - use the built-in Swagger Authorize modal for an interactive flow.
3. **Simulation endpoint** - use `POST /api/v1/test/oauth-flow-simulation` for fast local and CI testing.

The guide endpoint `GET /api/v1/test/auth-code-guide` explains all three in more detail.

## 🚀 Railway Deployment

Railway-ready files are included:
- `Dockerfile`
- `.github/workflows/deploy-railway.yml`
- `RAILWAY_DEPLOYMENT.md`

Minimum Railway setup:
1. Create a Railway project and connect the GitHub repo.
2. Add the env vars from the configuration section.
3. Set `GOOGLE_REDIRECT_URI` to the Railway callback URL.
4. Deploy and verify `https://<your-domain>/api/docs`.

If you want step-by-step setup and production testing details, open [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md).

## 📁 Project Structure

Key files and folders:

```text
src/
  main.ts
  app.module.ts
  modules/auth/
    auth.controller.ts
    test.controller.ts
    auth.service.ts
    session.service.ts
    strategies/
README.md
Dockerfile
RAILWAY_DEPLOYMENT.md
.github/workflows/deploy-railway.yml
```

## 🗄️ Database

- PostgreSQL is optional in this setup.
- OAuth flow works with mocked providers when the database is unavailable.
- Refresh tokens are hashed and cached in Redis under `refresh:<sessionId>`.
- New OAuth users are created with `is_verified: false` to stay RFC-compliant.

## 🔒 Security Considerations

- Use HTTPS in production.
- Keep `.env` out of version control.
- Use strong JWT secrets and rotate them regularly.
- Keep OAuth callback URLs exact and limited to your deployed domains.
- Treat access tokens as HttpOnly cookies and avoid logging sensitive values.
- Validate state and redirect URIs in OAuth callbacks.

## 🔧 Troubleshooting

- **Swagger not loading:** confirm the server is running on port 3010 and open `/api/docs`.
- **OAuth errors:** verify Google client ID, secret, and redirect URI.
- **Token testing:** use `POST /api/v1/test/oauth-flow-simulation` if real OAuth is not needed.
- **Database connection errors:** the app can run without PostgreSQL for testing.
- **Railway redirect mismatch:** update `GOOGLE_REDIRECT_URI` to the Railway domain callback URL and mirror it in Google Cloud Console.

## 📄 License

UNLICENSED
