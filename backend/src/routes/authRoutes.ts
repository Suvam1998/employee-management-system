import { Router } from 'express';
import { login, logout, me } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginValidator } from '../validators/authValidators';

const router = Router();

router.post('/login', validate(loginValidator), login);
router.post('/logout', logout);
router.get('/me', authenticate, me);

export default router;
