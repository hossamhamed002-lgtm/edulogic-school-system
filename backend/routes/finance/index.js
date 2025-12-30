import { Router } from 'express';
import accounts from './accounts.js';
import journal from './journal.js';
import receipts from './receipts.js';
import feeItems from './feeItems.js';
import feeStructure from './feeStructure.js';

const router = Router();

router.use('/accounts', accounts);
router.use('/journal', journal);
router.use('/receipts', receipts);
router.use('/fee-items', feeItems);
router.use('/fee-structure', feeStructure);

export default router;
