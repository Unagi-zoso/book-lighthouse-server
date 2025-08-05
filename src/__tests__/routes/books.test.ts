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
      expect(mockSearchByTitle).toHaveBeenCalledWith(DEFAULTS.QUERY, expect.any(Object));
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
      expect(mockSearchByTitle).toHaveBeenCalledWith(DEFAULTS.QUERY, expect.any(Object));
    });

    it('제목이 누락된 경우 400 에러를 반환해야 함', async () => {
      const response = await request(app)
        .get('/books/search')
        .expect(400);

      expect(response.body).toEqual(createExpectedErrorResponse('Title parameter is required'));
      expect(mockSearchByTitle).not.toHaveBeenCalled();
    });

    it('잘못된 페이지 값이라도 서비스를 호출해야 함', async () => {
      const mockResult = createBookSearchResult();
      mockSearchByTitle.mockResolvedValue({
        success: true,
        data: mockResult
      });

      const response = await request(app)
        .get('/books/search')
        .query({ title: DEFAULTS.QUERY, page: 'invalid' })
        .expect(200);

      expect(mockSearchByTitle).toHaveBeenCalledWith(DEFAULTS.QUERY, expect.any(Object));
      expect(response.body.success).toBe(true);
    });

    it('잘못된 제한값이라도 서비스를 호출해야 함', async () => {
      const mockResult = createBookSearchResult();
      mockSearchByTitle.mockResolvedValue({
        success: true,
        data: mockResult
      });

      const response = await request(app)
        .get('/books/search')
        .query({ title: DEFAULTS.QUERY, limit: 'invalid' })
        .expect(200);

      expect(mockSearchByTitle).toHaveBeenCalledWith(DEFAULTS.QUERY, expect.any(Object));
      expect(response.body.success).toBe(true);
    });

    it('음수 페이지라도 서비스를 호출해야 함', async () => {
      const mockResult = createBookSearchResult();
      mockSearchByTitle.mockResolvedValue({
        success: true,
        data: mockResult
      });

      const response = await request(app)
        .get('/books/search')
        .query({ title: DEFAULTS.QUERY, page: '-1' })
        .expect(200);

      expect(mockSearchByTitle).toHaveBeenCalledWith(DEFAULTS.QUERY, expect.any(Object));
      expect(response.body.success).toBe(true);
    });

    it('BookSearchService에서 에러를 반환할 때 400 에러를 반환해야 함', async () => {
      const errorMessage = '서비스 에러입니다';
      mockSearchByTitle.mockResolvedValue({
        success: false,
        error: errorMessage
      });

      const response = await request(app)
        .get('/books/search')
        .query({ title: DEFAULTS.QUERY })
        .expect(400);

      expect(response.body).toEqual(createExpectedErrorResponse(errorMessage));
      expect(mockSearchByTitle).toHaveBeenCalledWith(DEFAULTS.QUERY, expect.any(Object));
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
      expect(mockSearchByTitle).toHaveBeenCalledWith(DEFAULTS.QUERY, expect.any(Object));
    });

    it('빈 제목 파라미터를 처리해야 함', async () => {
      const response = await request(app)
        .get('/books/search')
        .query({ title: '' })
        .expect(400);

      expect(response.body.message).toBe('Title parameter is required');
      expect(mockSearchByTitle).not.toHaveBeenCalled();
    });

    it('공백(white space) 제목 파라미터를 처리해야 함', async () => {
      const response = await request(app)
        .get('/books/search')
        .query({ title: ' '})
        .expect(400);

      expect(response.body.message).toBe('Title parameter is required');
      expect(mockSearchByTitle).not.toHaveBeenCalled();
    });

    it('0 제한값이라도 서비스를 호출해야 함', async () => {
      const mockResult = createBookSearchResult();
      mockSearchByTitle.mockResolvedValue({
        success: true,
        data: mockResult
      });

      const response = await request(app)
        .get('/books/search')
        .query({ title: DEFAULTS.QUERY, limit: '0' })
        .expect(200);

      expect(mockSearchByTitle).toHaveBeenCalledWith(DEFAULTS.QUERY, expect.any(Object));
      expect(response.body.success).toBe(true);
    });

    it('0 페이지라도 서비스를 호출해야 함', async () => {
      const mockResult = createBookSearchResult();
      mockSearchByTitle.mockResolvedValue({
        success: true,
        data: mockResult
      });

      const response = await request(app)
        .get('/books/search')
        .query({ title: DEFAULTS.QUERY, page: '0' })
        .expect(200);

      expect(mockSearchByTitle).toHaveBeenCalledWith(DEFAULTS.QUERY, expect.any(Object));
      expect(response.body.success).toBe(true);
    });
  });
});