import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { loggingService } from '@/services/loggingService';

const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Add request ID for tracing
  const requestId = uuidv4();
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);

  const start = Date.now();

  // Log request to DB
  loggingService.logWithRequest(
    'INFO', 
    'HTTP_REQUEST', 
    `${req.method} ${req.url}`,
    req,
    { request_id: requestId }
  );

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    loggingService.logWithRequest(
      'INFO',
      'HTTP_RESPONSE',
      `${req.method} ${req.url} - ${res.statusCode}`,
      req,
      { 
        request_id: requestId,
        status_code: res.statusCode,
        duration_ms: duration
      }
    );
  });

  next();
};

export default requestLogger;
