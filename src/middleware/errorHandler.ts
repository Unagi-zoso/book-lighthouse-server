import { Request, Response, NextFunction } from 'express';
import { AppError, ApiResponse } from '@/types';
import { AppConfig } from '@/config/app.config';

const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: string[] = [];

  // Handle custom AppError
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }

  // Handle Validation Errors
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(error as any).map((err: any) => err.message);
  }

  // Handle JSON parsing errors
  if ('body' in error) {
    statusCode = 400;
    message = 'Invalid JSON payload';
  }

  // Log error (in production, use proper logging service)
  if (AppConfig.server.env === 'development') {
    console.error('Error:', error);
  }

  const response: ApiResponse = {
    success: false,
    message,
    errors: errors.length > 0 ? errors : undefined,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string,
    },
  };

  // Don't leak error details in production
  if (AppConfig.server.env === 'production' && statusCode === 500) {
    response.message = 'Something went wrong';
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
