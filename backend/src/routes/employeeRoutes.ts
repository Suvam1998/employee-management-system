import { Router } from 'express';
import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getStats,
  importEmployees,
} from '../controllers/employeeController';
import { getReportees, updateManager } from '../controllers/organizationController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { uploadImage, uploadCsv } from '../middleware/upload';
import { Role } from '../types';
import {
  createEmployeeValidator,
  updateEmployeeValidator,
  idParamValidator,
  updateManagerValidator,
  listQueryValidator,
} from '../validators/employeeValidators';

const router = Router();

router.use(authenticate);

router.get('/stats', authorize(Role.SUPER_ADMIN, Role.HR), getStats);

router.post(
  '/import',
  authorize(Role.SUPER_ADMIN, Role.HR),
  uploadCsv.single('file'),
  importEmployees,
);

router
  .route('/')
  .get(authorize(Role.SUPER_ADMIN, Role.HR), validate(listQueryValidator), listEmployees)
  .post(
    authorize(Role.SUPER_ADMIN, Role.HR),
    uploadImage.single('profileImage'),
    validate(createEmployeeValidator),
    createEmployee,
  );

router.get('/:id/reportees', validate(idParamValidator), getReportees);

router.patch(
  '/:id/manager',
  authorize(Role.SUPER_ADMIN, Role.HR),
  validate(updateManagerValidator),
  updateManager,
);

router
  .route('/:id')
  .get(validate(idParamValidator), getEmployee)
  .put(uploadImage.single('profileImage'), validate(updateEmployeeValidator), updateEmployee)
  .delete(authorize(Role.SUPER_ADMIN), validate(idParamValidator), deleteEmployee);

export default router;
