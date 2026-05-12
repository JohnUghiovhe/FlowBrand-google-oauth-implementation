import { Controller, HttpStatus, Req, Get, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { skipAuth } from '@shared/helpers/skipAuth';
import AuthenticationService from './auth.service';
import { GoogleOAuthProfile, OAuthLoginResponse } from './dto/google-oauth.dto';
import authConfig from '@config/auth.config';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';

@ApiTags('Authentication')
@Controller('auth')
export default class RegistrationController {
  constructor(private readonly authService: AuthenticationService) {}

  @skipAuth()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Initiate Google OAuth login',
    description:
      'Redirects user to Google consent screen. User grants permission, then Google redirects to callback endpoint. This is the entry point for OAuth login.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google consent screen (googleapis.com)',
  })
  async googleAuth(): Promise<void> {
    // Passport handles the redirect to Google
  }

  @skipAuth()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Google OAuth callback handler',
    description:
      'Callback endpoint that Google redirects to after user authentication. Validates auth code, creates/links user, issues JWT access token and refresh token, sets secure cookie, and redirects to dashboard.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend dashboard on success with access_token cookie set',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to login error page on failure',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'OAuth login failed',
  })
  async googleAuthRedirect(
    @Req() req: Request & { user?: GoogleOAuthProfile },
    @Res() res: Response,
  ): Promise<void> {
    const payload = req.user;

    if (!payload) {
      const frontend = (authConfig().frontendUrl || '').replace(/\/$/, '');
      const target = frontend ? `${frontend}/login?error=oauth_failed` : '/login?error=oauth_failed';
      res.redirect(HttpStatus.FOUND, target);
      return;
    }

    try {
      const result: OAuthLoginResponse = await this.authService.handleOAuthLogin(payload);
      res.cookie('access_token', result.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      });

      const frontend = authConfig().frontendUrl || '';
      const target = frontend ? `${frontend.replace(/\/$/, '')}/dashboard` : '/dashboard';
      res.redirect(HttpStatus.FOUND, target);
    } catch (err: unknown) {
      const frontend = authConfig().frontendUrl || '';
      const isCustom = err instanceof CustomHttpException;
      const safeMessage = isCustom && err instanceof Error ? err.message : 'OAuth login failed';

      const errorParam = isCustom ? encodeURIComponent(String(safeMessage)) : 'oauth_failed';
      const errorTarget = frontend
        ? `${frontend.replace(/\/$/, '')}/login?error=${errorParam}`
        : `/login?error=${errorParam}`;

      if (!isCustom) {
        console.error('OAuth login error:', err);
      }

      res.status(HttpStatus.FOUND).redirect(errorTarget);
    }
  }
}
