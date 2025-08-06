import { Router } from 'express';
import booksRouter from './books';
import librariesRouter from './libraries';

const router = Router();

router.use('/books', booksRouter);
router.use('/libraries', librariesRouter);

export default router;
