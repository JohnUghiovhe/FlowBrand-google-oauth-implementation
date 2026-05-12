import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';
import { User } from '@modules/user/entities/user.entity';
import { UserSession } from './entities/user-session.entity';
import { GoogleOAuthProfile, OAuthLoginResponse } from './dto/google-oauth.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export default class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSession)
    private readonly userSessionRepository: Repository<UserSession>,
    private readonly jwtService: JwtService,
  ) {}

  async handleOAuthLogin(payload: GoogleOAuthProfile): Promise<OAuthLoginResponse> {
    try {
      let user = await this.userRepository.findOne({
        where: {
          email: payload.email,
          auth_provider: payload.provider,
        },
      });

      // If user doesn't exist with this provider, create new user
      if (!user) {
        user = this.userRepository.create({
          email: payload.email,
          full_name: payload.full_name,
          avatar_url: payload.avatar_url,
          auth_provider: payload.provider,
          provider_user_id: payload.providerId,
          is_verified: true, // OAuth users are auto-verified
          password: null, // OAuth users don't have passwords
        });
        user = await this.userRepository.save(user);
      }

      // Create refresh token
      const refreshToken = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      await this.userSessionRepository.save({
        user_id: user.id,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        is_revoked: false,
      });

      // Create JWT access token
      const accessToken = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        username: user.full_name,
      });

      return {
        status_code: HttpStatus.OK,
        message: 'OAuth login successful',
        access_token: accessToken,
        refresh_token: refreshToken,
        data: {
          user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            avatar_url: user.avatar_url,
          },
        },
      };
    } catch (error) {
      this.logger.error(`OAuth login failed: ${(error as Error).message}`, (error as Error).stack);
      throw new CustomHttpException('OAuth login failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async validateUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new CustomHttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }
}
