import { Types } from 'mongoose';
import { Employee } from '../models/Employee';

/**
 * Returns true if assigning `managerId` as the manager of `employeeId`
 * would create a cycle (i.e. managerId is the employee itself or is
 * somewhere below the employee in the reporting chain).
 */
export async function wouldCreateCycle(
  employeeId: string,
  managerId: string,
): Promise<boolean> {
  if (employeeId === managerId) return true;

  // Walk up from the proposed manager to the top. If we ever reach the
  // employee, assigning it as manager would close a loop.
  let currentId: Types.ObjectId | null = new Types.ObjectId(managerId);
  const visited = new Set<string>();

  while (currentId) {
    const key = currentId.toString();
    if (key === employeeId) return true;
    if (visited.has(key)) break; // pre-existing cycle guard
    visited.add(key);

    const current: { reportingManager?: Types.ObjectId | null } | null = await Employee.findById(
      currentId,
    )
      .select('reportingManager')
      .lean();
    currentId = current?.reportingManager ?? null;
  }
  return false;
}
