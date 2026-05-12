import { HttpStatus, Injectable, Logger, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { CustomHttpException } from '@shared/helpers/custom-http-filter';
import { User } from '@modules/user/entities/user.entity';
import { GoogleOAuthProfile, OAuthLoginResponse } from './dto/google-oauth.dto';
import { SessionService } from './session.service';
import { RedisService } from '@modules/redis/services/redis.service';

@Injectable()
export default class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name);

  constructor(
    @Inject('UserRepository')
    private readonly userRepository: Repository<User>,
    private readonly sessionService: SessionService,
    private readonly redisService: RedisService,
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
          is_verified: false, // Per RFC: do NOT auto-verify OAuth-created accounts in this release
          password: null, // OAuth users don't have passwords
        });
        user = await this.userRepository.save(user);
      }

      const { rawToken, sessionId, hashedToken, expiresAt } = await this.sessionService.create(user);

      const refreshExpirySeconds = Math.max(Math.floor((expiresAt.getTime() - Date.now()) / 1000), 1);
      await this.redisService.set(`refresh:${sessionId}`, hashedToken, refreshExpirySeconds);

      // Create JWT access token
      const accessToken = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        username: user.full_name,
        sid: sessionId,
      });

      return {
        status_code: HttpStatus.OK,
        message: 'OAuth login successful',
        access_token: accessToken,
        refresh_token: rawToken,
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
