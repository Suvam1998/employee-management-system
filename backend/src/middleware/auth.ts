import { Response, NextFunction } from 'express';
import { AuthedRequest } from '../types';
import { verifyToken, COOKIE_NAME } from '../utils/token';
import { ApiError } from '../utils/ApiError';

/** Verifies JWT from httpOnly cookie or Authorization: Bearer header. */
export function authenticate(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : undefined;
  const token = req.cookies?.[COOKIE_NAME] || bearer;

  if (!token) {
    return next(ApiError.unauthorized('Authentication required'));
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}
