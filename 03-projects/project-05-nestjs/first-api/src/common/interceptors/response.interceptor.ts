import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    return next.handle().pipe(
      map((body: unknown) => {
        const baseResponse = {
          success: true,
          statusCode: response.statusCode,
          timestamp: new Date().toISOString(),
          path: request.url,
        };

        if (this.isStructuredResponse(body)) {
          return {
            ...baseResponse,
            ...body,
            success: true,
          };
        }

        return {
          ...baseResponse,
          data: body,
        };
      }),
    );
  }

  private isStructuredResponse(body: unknown): body is Record<string, unknown> {
    return (
      typeof body === 'object' &&
      body !== null &&
      ('data' in body || 'message' in body || 'meta' in body)
    );
  }
}
