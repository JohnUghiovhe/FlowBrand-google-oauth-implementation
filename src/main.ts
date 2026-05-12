import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { initializeDataSource } from '@database/index';
import { ResponseInterceptor } from '@shared/interceptors/response.interceptor';
import { HttpExceptionFilter } from '@shared/helpers/http-exception-filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });

  // Initialize database (optional for testing purposes)
  try {
    await initializeDataSource();
    console.log('✓ Database connection initialized');
  } catch (err) {
    console.warn('⚠ Warning: Database connection failed. Some endpoints may not work.');
    console.warn('  Error:', (err as Error).message);
    console.warn('  Continuing with server startup for testing purposes...');
  }

  app.enable('trust proxy');
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('FlowBrand Google OAuth API')
    .setDescription('Google OAuth 2.0 Authentication Implementation\n\n**Quick Start:**\n\n1. Click "Authorize" button below and select OAuth 2.0\n2. You will be redirected to Google consent screen\n3. Grant permissions and return to Swagger UI\n4. All protected endpoints now accessible\n\n**Alternative (Testing Only):**\nUse POST /api/v1/test/oauth-flow-simulation to get tokens without Google')
    .setVersion('1.0.0')
    .addServer(`http://localhost:${3010}`, 'Local Development')
    .addServer('http://localhost:3000', 'Frontend')
    .addBearerAuth(
      {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: `http://localhost:3010/api/v1/auth/google`,
            tokenUrl: `http://localhost:3010/api/v1/auth/google/callback`,
            scopes: {
              'email': 'Access email',
              'profile': 'Access profile',
            },
          },
        },
      },
      'OAuth2',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      oauth2RedirectUrl: `http://localhost:${3010}/api/docs/oauth2-redirect.html`,
    },
  });

  const port = app.get<ConfigService>(ConfigService).get<number>('server.port') || 3000;
  await app.listen(port);

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║   🚀 FlowBrand Google OAuth Server Started                     ║
║                                                               ║
║   URL:  http://localhost:${port}                                    ║
║   Docs: http://localhost:${port}/api/docs                            ║
║                                                               ║
║   Google OAuth Endpoints:                                    ║
║   • Login:   GET /api/v1/auth/google                         ║
║   • Callback: GET /api/v1/auth/google/callback               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
}

bootstrap().catch((err) => {
  console.error('✗ Error during bootstrap', err);
  process.exit(1);
});
