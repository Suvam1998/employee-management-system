import { Response } from 'express';
import { FilterQuery } from 'mongoose';
import { parse } from 'csv-parse/sync';
import { Employee, IEmployee } from '../models/Employee';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { wouldCreateCycle } from '../utils/hierarchy';
import { AuthedRequest, Role, EmployeeStatus } from '../types';

/** Fields an EMPLOYEE role may edit on their own profile. */
const SELF_EDITABLE_FIELDS = ['name', 'phone', 'profileImage', 'password'] as const;

/** Generate the next sequential employee id like EMP0007. */
async function generateEmployeeId(): Promise<string> {
  const last = await Employee.findOne({ employeeId: /^EMP\d+$/ })
    .sort({ employeeId: -1 })
    .select('employeeId')
    .lean();
  const lastNum = last ? parseInt(last.employeeId.replace('EMP', ''), 10) : 0;
  return `EMP${String(lastNum + 1).padStart(4, '0')}`;
}

async function applyPassword(payload: Record<string, unknown>): Promise<void> {
  if (payload.password) {
    payload.passwordHash = await Employee.hashPassword(payload.password as string);
    delete payload.password;
  }
}

// GET /api/employees  — search, filter, sort, pagination
export const listEmployees = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const {
    search,
    department,
    role,
    status,
    sortBy = 'createdAt',
    order = 'desc',
    page = '1',
    limit = '10',
  } = req.query as Record<string, string>;

  const filter: FilterQuery<IEmployee> = { isDeleted: false };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
    ];
  }
  if (department) filter.department = department;
  if (role) filter.role = role as Role;
  if (status) filter.status = status as EmployeeStatus;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const sortOrder = order === 'asc' ? 1 : -1;

  const [items, total] = await Promise.all([
    Employee.find(filter)
      .populate('reportingManager', 'name email employeeId designation')
      .sort({ [sortBy]: sortOrder })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Employee.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

// GET /api/employees/stats — dashboard metrics
export const getStats = asyncHandler(async (_req: AuthedRequest, res: Response) => {
  const base = { isDeleted: false };
  const [total, active, inactive, departments, byDepartment, byRole] = await Promise.all([
    Employee.countDocuments(base),
    Employee.countDocuments({ ...base, status: EmployeeStatus.ACTIVE }),
    Employee.countDocuments({ ...base, status: EmployeeStatus.INACTIVE }),
    Employee.distinct('department', base),
    Employee.aggregate([
      { $match: base },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Employee.aggregate([{ $match: base }, { $group: { _id: '$role', count: { $sum: 1 } } }]),
  ]);

  res.json({
    success: true,
    data: {
      totalEmployees: total,
      activeEmployees: active,
      inactiveEmployees: inactive,
      departmentCount: departments.length,
      byDepartment: byDepartment.map((d) => ({ department: d._id, count: d.count })),
      byRole: byRole.map((r) => ({ role: r._id, count: r.count })),
    },
  });
});

// GET /api/employees/:id
export const getEmployee = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;

  // Employees may only read their own record
  if (req.user!.role === Role.EMPLOYEE && req.user!.sub !== id) {
    throw ApiError.forbidden('You can only view your own profile');
  }

  const employee = await Employee.findOne({ _id: id, isDeleted: false }).populate(
    'reportingManager',
    'name email employeeId designation',
  );
  if (!employee) throw ApiError.notFound('Employee not found');
  res.json({ success: true, data: employee });
});

// POST /api/employees  (super_admin, hr)
export const createEmployee = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const payload: Record<string, unknown> = { ...req.body };

  // HR cannot create a Super Admin
  if (req.user!.role === Role.HR && payload.role === Role.SUPER_ADMIN) {
    throw ApiError.forbidden('HR cannot assign the Super Admin role');
  }

  if (req.file) payload.profileImage = `/uploads/${req.file.filename}`;
  if (!payload.employeeId) payload.employeeId = await generateEmployeeId();

  // Validate manager exists (no cycle possible on create since id doesn't exist yet)
  if (payload.reportingManager) {
    const mgr = await Employee.exists({ _id: payload.reportingManager, isDeleted: false });
    if (!mgr) throw ApiError.badRequest('Reporting manager not found');
  }

  // Default password if none provided
  if (!payload.password) payload.password = 'Password@123';
  await applyPassword(payload);

  const employee = await Employee.create(payload);
  res.status(201).json({ success: true, data: employee });
});

// PUT /api/employees/:id
export const updateEmployee = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const actor = req.user!;
  const payload: Record<string, unknown> = { ...req.body };

  const target = await Employee.findOne({ _id: id, isDeleted: false });
  if (!target) throw ApiError.notFound('Employee not found');

  if (actor.role === Role.EMPLOYEE) {
    if (actor.sub !== id) throw ApiError.forbidden('You can only edit your own profile');
    // strip any non-self-editable field
    for (const key of Object.keys(payload)) {
      if (!SELF_EDITABLE_FIELDS.includes(key as (typeof SELF_EDITABLE_FIELDS)[number])) {
        delete payload[key];
      }
    }
  }

  if (actor.role === Role.HR) {
    // HR may not promote anyone to Super Admin, nor edit a Super Admin
    if (payload.role === Role.SUPER_ADMIN) {
      throw ApiError.forbidden('HR cannot assign the Super Admin role');
    }
    if (target.role === Role.SUPER_ADMIN) {
      throw ApiError.forbidden('HR cannot modify a Super Admin');
    }
  }

  // Manager change → guard against cycles
  if (payload.reportingManager !== undefined && payload.reportingManager !== null) {
    const mgrId = String(payload.reportingManager);
    const mgr = await Employee.exists({ _id: mgrId, isDeleted: false });
    if (!mgr) throw ApiError.badRequest('Reporting manager not found');
    if (await wouldCreateCycle(id, mgrId)) {
      throw ApiError.badRequest('This assignment would create a circular reporting relationship');
    }
  }

  if (req.file) payload.profileImage = `/uploads/${req.file.filename}`;
  await applyPassword(payload);

  Object.assign(target, payload);
  await target.save();
  res.json({ success: true, data: target });
});

// DELETE /api/employees/:id  (super_admin only) — soft delete
export const deleteEmployee = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const employee = await Employee.findOne({ _id: id, isDeleted: false });
  if (!employee) throw ApiError.notFound('Employee not found');

  if (employee._id.toString() === req.user!.sub) {
    throw ApiError.badRequest('You cannot delete your own account');
  }

  // Detach direct reports so the tree stays valid
  await Employee.updateMany({ reportingManager: employee._id }, { $set: { reportingManager: null } });

  employee.isDeleted = true;
  await employee.save();
  res.json({ success: true, message: 'Employee deleted' });
});

// POST /api/employees/import  (super_admin, hr) — CSV bulk import
export const importEmployees = asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (!req.file) throw ApiError.badRequest('CSV file is required');

  const records = parse(req.file.buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  const results = { created: 0, failed: 0, errors: [] as { row: number; error: string }[] };

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    try {
      const doc: Record<string, unknown> = {
        name: row.name,
        email: row.email?.toLowerCase(),
        phone: row.phone,
        department: row.department,
        designation: row.designation,
        salary: Number(row.salary),
        joiningDate: row.joiningDate ? new Date(row.joiningDate) : new Date(),
        status: row.status || EmployeeStatus.ACTIVE,
        role: row.role || Role.EMPLOYEE,
        employeeId: row.employeeId || (await generateEmployeeId()),
        passwordHash: await Employee.hashPassword(row.password || 'Password@123'),
      };
      if (req.user!.role === Role.HR && doc.role === Role.SUPER_ADMIN) {
        throw new Error('HR cannot create Super Admin');
      }
      await Employee.create(doc);
      results.created++;
    } catch (e) {
      results.failed++;
      results.errors.push({ row: i + 2, error: (e as Error).message });
    }
  }

  res.status(201).json({ success: true, data: results });
});
