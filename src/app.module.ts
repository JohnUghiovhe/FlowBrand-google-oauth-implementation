import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import * as Joi from 'joi';
import authConfig from '@config/auth.config';
import serverConfig from '@config/server.config';
import { AuthGuard } from '@guards/auth.guard';
import { AuthModule } from '@modules/auth/auth.module';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  providers: [
    {
      provide: 'CONFIG',
      useClass: ConfigService,
    },
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
        }),
    },
    {
      provide: 'APP_GUARD',
      useClass: AuthGuard,
    },
  ],
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development.local', '.env.local', '.env'],
      isGlobal: true,
      load: [serverConfig, authConfig],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').optional(),
        PROFILE: Joi.string().optional(),
        PORT: Joi.number().optional(),
        DB_HOST: Joi.string().optional(),
        DB_PORT: Joi.number().optional(),
        DB_USER: Joi.string().optional(),
        DB_PASSWORD: Joi.string().optional(),
        DB_NAME: Joi.string().optional(),
        GOOGLE_CLIENT_ID: Joi.string().required(),
        GOOGLE_CLIENT_SECRET: Joi.string().required(),
        GOOGLE_REDIRECT_URI: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        FRONTEND_URL: Joi.string().optional(),
      }),
    }),
    // Skip TypeORM database initialization for testing/swagger endpoints
    // Enable only if database is needed for user/session operations
    // For pure OAuth testing, database dependencies are optional
    AuthModule,
  ],
})
export class AppModule {}
