import { Router, Request, Response } from 'express';
import { asyncWrapper } from '@/utils/asyncWrapper';
import { ResponseHelper } from '@/utils/response';
import { BookSearchService } from '@/services/bookSearchService';

const router = Router();
const bookSearchService = new BookSearchService();

interface BookSearchRequest extends Request {
  query: {
    title: string;
    page?: string;
    limit?: string;
  };
}

router.get('/search', asyncWrapper(async (req: BookSearchRequest, res: Response) => {
  const { page = '1', limit = '10' } = req.query;
  const title = (req.query.title as string)?.trim() || '';

  if (!title) {
    return ResponseHelper.badRequest(res, 'Title parameter is required');
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  
  if (isNaN(pageNum)) {
    return ResponseHelper.badRequest(res, 'Page must be a valid number');
  }
  
  if (isNaN(limitNum)) {
    return ResponseHelper.badRequest(res, 'Limit must be a valid number');
  }

  const result = await bookSearchService.searchByTitle(title, {
    page: pageNum,
    limit: limitNum
  });

  if (!result.success) {
    return ResponseHelper.badRequest(res, result.error || 'Failed to search books');
  }

  ResponseHelper.success(res, result.data, 'Books retrieved successfully');
}));

export default router;