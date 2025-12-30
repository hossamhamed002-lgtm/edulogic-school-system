import { Router } from 'express';
import schools from './schools.js';
import settings from './settings.js';
import audit from './audit.js';
import backups from './backups.js';

const router = Router();

router.use('/schools', schools);
router.use('/settings', settings);
router.use('/audit', audit);
router.use('/backups', backups);

export default router;
