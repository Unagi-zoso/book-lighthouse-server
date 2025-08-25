import { Router } from 'express';
import librariesRouter from './librariesV2';

const router = Router();
router.use('/libraries', librariesRouter);

export default router;
