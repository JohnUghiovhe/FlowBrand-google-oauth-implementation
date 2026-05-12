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

  try {
    await initializeDataSource();
    console.log('✓ Database connection initialized');
  } catch (err) {
    console.error('✗ Error during database initialization', err);
    process.exit(1);
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
    .setDescription('Google OAuth 2.0 Authentication Implementation')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addServer('http://localhost:3000', 'Development')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

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
