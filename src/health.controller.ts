import { Controller, Get } from '@nestjs/common';
import { skipAuth } from '@shared/helpers/skipAuth';

@Controller()
export class HealthController {
  @skipAuth()
  @Get('health')
  health() {
    return {
      status_code: 200,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
    };
  }

  @skipAuth()
  @Get('ping')
  ping() {
    return { message: 'pong' };
  }
}
