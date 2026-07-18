import { Response } from 'express';
import { Employee } from '../models/Employee';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { wouldCreateCycle } from '../utils/hierarchy';
import { AuthedRequest } from '../types';

interface TreeNode {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  role: string;
  profileImage?: string;
  reports: TreeNode[];
}

// GET /api/organization/tree — full reporting tree (roots = no manager)
export const getTree = asyncHandler(async (_req: AuthedRequest, res: Response) => {
  const employees = await Employee.find({ isDeleted: false })
    .select('employeeId name email designation department role reportingManager profileImage')
    .lean();

  const byId = new Map<string, TreeNode>();
  employees.forEach((e) => {
    byId.set(e._id.toString(), {
      _id: e._id.toString(),
      employeeId: e.employeeId,
      name: e.name,
      email: e.email,
      designation: e.designation,
      department: e.department,
      role: e.role,
      profileImage: e.profileImage,
      reports: [],
    });
  });

  const roots: TreeNode[] = [];
  employees.forEach((e) => {
    const node = byId.get(e._id.toString())!;
    const managerId = e.reportingManager?.toString();
    if (managerId && byId.has(managerId)) {
      byId.get(managerId)!.reports.push(node);
    } else {
      roots.push(node);
    }
  });

  res.json({ success: true, data: roots });
});

// GET /api/employees/:id/reportees — direct reports of one employee
export const getReportees = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const employee = await Employee.findOne({ _id: id, isDeleted: false }).select('name employeeId');
  if (!employee) throw ApiError.notFound('Employee not found');

  const reportees = await Employee.find({ reportingManager: id, isDeleted: false })
    .select('employeeId name email designation department role status profileImage')
    .lean();

  res.json({
    success: true,
    data: { manager: { _id: employee._id, name: employee.name }, reportees },
  });
});

// PATCH /api/employees/:id/manager — assign/change reporting manager
export const updateManager = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const { reportingManager } = req.body as { reportingManager: string | null };

  const employee = await Employee.findOne({ _id: id, isDeleted: false });
  if (!employee) throw ApiError.notFound('Employee not found');

  if (reportingManager) {
    const mgr = await Employee.exists({ _id: reportingManager, isDeleted: false });
    if (!mgr) throw ApiError.badRequest('Reporting manager not found');
    if (await wouldCreateCycle(id, reportingManager)) {
      throw ApiError.badRequest('This assignment would create a circular reporting relationship');
    }
  }

  employee.reportingManager = reportingManager ? (reportingManager as unknown as typeof employee.reportingManager) : null;
  await employee.save();

  const populated = await employee.populate('reportingManager', 'name email employeeId designation');
  res.json({ success: true, data: populated });
});
