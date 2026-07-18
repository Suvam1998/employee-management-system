import { Request } from 'express';

export enum Role {
  SUPER_ADMIN = 'super_admin',
  HR = 'hr',
  EMPLOYEE = 'employee',
}

export enum EmployeeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface JwtPayload {
  sub: string; // employee _id
  role: Role;
  email: string;
}

export interface AuthedRequest extends Request {
  user?: JwtPayload;
}
