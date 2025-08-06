// 테스트용 환경변수 설정을 import보다 먼저 실행
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.LIBRARY_API_KEY = 'test-library-api-key';

const mockCalculateOptimalLibrarySet = jest.fn();

jest.mock('@/services/optimalLibraryService', () => {
  return {
    OptimalLibraryService: jest.fn().mockImplementation(() => ({
      calculateOptimalLibrarySet: mockCalculateOptimalLibrarySet
    }))
  };
});

jest.mock('@/config/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

import request from 'supertest';
import express from 'express';
import librariesRouter from '@/routes/libraries';
import { 
  createOptimalLibraryResponse, 
  createExpectedApiResponse, 
  createExpectedErrorResponse,
  LIBRARY_DEFAULTS 
} from '@/__tests__/fixtures/libraryRoutesFixtures';

describe('Libraries Router', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/libraries', librariesRouter);
  });

  beforeEach(() => {
    mockCalculateOptimalLibrarySet.mockClear();
  });

  describe('POST /api/libraries/calculate-optimal-library-set', () => {
    const validRequest = { isbns: LIBRARY_DEFAULTS.VALID_ISBNS };
    const mockResponse = createOptimalLibraryResponse();

    it('유효한 요청으로 최적 도서관 조합 계산 성공', async () => {
      mockCalculateOptimalLibrarySet.mockResolvedValue({
        success: true,
        data: mockResponse
      });

      const response = await request(app)
        .post('/api/libraries/calculate-optimal-library-set')
        .send(validRequest)
        .expect(200);

      expect(response.body).toEqual(createExpectedApiResponse(mockResponse));
      expect(mockCalculateOptimalLibrarySet).toHaveBeenCalledWith({
        isbns: validRequest.isbns
      });
    });

    it('isbns 필드가 없는 경우 400 에러', async () => {
      const response = await request(app)
        .post('/api/libraries/calculate-optimal-library-set')
        .send({})
        .expect(400);

      expect(response.body).toEqual(createExpectedErrorResponse('isbns array is required'));
      expect(mockCalculateOptimalLibrarySet).not.toHaveBeenCalled();
    });

    it('isbns가 배열이 아닌 경우 400 에러', async () => {
      const response = await request(app)
        .post('/api/libraries/calculate-optimal-library-set')
        .send({ isbns: 'not-an-array' })
        .expect(400);

      expect(response.body).toEqual(createExpectedErrorResponse('isbns array is required'));
    });

    it('빈 배열인 경우 400 에러', async () => {
      const response = await request(app)
        .post('/api/libraries/calculate-optimal-library-set')
        .send({ isbns: [] })
        .expect(400);

      expect(response.body).toEqual(createExpectedErrorResponse('isbns array must contain 1-3 items'));
    });

    it('3개를 초과하는 경우 400 에러', async () => {
      const response = await request(app)
        .post('/api/libraries/calculate-optimal-library-set')
        .send({ isbns: ['isbn1', 'isbn2', 'isbn3', 'isbn4'] })
        .expect(400);

      expect(response.body).toEqual(createExpectedErrorResponse('isbns array must contain 1-3 items'));
    });

    it('유효하지 않은 ISBN 형식인 경우 400 에러', async () => {
      const response = await request(app)
        .post('/api/libraries/calculate-optimal-library-set')
        .send({ isbns: [LIBRARY_DEFAULTS.INVALID_ISBN, LIBRARY_DEFAULTS.VALID_ISBNS[0]] })
        .expect(400);

      expect(response.body).toEqual(createExpectedErrorResponse(`Invalid ISBN format: ${LIBRARY_DEFAULTS.INVALID_ISBN}`));
    });

    it('서비스에서 에러 반환 시 400 에러', async () => {
      const errorMessage = 'Database connection failed';
      mockCalculateOptimalLibrarySet.mockResolvedValue({
        success: false,
        error: errorMessage
      });

      const response = await request(app)
        .post('/api/libraries/calculate-optimal-library-set')
        .send(validRequest)
        .expect(400);

      expect(response.body).toEqual(createExpectedErrorResponse(errorMessage));
    });

    it('서비스에서 예외 발생 시 500 에러', async () => {
      mockCalculateOptimalLibrarySet.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/libraries/calculate-optimal-library-set')
        .send(validRequest)
        .expect(500);

      expect(response.body).toEqual(createExpectedErrorResponse('Internal server error'));
    });

    it('단일 ISBN으로 요청 성공', async () => {
      const singleIsbnRequest = { isbns: LIBRARY_DEFAULTS.SINGLE_ISBN };
      const singleIsbnResponse = createOptimalLibraryResponse({ 
        bookCount: 1, 
        isbns: LIBRARY_DEFAULTS.SINGLE_ISBN 
      });

      mockCalculateOptimalLibrarySet.mockResolvedValue({
        success: true,
        data: singleIsbnResponse
      });

      const response = await request(app)
        .post('/api/libraries/calculate-optimal-library-set')
        .send(singleIsbnRequest)
        .expect(200);

      expect(response.body).toEqual(createExpectedApiResponse(singleIsbnResponse));
    });

    it('유효한 ISBN 형식들이 모두 허용되는지 확인', async () => {
      const validIsbnFormats = { isbns: LIBRARY_DEFAULTS.VALID_ISBN_FORMATS };
      const validFormatsResponse = createOptimalLibraryResponse({ 
        bookCount: 3, 
        isbns: LIBRARY_DEFAULTS.VALID_ISBN_FORMATS 
      });

      mockCalculateOptimalLibrarySet.mockResolvedValue({
        success: true,
        data: validFormatsResponse
      });

      const response = await request(app)
        .post('/api/libraries/calculate-optimal-library-set')
        .send(validIsbnFormats)
        .expect(200);

      expect(mockCalculateOptimalLibrarySet).toHaveBeenCalledWith(validIsbnFormats);
    });
  });
});