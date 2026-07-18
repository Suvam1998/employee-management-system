import { Response, NextFunction } from 'express';
import { AuthedRequest, Role } from '../types';
import { ApiError } from '../utils/ApiError';

/** Allows the request only if the authenticated user has one of the given roles. */
export function authorize(...roles: Role[]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
}
