import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import authConfig from '@config/auth.config';
import { User } from '@modules/user/entities/user.entity';
import { UserSession } from './entities/user-session.entity';

const DEFAULT_REFRESH_EXPIRY_SECONDS = 604800;

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(UserSession)
    private readonly repo: Repository<UserSession>
  ) {}

  async create(user: User): Promise<{ rawToken: string; sessionId: string; hashedToken: string; expiresAt: Date }> {
    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(rawToken).digest('hex');
    const refreshExpirySeconds = Number(authConfig().jwtRefreshExpiry) || DEFAULT_REFRESH_EXPIRY_SECONDS;
    const expiresAt = new Date(Date.now() + refreshExpirySeconds * 1000);

    const session = await this.repo.save(
      this.repo.create({
        user_id: user.id,
        refresh_token: hashedToken,
        expires_at: expiresAt,
        is_revoked: false,
      })
    );

    return { rawToken, sessionId: session.id, hashedToken, expiresAt };
  }
}