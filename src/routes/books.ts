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
  const { page, limit } = req.query;
  const title = (req.query.title as string)?.trim() || '';

  if (!title) {
    return ResponseHelper.badRequest(res, 'Title parameter is required');
  }

  // 파싱만 하고 검증은 서비스에서 처리
  const pageNum = page ? parseInt(page, 10) : undefined;
  const limitNum = limit ? parseInt(limit, 10) : undefined;

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