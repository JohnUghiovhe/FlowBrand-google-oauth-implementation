import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomHttpException extends HttpException {
  constructor(response: string | Record<string, unknown>, status: HttpStatus) {
    super(response, status);
  }

  getResponse(): string | Record<string, unknown> {
    const response = super.getResponse();
    const status_code = this.getStatus();

    if (typeof response === 'object' && response !== null) {
      const res = response as Record<string, unknown>;
      return {
        message: (typeof res.message === 'string' ? res.message : 'An error occurred'),
        status_code,
      };
    }

    return {
      message: response,
      status_code,
    };
  }
}
