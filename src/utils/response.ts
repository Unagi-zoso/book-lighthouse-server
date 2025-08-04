import { Response } from 'express';
import { ApiResponse } from '@/types';

export class ResponseHelper {
  static success<T>(res: Response, data: T, message?: string, statusCode: number = 200): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message: message || 'Success',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.getHeader('x-request-id') as string,
      },
    };

    res.status(statusCode).json(response);
  }

  static error(res: Response, message: string, statusCode: number = 500, errors?: string[]): void {
    const response: ApiResponse = {
      success: false,
      message,
      errors,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: res.getHeader('x-request-id') as string,
      },
    };

    res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message?: string): void {
    this.success(res, data, message || 'Resource created successfully', 201);
  }

  static noContent(res: Response): void {
    res.status(204).end();
  }

  static notFound(res: Response, message: string = 'Resource not found'): void {
    this.error(res, message, 404);
  }

  static badRequest(res: Response, message: string = 'Bad request', errors?: string[]): void {
    this.error(res, message, 400, errors);
  }

  static unauthorized(res: Response, message: string = 'Unauthorized'): void {
    this.error(res, message, 401);
  }

  static forbidden(res: Response, message: string = 'Forbidden'): void {
    this.error(res, message, 403);
  }
}
