import { Router, Request, Response } from 'express';
import { asyncWrapper } from '@/utils/asyncWrapper';
import { ResponseHelper } from '@/utils/response';
import { BookSearchService } from '@/services/bookSearchService';
import { BOOK_SEARCH_CONSTANTS } from '@/constants/bookSearch';

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
  const { page = BOOK_SEARCH_CONSTANTS.DEFAULT_PAGE_STR, limit = BOOK_SEARCH_CONSTANTS.DEFAULT_LIMIT_STR } = req.query;
  const title = (req.query.title as string)?.trim() || '';

  if (!title) {
    return ResponseHelper.badRequest(res, 'Title parameter is required');
  }

  const parsedPage = parseInt(page, 10);
  const pageValue = isNaN(parsedPage) ? BOOK_SEARCH_CONSTANTS.DEFAULT_PAGE : parsedPage;
  const pageNum = Math.max(BOOK_SEARCH_CONSTANTS.MIN_PAGE, pageValue); // 음수 처리

  const parsedLimit = parseInt(limit, 10);
  const limitValue = isNaN(parsedLimit) ? BOOK_SEARCH_CONSTANTS.MIN_LIMIT : parsedLimit;
  const limitNum = Math.max(BOOK_SEARCH_CONSTANTS.MIN_LIMIT, limitValue); // 음수 처리

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