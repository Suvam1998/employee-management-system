import { Router } from 'express';
import { getTree } from '../controllers/organizationController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { Role } from '../types';

const router = Router();

router.use(authenticate);
router.get('/tree', authorize(Role.SUPER_ADMIN, Role.HR), getTree);

export default router;
