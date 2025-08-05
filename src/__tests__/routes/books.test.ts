import request from 'supertest';
import express from 'express';
import { createBookSearchResult, DEFAULTS } from '@/__tests__/fixtures/bookFixtures';
import { createExpectedApiResponse, createExpectedErrorResponse } from '@/__tests__/fixtures/bookRoutesFixtures';

const mockSearchByTitle = jest.fn();

jest.mock('@/services/bookSearchService', () => {
  return {
    BookSearchService: jest.fn().mockImplementation(() => ({
      searchByTitle: mockSearchByTitle
    }))
  };
});

import booksRouter from '@/routes/books';

const app = express();
app.use(express.json());
app.use('/books', booksRouter);

describe('Books 라우터', () => {
  beforeEach(() => {
    // 각 테스트 전에 목 함수 초기화
    mockSearchByTitle.mockClear();
  });

  describe('GET /books/search', () => {

    it('기본 페이징으로 책 검색이 성공해야 함', async () => {
      const mockResult = createBookSearchResult();
      mockSearchByTitle.mockResolvedValue({
        success: true,
        data: mockResult
      });

      const response = await request(app)
        .get('/books/search')
        .query({ title: DEFAULTS.QUERY })
        .expect(200);

      expect(response.body).toEqual(createExpectedApiResponse(mockResult));
      expect(mockSearchByTitle).toHaveBeenCalledWith(DEFAULTS.QUERY, {
        page: DEFAULTS.PAGE,
        limit: DEFAULTS.LIMIT
      });
    });

    it('커스텀 페이징으로 책 검색이 성공해야 함', async () => {
      const mockResult = createBookSearchResult({ page: 2, limit: 5 });
      mockSearchByTitle.mockResolvedValue({
        success: true,
        data: mockResult
      });

      const response = await request(app)
        .get('/books/search')
        .query({ title: DEFAULTS.QUERY, page: '2', limit: '5' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockSearchByTitle).toHaveBeenCalledWith(DEFAULTS.QUERY, {
        page: 2,
        limit: 5
      });
    });

    it('제목이 누락된 경우 400 에러를 반환해야 함', async () => {
      const response = await request(app)
        .get('/books/search')
        .expect(400);

      expect(response.body).toEqual(createExpectedErrorResponse('Title parameter is required'));
      expect(mockSearchByTitle).not.toHaveBeenCalled();
    });

    it('페이지가 유효한 숫자가 아닌 경우 400 에러를 반환해야 함', async () => {
      const response = await request(app)
        .get('/books/search')
        .query({ title: DEFAULTS.QUERY, page: 'invalid' })
        .expect(400);

      expect(response.body).toEqual(createExpectedErrorResponse('Page must be a valid number'));
      expect(mockSearchByTitle).not.toHaveBeenCalled();
    });

    it('제한값이 유효한 숫자가 아닌 경우 400 에러를 반환해야 함', async () => {
      const response = await request(app)
        .get('/books/search')
        .query({ title: DEFAULTS.QUERY, limit: 'invalid' })
        .expect(400);

      expect(response.body).toEqual(createExpectedErrorResponse('Limit must be a valid number'));
      expect(mockSearchByTitle).not.toHaveBeenCalled();
    });

    it('BookSearchService에서 에러를 반환할 때 400 에러를 반환해야 함', async () => {
      const errorMessage = 'Page must be a positive integer';
      mockSearchByTitle.mockResolvedValue({
        success: false,
        error: errorMessage
      });

      const response = await request(app)
        .get('/books/search')
        .query({ title: DEFAULTS.QUERY, page: '0' })
        .expect(400);

      expect(response.body).toEqual(createExpectedErrorResponse(errorMessage));
    });

    it('BookSearchService에서 메시지 없는 에러를 반환할 때 400 에러를 반환해야 함', async () => {
      mockSearchByTitle.mockResolvedValue({
        success: false
      });

      const response = await request(app)
        .get('/books/search')
        .query({ title: DEFAULTS.QUERY })
        .expect(400);

      expect(response.body).toEqual(createExpectedErrorResponse('Failed to search books'));
    });

    it('빈 제목 파라미터를 처리해야 함', async () => {
      const response = await request(app)
        .get('/books/search')
        .query({ title: '' })
        .expect(400);

      expect(response.body.message).toBe('Title parameter is required');
      expect(mockSearchByTitle).not.toHaveBeenCalled();
    });
  });
});