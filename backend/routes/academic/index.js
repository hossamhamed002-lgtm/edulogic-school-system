import { Router } from 'express';
import stages from './stages.js';
import grades from './grades.js';
import classes from './classes.js';
import structure from './structure.js';
import years from './years.js';

const router = Router();

router.use('/years', years);
router.use('/stages', stages);
router.use('/grades', grades);
router.use('/classes', classes);
router.use('/structure', structure);

export default router;
