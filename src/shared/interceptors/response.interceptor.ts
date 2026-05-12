import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResponseInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((res: unknown) => this.responseHandler(res, context)),
      catchError((err: unknown) => throwError(() => this.errorHandler(err, context))),
    );
  }

  errorHandler(exception: unknown, context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    // Guard against "headers already sent" error
    if (res.headersSent) {
      return;
    }

    if (exception instanceof HttpException) return exception;
    const errorMessage = exception instanceof Error ? exception.message : String(exception);
    const errorStack = exception instanceof Error ? exception.stack ?? '' : '';
    this.logger.error(
      `Error processing request for ${req.method} ${req.url}, Message: ${errorMessage}, Stack: ${errorStack}`,
    );
    return new InternalServerErrorException({
      status_code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }

  responseHandler(res: unknown, context: ExecutionContext) {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    // Guard against "headers already sent" error
    if (response.headersSent) {
      return res;
    }

    const status_code = response.statusCode;
    response.setHeader('Content-Type', 'application/json');

    if (res && typeof res === 'object' && !Array.isArray(res)) {
      const payload = res as Record<string, unknown>;
      const { message, ...data } = payload;
      const req = ctx.getRequest();

      // Redact sensitive fields before logging
      const safeData = { ...data } as Record<string, unknown>;
      if ('access_token' in safeData || 'refresh_token' in safeData || 'token' in safeData) {
        if (typeof safeData.access_token === 'string') safeData.access_token = '[REDACTED]';
        if (typeof safeData.refresh_token === 'string') safeData.refresh_token = '[REDACTED]';
        if (typeof safeData.token === 'string') safeData.token = '[REDACTED]';
      }

      this.logger.debug(`Response for ${req.method} ${req.url}: ${JSON.stringify({ message, ...safeData })}`);

      return {
        status_code,
        message,
        ...data,
      };
    }

    return res;
  }
}
