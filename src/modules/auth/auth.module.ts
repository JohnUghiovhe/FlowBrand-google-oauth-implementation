import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import RegistrationController from './auth.controller';
import authConfig from '@config/auth.config';
import AuthenticationService from './auth.service';
import { UserSession } from './entities/user-session.entity';
import { GoogleStrategy } from '../strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import type { StringValue } from 'ms';
import { User } from '@modules/user/entities/user.entity';

const expiry = authConfig().jwtExpiry;
@Module({
  controllers: [RegistrationController],
  providers: [AuthenticationService, GoogleStrategy, JwtStrategy],
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([User, UserSession]),
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
