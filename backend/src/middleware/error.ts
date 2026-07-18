import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function notFound(_req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({ success: false, message: 'Route not found' });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof Error) {
    // Mongoose duplicate key
    const anyErr = err as { code?: number; keyValue?: Record<string, unknown> };
    if (anyErr.code === 11000) {
      statusCode = 409;
      const field = Object.keys(anyErr.keyValue || {})[0] || 'field';
      message = `Duplicate value for ${field}`;
    } else if (err.name === 'ValidationError') {
      statusCode = 400;
      message = err.message;
    } else if (err.name === 'CastError') {
      statusCode = 400;
      message = 'Invalid identifier';
    } else {
      message = err.message || message;
    }
  }

  if (statusCode >= 500 && env.nodeEnv !== 'test') {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}
