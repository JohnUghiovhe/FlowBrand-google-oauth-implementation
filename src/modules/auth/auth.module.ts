import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import RegistrationController from './auth.controller';
import { TestController } from './test.controller';
import authConfig from '@config/auth.config';
import AuthenticationService from './auth.service';
import { GoogleStrategy } from '../strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import type { StringValue } from 'ms';
import { SessionService } from './session.service';
import { RedisModule } from '@modules/redis/redis.module';

const expiry = authConfig().jwtExpiry;

// Mock UserRepository for testing without database
const mockUserRepository = {
  findOne: async () => null, // Always return null to simulate new user
  create: (userData: any) => {
    // Generate a simple mock ID
    return {
      id: `test-${Date.now()}`,
      ...userData,
      is_verified: false,
      created_at: new Date(),
      updated_at: new Date(),
    };
  },
  save: async (user: any) => {
    // Just return the user as-is since we're in test mode
    return {
      ...user,
      id: user.id || `test-${Date.now()}`,
    };
  },
};

@Module({
  controllers: [RegistrationController, TestController],
  providers: [
    AuthenticationService,
    GoogleStrategy,
    JwtStrategy,
    {
      provide: SessionService,
      useValue: {
        create: async (user: any) => {
          const crypto = require('crypto');
          const rawToken = crypto.randomBytes(32).toString('hex');
          const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
          const refreshExpirySeconds = 604800;
          const expiresAt = new Date(Date.now() + refreshExpirySeconds * 1000);
          const sessionId = `session-${Date.now()}`;
          
          return { 
            rawToken, 
            sessionId, 
            hashedToken, 
            expiresAt 
          };
        },
      },
    },
    {
      provide: 'UserRepository',
      useValue: mockUserRepository,
    },
  ],
  imports: [
    PassportModule,
    // Skip TypeOrmModule for testing mode - database optional
    // Re-enable when database is needed:
    // TypeOrmModule.forFeature([User, UserSession]),
    RedisModule,
    JwtModule.register({
      global: true,
      secret: authConfig().jwtSecret,
      signOptions: {
        expiresIn: `${expiry}` as unknown as StringValue,
      },
    }),
  ],
  exports: [AuthenticationService],
})
export class AuthModule {}
