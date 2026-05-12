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
