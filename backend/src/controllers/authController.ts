import { Request, Response } from 'express';
import { Employee } from '../models/Employee';
import { signToken, COOKIE_NAME } from '../utils/token';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { env } from '../config/env';
import { AuthedRequest, Role } from '../types';

const cookieOptions = {
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.cookieSecure ? ('none' as const) : ('lax' as const),
  maxAge: 24 * 60 * 60 * 1000,
  path: '/',
};

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const employee = await Employee.findOne({ email, isDeleted: false }).select('+passwordHash');
  if (!employee) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  const ok = await employee.comparePassword(password);
  if (!ok) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  const token = signToken({
    sub: employee._id.toString(),
    role: employee.role as Role,
    email: employee.email,
  });

  res.cookie(COOKIE_NAME, token, cookieOptions);
  res.json({
    success: true,
    token, // also returned for header-based clients / testing
    user: employee.toJSON(),
  });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
  res.json({ success: true, message: 'Logged out' });
});

export const me = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const employee = await Employee.findOne({ _id: req.user!.sub, isDeleted: false });
  if (!employee) {
    throw ApiError.notFound('User not found');
  }
  res.json({ success: true, user: employee.toJSON() });
});
