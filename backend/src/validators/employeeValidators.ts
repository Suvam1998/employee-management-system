import { body, param, query } from 'express-validator';
import { Role, EmployeeStatus } from '../types';

const phoneRegex = /^[+]?[\d][\d\s-]{7,15}$/;

export const createEmployeeValidator = [
  body('name').isString().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').matches(phoneRegex).withMessage('Valid phone number is required'),
  body('department').isString().trim().notEmpty().withMessage('Department is required'),
  body('designation').isString().trim().notEmpty().withMessage('Designation is required'),
  body('salary').isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('joiningDate').isISO8601().withMessage('Valid joining date is required'),
  body('status').optional().isIn(Object.values(EmployeeStatus)).withMessage('Invalid status'),
  body('role').optional().isIn(Object.values(Role)).withMessage('Invalid role'),
  body('reportingManager').optional({ nullable: true }).isMongoId().withMessage('Invalid manager id'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('employeeId').optional().isString().trim(),
];

export const updateEmployeeValidator = [
  param('id').isMongoId().withMessage('Invalid employee id'),
  body('name').optional().isString().trim().isLength({ min: 2 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().matches(phoneRegex).withMessage('Valid phone number is required'),
  body('department').optional().isString().trim().notEmpty(),
  body('designation').optional().isString().trim().notEmpty(),
  body('salary').optional().isFloat({ min: 0 }),
  body('joiningDate').optional().isISO8601(),
  body('status').optional().isIn(Object.values(EmployeeStatus)),
  body('role').optional().isIn(Object.values(Role)),
  body('reportingManager').optional({ nullable: true }).custom((v) => v === null || /^[a-f\d]{24}$/i.test(v)),
  body('password').optional().isLength({ min: 6 }),
];

export const idParamValidator = [param('id').isMongoId().withMessage('Invalid employee id')];

export const updateManagerValidator = [
  param('id').isMongoId().withMessage('Invalid employee id'),
  body('reportingManager')
    .custom((v) => v === null || /^[a-f\d]{24}$/i.test(v))
    .withMessage('reportingManager must be a valid id or null'),
];

export const listQueryValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(Object.values(EmployeeStatus)),
  query('role').optional().isIn(Object.values(Role)),
  query('sortBy').optional().isIn(['name', 'joiningDate', 'createdAt', 'salary']),
  query('order').optional().isIn(['asc', 'desc']),
];
