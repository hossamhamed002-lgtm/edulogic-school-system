import { Router } from 'express';
import users from './users.js';
import parents from './parents.js';
import staff from './staff.js';

const router = Router();

router.use('/users', users);
router.use('/parents', parents);
router.use('/staff', staff);

export default router;
