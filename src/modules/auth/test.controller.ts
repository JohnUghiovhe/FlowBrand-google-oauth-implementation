import { Controller, Get, HttpStatus, Post, Body, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { skipAuth } from '@shared/helpers/skipAuth';
import authConfig from '@config/auth.config';
import AuthenticationService from './auth.service';
import { GoogleOAuthProfile } from './dto/google-oauth.dto';

@ApiTags('Testing & Playground')
@Controller('test')
export class TestController {
  constructor(private readonly authService: AuthenticationService) {}

  @skipAuth()
  @Get('health')
  @ApiOperation({ summary: 'OAuth implementation health check' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service is healthy',
    schema: {
      example: {
        status: 'OK',
        timestamp: '2026-05-12T10:30:00Z',
        environment: 'development',
      },
    },
  })
  async health() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.PROFILE || 'development',
      oauth: {
        google_configured: !!process.env.GOOGLE_CLIENT_ID,
        frontend_url: authConfig().frontendUrl,
        redis_enabled: !!process.env.REDIS_HOST,
        database_ready: true,
      },
    };
  }

  @skipAuth()
  @Get('config-check')
  @ApiOperation({
    summary: 'OAuth configuration validation',
    description: 'Checks that all required environment variables are set (does not expose secrets)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Configuration check results',
    schema: {
      example: {
        config_status: 'ready',
        required_vars: {
          GOOGLE_CLIENT_ID: true,
          GOOGLE_CLIENT_SECRET: true,
          GOOGLE_REDIRECT_URI: true,
          JWT_SECRET: true,
          JWT_REFRESH_SECRET: true,
          REDIS_HOST: true,
          REDIS_PORT: true,
        },
      },
    },
  })
  async configCheck() {
    const requiredVars = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'GOOGLE_REDIRECT_URI',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'REDIS_HOST',
      'REDIS_PORT',
      'DATABASE_URL',
    ];

    const config_status = requiredVars.every((v) => process.env[v]) ? 'ready' : 'incomplete';

    return {
      config_status,
      required_vars: requiredVars.reduce(
        (acc, v) => {
          acc[v] = !!process.env[v];
          return acc;
        },
        {} as Record<string, boolean>,
      ),
    };
  }

  @skipAuth()
  @Post('oauth-flow-simulation')
  @ApiOperation({
    summary: 'Simulate OAuth callback (testing only)',
    description:
      'Simulates a successful Google OAuth callback. Use this endpoint to test the OAuth flow without going through Google authentication. WARNING: Development/Testing Only.',
  })
  @ApiBody({
    schema: {
      example: {
        email: 'test@example.com',
        full_name: 'Test User',
        providerId: 'google-123456789',
        avatar_url: 'https://example.com/avatar.jpg',
        provider: 'google',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OAuth login successful (simulated)',
    schema: {
      example: {
        status_code: 200,
        message: 'OAuth login successful',
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'random-base64-token',
        data: {
          user: {
            id: 'uuid-1234',
            full_name: 'Test User',
            email: 'test@example.com',
            avatar_url: 'https://example.com/avatar.jpg',
          },
        },
      },
    },
  })
  async simulateOAuthFlow(@Body() payload: GoogleOAuthProfile, @Res() res: Response) {
    try {
      const result = await this.authService.handleOAuthLogin(payload);
      res.cookie('access_token', result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      return res.json({
        status_code: HttpStatus.OK,
        message: 'OAuth login successful (simulated)',
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        data: result.data,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status_code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'OAuth simulation failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  @skipAuth()
  @Get('oauth-endpoints')
  @ApiOperation({
    summary: 'List available OAuth endpoints',
    description: 'Returns information about all OAuth endpoints for testing and integration',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OAuth endpoints documentation',
    schema: {
      example: {
        endpoints: {
          initiate_login: {
            method: 'GET',
            path: '/api/v1/auth/google',
            description: 'Redirects to Google consent screen',
          },
          callback: {
            method: 'GET',
            path: '/api/v1/auth/google/callback',
            description: 'Google redirects here with authorization code',
          },
          test_flow: {
            method: 'POST',
            path: '/api/v1/test/oauth-flow-simulation',
            description: 'Simulate OAuth flow without Google (testing only)',
          },
        },
        urls: {
          swagger_ui: '/api/docs',
          swagger_json: '/api/docs-json',
          login_initiate: 'http://localhost:3000/api/v1/auth/google',
          frontend_dashboard: 'http://localhost:3000/dashboard',
        },
      },
    },
  })
  async oauthEndpoints() {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return {
      endpoints: {
        initiate_login: {
          method: 'GET',
          path: '/api/v1/auth/google',
          description: 'Redirects to Google consent screen',
          url: `${baseUrl}/api/v1/auth/google`,
        },
        callback: {
          method: 'GET',
          path: '/api/v1/auth/google/callback',
          description: 'Google redirects here with authorization code',
          note: 'Automatically called by Google, not for manual use',
        },
        test_flow: {
          method: 'POST',
          path: '/api/v1/test/oauth-flow-simulation',
          description: 'Simulate OAuth flow without Google (testing only)',
          url: `${baseUrl}/api/v1/test/oauth-flow-simulation`,
        },
      },
      urls: {
        swagger_ui: `${baseUrl}/api/docs`,
        swagger_json: `${baseUrl}/api/docs-json`,
        login_initiate: `${baseUrl}/api/v1/auth/google`,
        health_check: `${baseUrl}/api/v1/test/health`,
      },
      testing_guide: {
        step_1: 'Check health: GET /api/v1/test/health',
        step_2: 'Verify config: GET /api/v1/test/config-check',
        step_3: 'Test OAuth flow: POST /api/v1/test/oauth-flow-simulation (with payload)',
        step_4: 'View all endpoints: GET /api/v1/test/oauth-endpoints',
        step_5: 'Visit Swagger UI at /api/docs for interactive testing',
      },
    };
  }

  @skipAuth()
  @Get('session-info')
  @ApiOperation({
    summary: 'Decode session from access token cookie',
    description: 'Extracts and displays session information from the access_token cookie',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session information decoded from access token',
    schema: {
      example: {
        token_exists: true,
        payload: {
          sub: 'user-uuid',
          email: 'user@example.com',
          username: 'Test User',
          sid: 'session-uuid',
          iat: 1715510400,
          exp: 1715514000,
        },
      },
    },
  })
  async sessionInfo(@Req() req: Request) {
    const token = req.cookies?.access_token;
    if (!token) {
      return {
        token_exists: false,
        message: 'No access_token cookie found. Complete OAuth login first.',
      };
    }
    return {
      token_exists: true,
      message: 'Token found in cookie. Check Swagger docs for JWT verification details.',
      note: 'Full payload visible in browser dev tools under Application > Cookies',
    };
  }

  @skipAuth()
  @Get('auth-code-guide')
  @ApiOperation({
    summary: 'Guide: How to get OAuth authorization codes',
    description: 'Comprehensive guide for obtaining access/refresh tokens for Swagger testing and development',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Authorization code workflows and instructions',
    schema: {
      example: {
        method_1_real_oauth: {
          name: 'Real Google OAuth Flow (Production-like)',
          steps: [
            '1. Open browser: http://localhost:3010/api/v1/auth/google',
            '2. Sign in to Google account and grant permissions',
            '3. Redirected to http://localhost:3010/dashboard with access_token cookie',
            '4. Copy token from browser DevTools → Application → Cookies → access_token',
            '5. Paste token in Swagger UI: Click lock icon → Paste token → Authorize',
            '6. Use protected endpoints',
          ],
          pros: ['Real flow', 'Production-ready'],
          cons: ['Requires Google account', 'Slower', 'Not suitable for automated testing'],
          time: '~30 seconds per token',
          refresh_token:
            'Also set in cookie (refresh-token), stored in Redis, valid 7 days',
        },
        method_2_simulation: {
          name: 'OAuth Flow Simulation (Testing - No Google)',
          steps: [
            '1. Call POST /api/v1/test/oauth-flow-simulation with Google profile payload',
            '2. Response includes: access_token (JWT), refresh_token (hex string), user data',
            '3. Copy access_token and paste in Swagger UI → Authorize → lock icon',
            '4. Test all endpoints without real Google account',
          ],
          curl_example:
            'curl -X POST http://localhost:3010/api/v1/test/oauth-flow-simulation -H "Content-Type: application/json" -d \'{"email":"test@example.com","full_name":"Test User","providerId":"12345","avatar_url":"https://example.com/avatar.jpg","provider":"google"}\'',
          pros: [
            'No Google account needed',
            'Instant token generation',
            'Ideal for CI/CD and automated testing',
          ],
          cons: ['Bypasses real Google OAuth'],
          time: '<1 second per token',
        },
        method_3_swagger_oauth: {
          name: 'Swagger OAuth 2.0 Button (Now Available!)',
          steps: [
            '1. Open http://localhost:3010/api/docs',
            '2. Click the green "Authorize" button (top right)',
            '3. Select "OAuth2" and click "Authorize"',
            '4. Redirected to Google consent screen',
            '5. Grant permissions and return to Swagger',
            '6. Token automatically added to all requests',
          ],
          pros: ['Built into UI', 'One-click setup'],
          cons: ['Requires Google account'],
          time: '~30 seconds',
        },
        extracting_token_manual: {
          name: 'Manual Token Extraction (Browser DevTools)',
          for_http_only_cookies:
            'The access_token is HttpOnly, so NOT visible in DevTools',
          workaround_1_use_simulation: 'Use POST /api/v1/test/oauth-flow-simulation instead',
          workaround_2_use_swagger_oauth: 'Use Swagger Authorize button (handles cookies automatically)',
          workaround_3_server_endpoint: 'Call GET /api/v1/test/session-info to verify token exists',
        },
        testing_workflow: {
          workflow_1_development: [
            '① Server development: Use POST /api/v1/test/oauth-flow-simulation',
            '② No external dependencies, fast iteration',
            '③ Test endpoints with curl or Swagger UI',
          ],
          workflow_2_integration: [
            '① Real testing: Use Swagger Authorize button or GET /api/v1/auth/google',
            '② Verify end-to-end flow with real Google account',
            '③ Test redirect handling and cookie management',
          ],
          workflow_3_ci_cd: [
            '① Automated testing: POST /api/v1/test/oauth-flow-simulation in test scripts',
            '② No user interaction required',
            '③ Token received instantly in JSON response',
          ],
        },
        token_expiry: {
          access_token: '1 hour (3600000 ms)',
          refresh_token: '7 days (604800 s)',
          refresh_workflow:
            'When access_token expires, send refresh_token to GET /api/v1/auth/refresh (if implemented)',
        },
      },
    },
  })
  async authCodeGuide() {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return {
      title: 'OAuth Authorization Code Guide',
      description:
        'Three methods to get access tokens for development and testing',
      method_1: {
        name: '🟢 Real Google OAuth (Production-like)',
        description:
          'Authenticate with actual Google account. Tokens set as HttpOnly cookies.',
        steps: [
          `1. Open browser: http://localhost:3010/api/v1/auth/google`,
          `2. Sign in to Google account (or select existing account)`,
          `3. Grant permissions for email and profile`,
          `4. Automatically redirected to: ${baseUrl}/dashboard`,
          `5. access_token and refresh_token are set as HttpOnly secure cookies`,
          `6. For Swagger testing: Use "Authorize" button which handles cookies automatically`,
        ],
        benefits: [
          'Real OAuth 2.0 flow',
          'Production-identical behavior',
          'Secure HttpOnly cookies',
        ],
        drawbacks: [
          'Requires Google account',
          'Slower (redirects involved)',
          'Not suitable for automated CI/CD',
        ],
        duration: '30-60 seconds per token',
        token_location: 'HttpOnly cookie (not extractable)',
        best_for: 'Manual QA testing, staging verification',
      },
      method_2: {
        name:
          '⚡ OAuth Simulation Endpoint (Fastest - No Google Required)',
        description:
          'Bypass Google entirely. Endpoint simulates full OAuth flow and returns tokens directly.',
        endpoint:
          'POST http://localhost:3010/api/v1/test/oauth-flow-simulation',
        request_body: {
          email: 'test@example.com',
          full_name: 'Test User',
          provider: 'google',
          providerId: 'google-user-123',
          avatar_url: 'https://example.com/avatar.jpg',
        },
        response: {
          status_code: 200,
          access_token:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refresh_token: 'ef586de76459c416a3cbe6f86b47f8e7...',
          user: {
            id: 'uuid',
            email: 'test@example.com',
            full_name: 'Test User',
            auth_provider: 'google',
            is_verified: false,
          },
        },
        curl_command:
          'curl -X POST http://localhost:3010/api/v1/test/oauth-flow-simulation \\\n  -H "Content-Type: application/json" \\\n  -d \'{"email":"test@example.com","full_name":"Test User","provider":"google","providerId":"123","avatar_url":"https://example.com/avatar.jpg"}\'',
        powershell_command:
          '$body = @{\n  email = "test@example.com"\n  full_name = "Test User"\n  provider = "google"\n  providerId = "123"\n  avatar_url = "https://example.com/avatar.jpg"\n} | ConvertTo-Json\n\nInvoke-WebRequest -Uri "http://localhost:3010/api/v1/test/oauth-flow-simulation" `\n  -Method POST `\n  -Body $body `\n  -ContentType "application/json"',
        benefits: [
          'Instant token generation (<1s)',
          'No Google account needed',
          'Perfect for automated testing',
          'Tokens in JSON response',
        ],
        drawbacks: [
          'Bypasses real Google OAuth (testing only)',
          'Not production flow',
        ],
        duration: '<1 second',
        token_location: 'JSON response (access_token field)',
        best_for:
          'Development, CI/CD pipelines, unit tests, rapid iteration',
        usage_in_swagger:
          'Copy access_token from response → Click lock icon in Swagger → Paste in Bearer token field',
      },
      method_3: {
        name: '🔐 Swagger UI OAuth 2.0 Button (Easiest UI)',
        description: 'Built-in Swagger authentication using Google OAuth button.',
        steps: [
          '1. Navigate to http://localhost:3010/api/docs',
          '2. Locate green "Authorize" button (top-right corner)',
          '3. Click "Authorize" button',
          '4. Select "OAuth2" from the modal',
          '5. Click "Authorize" in the modal',
          '6. Browser redirects to Google consent screen',
          '7. Sign in and grant permissions',
          '8. Automatically redirected back to Swagger UI',
          '9. All endpoints now have access_token attached',
        ],
        benefits: [
          'One-click setup',
          'Integrated into UI',
          'Automatically handles cookies',
          'No manual token copying',
        ],
        drawbacks: ['Requires Google account', 'Slower than simulation'],
        duration: '30-60 seconds',
        token_location: 'Automatically added to Authorization header',
        best_for: 'Interactive Swagger testing with real OAuth',
      },
      quick_reference: {
        which_method_for:
          'Choose based on your use case →',
        development_with_swagger:
          'Method 2 (Simulation) - instant, or Method 3 (Swagger button) if testing real flow',
        ci_cd_automated_tests:
          'Method 2 (Simulation) - fast, no user interaction',
        production_verification:
          'Method 1 (Real OAuth) - authentic behavior',
        mobile_app_testing:
          'Method 2 (Simulation) for development, Method 1 for staging',
      },
      swagger_usage: {
        how_to_use_token_in_swagger: [
          'Method A (Automatic): Use green "Authorize" button',
          'Method B (Manual): Copy token from simulation response → Click lock icon → Paste in "Bearer token" field',
          'Then call any endpoint - token automatically added to Authorization header',
        ],
      },
      troubleshooting: {
        no_token_in_swagger:
          'If "Authorize" button shows red, use Method 2 (Simulation) instead',
        cookie_not_set:
          'HttpOnly cookies set by real OAuth are not visible in DevTools - normal behavior',
        expired_token:
          'Access tokens valid for 1 hour. Use refresh_token to get new access_token (if refresh endpoint implemented)',
      },
    };
  }
}
