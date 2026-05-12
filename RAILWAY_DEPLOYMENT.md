# Deploying FlowBrand Google OAuth to Railway

This document explains how to deploy the FlowBrand Google OAuth project to Railway and how to test the API using Swagger both locally and in production.

Prerequisites
- A Railway account (https://railway.app)
- GitHub repo connected to Railway (optional — you can use Railway CLI instead)
- Google OAuth credentials (Client ID, Client Secret) configured for your production domain
- Railway CLI (optional): `npm install -g @railway/cli` or `npm i -g railway`

Required environment variables
Set these in Railway's Environment variables (Project Settings → Variables). Use the same names as in `.env`:

- `PORT` (e.g. `3010`)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (e.g. `https://<your-railway-domain>/api/v1/auth/google/callback`)
- `FRONTEND_URL` (your frontend origin)
- `REDIS_HOST`, `REDIS_PORT` (or use Railway Redis plugin)
- Database vars if enabling DB: `DB_TYPE`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRY_TIMEFRAME`, `JWT_REFRESH_EXPIRY_TIMEFRAME`

Notes on Google OAuth redirect URI
- Update your Google Cloud Console OAuth credentials to include the Railway domain callback: `https://<your-railway-domain>/api/v1/auth/google/callback`.

Option A — Deploy via Railway GitHub Integration (recommended)
1. Push this repository to GitHub.
2. In Railway dashboard: Create Project → Add Service → Deploy from GitHub.
3. Select the repository and branch (`main`/`master`/`clean-main`).
4. In Railway service settings, set the Environment Variables listed above.
5. Ensure Build Command: `npm ci && npm run build`
6. Ensure Start Command: `npm run start` (the project exposes port from `PORT` env var; Railway will map it)
7. Deploy — Railway will build the Docker image automatically.

Option B — Deploy using Railway CLI
1. Install Railway CLI: `npm i -g @railway/cli`.
2. Login: `railway login` (or `railway login --token <token>` for CI).
3. Initialize (if you haven't): `railway init` — link to an existing project or create a new one.
4. Ensure environment variables are set in the project via `railway variables set KEY=value` or in the dashboard.
5. Deploy: `railway up` (or `railway up --detach` in CI).

Docker support
- This repo includes a `Dockerfile` that builds the app and exposes port `3010`. Railway will use the Dockerfile if present.

CI/CD (GitHub Actions)
- A template workflow `.github/workflows/deploy-railway.yml` is included. It expects a repository secret `RAILWAY_TOKEN` (the Railway API token) to be created in GitHub Secrets. The action logs in to Railway and runs `railway up`.

Production testing with Swagger
1. Open your Railway service URL: `https://<your-railway-domain>` and append `/api/docs` → e.g. `https://<your-railway-domain>/api/docs`
2. Use the green **Authorize** button (top-right) and select `OAuth2` to start the authorization code flow with Google.
3. The OAuth flow will redirect to Google and back to `GOOGLE_REDIRECT_URI`. On success, tokens are issued and protected endpoints will be accessible in Swagger.

Notes about HttpOnly cookies and token extraction
- In production the access token is set as an HttpOnly cookie; browsers do not expose it to JavaScript. Use the Swagger Authorize button to perform the OAuth dance and let the UI send cookies with requests.
- For automated testing or CI, use the simulation endpoint: `POST /api/v1/test/oauth-flow-simulation` which returns an `access_token` in the JSON response. Copy that token and paste into Swagger's bearer input if needed.

Local testing (before deploy)
1. Create a `.env` file in repo root (example already present).
2. Run in development: `npm run start:dev` and open `http://localhost:3010/api/docs`.
3. Use either the **Authorize** button (real Google flow) or `POST /api/v1/test/oauth-flow-simulation` for instant tokens.

Security recommendations for production
- Use strong random values for `JWT_SECRET` and `JWT_REFRESH_SECRET`.
- Enable HTTPS (Railway provides HTTPS by default).
- Restrict `GOOGLE_REDIRECT_URI` to your production domain in Google Cloud Console.
- Consider rotating refresh tokens and implementing refresh endpoint for token renewal.

Troubleshooting
- If Swagger shows authorization errors, verify `GOOGLE_CLIENT_ID/SECRET` and redirect URI are correct.
- If tokens are not being attached in Swagger, ensure `oauth2RedirectUrl` matches Railway's `/api/docs/oauth2-redirect.html` if needed (this repo configures that).

Contact
- If you want, I can also add a ready-to-run GitHub Actions workflow that uses a known Railway action (I left a generic CLI-based workflow in `.github/workflows/deploy-railway.yml`).
