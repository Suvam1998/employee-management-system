import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ApiError } from '../utils/ApiError';

/** Runs express-validator chains and rejects with 400 + field details on failure. */
export function validate(chains: ValidationChain[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(chains.map((c) => c.run(req)));
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const details = result.array().map((e) => ({
        field: (e as { path?: string }).path,
        message: e.msg,
      }));
      return next(ApiError.badRequest('Validation failed', details));
    }
    next();
  };
}
