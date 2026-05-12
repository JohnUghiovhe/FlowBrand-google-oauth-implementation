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
}
