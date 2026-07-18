export type Role = 'super_admin' | 'hr' | 'employee';
export type EmployeeStatus = 'active' | 'inactive';

export interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  salary: number;
  joiningDate: string;
  status: EmployeeStatus;
  role: Role;
  reportingManager?: Employee | string | null;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Stats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  departmentCount: number;
  byDepartment: { department: string; count: number }[];
  byRole: { role: Role; count: number }[];
}

export interface TreeNode {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  role: Role;
  profileImage?: string;
  reports: TreeNode[];
}

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  hr: 'HR Manager',
  employee: 'Employee',
};

/** Where a role should land after login. Employees can only use their profile. */
export function landingPath(role: Role): string {
  return role === 'employee' ? '/profile' : '/dashboard';
}

/** Routes only Super Admin / HR may open. */
export const ADMIN_ONLY_PREFIXES = ['/dashboard', '/employees', '/organization'];
