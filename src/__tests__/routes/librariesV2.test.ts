// 테스트용 환경변수 설정을 import보다 먼저 실행
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.LIBRARY_API_KEY = 'test-library-api-key';

const mockCalculateOptimalLibrarySet = jest.fn();
const mockLogWithRequest = jest.fn();
const mockLogApiError = jest.fn();

jest.mock('@/services/optimalLibraryServiceV2', () => {
  return {
    OptimalLibraryService: jest.fn().mockImplementation(() => ({
      calculateOptimalLibrarySet: mockCalculateOptimalLibrarySet
    }))
  };
});

jest.mock('@/services/loggingService', () => ({
  loggingService: {
    logWithRequest: mockLogWithRequest,
    logApiError: mockLogApiError
  }
}));

jest.mock('@/config/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

import request from 'supertest';
import express from 'express';
import librariesV2Router from '@/routes/librariesV2';
import { 
  createOptimalLibraryResponseV2, 
  createExpectedApiResponse, 
  createExpectedErrorResponse,
  LIBRARY_DEFAULTS 
} from '@/__tests__/fixtures/libraryRoutesFixtures';

describe('LibrariesV2 Router', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/libraries/v2', librariesV2Router);
  });

  beforeEach(() => {
    mockCalculateOptimalLibrarySet.mockClear();
    mockLogWithRequest.mockClear();
    mockLogApiError.mockClear();
    mockLogWithRequest.mockResolvedValue(undefined);
    mockLogApiError.mockResolvedValue(undefined);
  });

  describe('POST /api/libraries/v2/calculate-optimal-library-set', () => {
    const validRequest = { isbns: LIBRARY_DEFAULTS.VALID_ISBNS };
    const mockResponse = createOptimalLibraryResponseV2();

    it('유효한 요청으로 최적 도서관 조합 계산 성공 (V2 구조)', async () => {
      mockCalculateOptimalLibrarySet.mockResolvedValue({
        success: true,
        data: mockResponse
      });

      const response = await request(app)
        .post('/api/libraries/v2/calculate-optimal-library-set')
        .send(validRequest)
        .expect(200);

      expect(response.body).toEqual(createExpectedApiResponse(mockResponse));
      expect(mockCalculateOptimalLibrarySet).toHaveBeenCalledWith({
        isbns: validRequest.isbns
      });

      // 로깅 검증
      expect(mockLogWithRequest).toHaveBeenCalledWith(
        'INFO',
        'API_REQUEST',
        'Optimal library set calculation requested',
        expect.any(Object),
        { isbns: validRequest.isbns }
      );

      expect(mockLogWithRequest).toHaveBeenCalledWith(
        'INFO',
        'API_SUCCESS',
        'Optimal library calculation completed successfully',
        expect.any(Object),
        expect.objectContaining({
          duration_ms: expect.any(Number),
          optimal_sets_count: 1
        })
      );
    });

    it('V2 응답 구조 검증 - 도서관 중심 데이터', async () => {
      const customV2Response = createOptimalLibraryResponseV2({
        libraryCount: 2,
        coverageCount: 2,
        isbns: LIBRARY_DEFAULTS.VALID_ISBNS
      });

      mockCalculateOptimalLibrarySet.mockResolvedValue({
        success: true,
        data: customV2Response
      });

      const response = await request(app)
        .post('/api/libraries/v2/calculate-optimal-library-set')
        .send(validRequest)
        .expect(200);

      // V2 구조 검증: 도서관별 책 배치 확인
      const firstSet = response.body.data.optimalSets[0];
      expect(firstSet.libraries).toBeDefined();
      expect(firstSet.libraries).toHaveLength(2);
      expect(firstSet.coverageCount).toBe(2);

      // 각 도서관의 구조 검증
      firstSet.libraries.forEach((library: any) => {
        expect(library.lib_code).toBeDefined();
        expect(library.lib_name).toBeDefined();
        expect(library.address).toBeDefined();
        expect(library.books).toBeDefined();
        expect(Array.isArray(library.books)).toBe(true);
        
        // 각 책의 구조 검증
        library.books.forEach((book: any) => {
          expect(book.isbn).toBeDefined();
          expect(book.title).toBeDefined();
          expect(book.cover).toBeDefined();
        });
      });
    });

    it('isbns 필드가 없는 경우 400 에러', async () => {
      const response = await request(app)
        .post('/api/libraries/v2/calculate-optimal-library-set')
        .send({})
        .expect(400);

      expect(response.body).toEqual(createExpectedErrorResponse('isbns array is required'));
      expect(mockCalculateOptimalLibrarySet).not.toHaveBeenCalled();

      // 경고 로깅 검증
      expect(mockLogWithRequest).toHaveBeenCalledWith(
        'WARN',
        'VALIDATION_ERROR',
        'Missing or invalid isbns array',
        expect.any(Object),
        { received_isbns: undefined }
      );
    });

    it('isbns가 배열이 아닌 경우 400 에러', async () => {
      const response = await request(app)
        .post('/api/libraries/v2/calculate-optimal-library-set')
        .send({ isbns: 'not-an-array' })
        .expect(400);

      expect(response.body).toEqual(createExpectedErrorResponse('isbns array is required'));

      // 경고 로깅 검증
      expect(mockLogWithRequest).toHaveBeenCalledWith(
        'WARN',
        'VALIDATION_ERROR',
        'Missing or invalid isbns array',
        expect.any(Object),
        { received_isbns: 'not-an-array' }
      );
    });

    it('빈 배열인 경우 400 에러', async () => {
      const response = await request(app)
        .post('/api/libraries/v2/calculate-optimal-library-set')
        .send({ isbns: [] })
        .expect(400);

      expect(response.body).toEqual(createExpectedErrorResponse('isbns array must contain 1-3 items'));

      // 경고 로깅 검증
      expect(mockLogWithRequest).toHaveBeenCalledWith(
        'WARN',
        'VALIDATION_ERROR',
        'Invalid isbns array length',
        expect.any(Object),
        { isbns_length: 0, isbns: [] }
      );
    });

    it('3개를 초과하는 경우 400 에러', async () => {
      const tooManyIsbns = ['isbn1', 'isbn2', 'isbn3', 'isbn4'];
      const response = await request(app)
        .post('/api/libraries/v2/calculate-optimal-library-set')
        .send({ isbns: tooManyIsbns })
        .expect(400);

      expect(response.body).toEqual(createExpectedErrorResponse('isbns array must contain 1-3 items'));

      // 경고 로깅 검증
      expect(mockLogWithRequest).toHaveBeenCalledWith(
        'WARN',
        'VALIDATION_ERROR',
        'Invalid isbns array length',
        expect.any(Object),
        { isbns_length: 4, isbns: tooManyIsbns }
      );
    });

    it('유효하지 않은 ISBN 형식인 경우 400 에러', async () => {
      const invalidIsbns = [LIBRARY_DEFAULTS.INVALID_ISBN, LIBRARY_DEFAULTS.VALID_ISBNS[0]];
      const response = await request(app)
        .post('/api/libraries/v2/calculate-optimal-library-set')
        .send({ isbns: invalidIsbns })
        .expect(400);

      expect(response.body).toEqual(createExpectedErrorResponse(`Invalid ISBN format: ${LIBRARY_DEFAULTS.INVALID_ISBN}`));

      // 경고 로깅 검증
      expect(mockLogWithRequest).toHaveBeenCalledWith(
        'WARN',
        'VALIDATION_ERROR',
        'Invalid ISBN format detected',
        expect.any(Object),
        { 
          invalid_isbns: [LIBRARY_DEFAULTS.INVALID_ISBN], 
          valid_isbns: [LIBRARY_DEFAULTS.VALID_ISBNS[0]]
        }
      );
    });

    it('서비스에서 에러 반환 시 400 에러', async () => {
      const errorMessage = 'Database connection failed';
      mockCalculateOptimalLibrarySet.mockResolvedValue({
        success: false,
        error: errorMessage
      });

      const response = await request(app)
        .post('/api/libraries/v2/calculate-optimal-library-set')
        .send(validRequest)
        .expect(400);

      expect(response.body).toEqual(createExpectedErrorResponse(errorMessage));

      // 에러 로깅 검증
      expect(mockLogWithRequest).toHaveBeenCalledWith(
        'ERROR',
        'BUSINESS_LOGIC_ERROR',
        'Optimal library calculation failed',
        expect.any(Object),
        { error: errorMessage, isbns: validRequest.isbns }
      );
    });

    it('서비스에서 예외 발생 시 500 에러', async () => {
      const error = new Error('Unexpected error');
      mockCalculateOptimalLibrarySet.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/libraries/v2/calculate-optimal-library-set')
        .send(validRequest)
        .expect(500);

      expect(response.body).toEqual(createExpectedErrorResponse('Internal server error'));

      // API 에러 로깅 검증
      expect(mockLogApiError).toHaveBeenCalledWith(
        error,
        expect.any(Object),
        { 
          endpoint: '/calculate-optimal-library-set',
          duration_ms: expect.any(Number)
        }
      );
    });

    it('단일 ISBN으로 요청 성공 (V2)', async () => {
      const singleIsbnRequest = { isbns: LIBRARY_DEFAULTS.SINGLE_ISBN };
      const singleIsbnResponseV2 = createOptimalLibraryResponseV2({ 
        libraryCount: 1,
        bookCount: 1, 
        coverageCount: 1,
        isbns: LIBRARY_DEFAULTS.SINGLE_ISBN 
      });

      mockCalculateOptimalLibrarySet.mockResolvedValue({
        success: true,
        data: singleIsbnResponseV2
      });

      const response = await request(app)
        .post('/api/libraries/v2/calculate-optimal-library-set')
        .send(singleIsbnRequest)
        .expect(200);

      expect(response.body).toEqual(createExpectedApiResponse(singleIsbnResponseV2));
      
      // V2 단일 ISBN 응답 구조 검증
      const firstSet = response.body.data.optimalSets[0];
      expect(firstSet.libraries).toHaveLength(1);
      expect(firstSet.coverageCount).toBe(1);
      expect(firstSet.libraries[0].books).toHaveLength(1);
      expect(firstSet.libraries[0].books[0].isbn).toBe(LIBRARY_DEFAULTS.SINGLE_ISBN[0]);
    });

    it('유효한 ISBN 형식들이 모두 허용되는지 확인 (V2)', async () => {
      const validIsbnFormats = { isbns: LIBRARY_DEFAULTS.VALID_ISBN_FORMATS };
      const validFormatsResponseV2 = createOptimalLibraryResponseV2({ 
        libraryCount: 3,
        bookCount: 3, 
        coverageCount: 3,
        isbns: LIBRARY_DEFAULTS.VALID_ISBN_FORMATS 
      });

      mockCalculateOptimalLibrarySet.mockResolvedValue({
        success: true,
        data: validFormatsResponseV2
      });

      const response = await request(app)
        .post('/api/libraries/v2/calculate-optimal-library-set')
        .send(validIsbnFormats)
        .expect(200);

      expect(mockCalculateOptimalLibrarySet).toHaveBeenCalledWith(validIsbnFormats);
      
      // 3개의 다양한 ISBN 형식에 대한 V2 응답 구조 검증
      const firstSet = response.body.data.optimalSets[0];
      expect(firstSet.libraries).toHaveLength(3);
      expect(firstSet.coverageCount).toBe(3);
      
      // 각 도서관이 서로 다른 ISBN을 가지고 있는지 확인
      const allIsbnsInResponse = firstSet.libraries.flatMap((lib: any) => lib.books.map((book: any) => book.isbn));
      expect(allIsbnsInResponse).toHaveLength(3);
    });

    it('로깅 서비스 호출 횟수 검증', async () => {
      mockCalculateOptimalLibrarySet.mockResolvedValue({
        success: true,
        data: mockResponse
      });

      await request(app)
        .post('/api/libraries/v2/calculate-optimal-library-set')
        .send(validRequest)
        .expect(200);

      // 성공 시나리오에서 로깅 호출 횟수 검증
      expect(mockLogWithRequest).toHaveBeenCalledTimes(2); // REQUEST + SUCCESS
      expect(mockLogApiError).not.toHaveBeenCalled();
    });

    it('성능 로깅 검증 - 응답시간 측정', async () => {
      const startTime = Date.now();
      mockCalculateOptimalLibrarySet.mockImplementation(async () => {
        // 의도적으로 약간의 지연 추가
        await new Promise(resolve => setTimeout(resolve, 10));
        return { success: true, data: mockResponse };
      });

      await request(app)
        .post('/api/libraries/v2/calculate-optimal-library-set')
        .send(validRequest)
        .expect(200);

      // SUCCESS 로깅에서 duration_ms가 측정되었는지 확인
      const successLogCall = mockLogWithRequest.mock.calls.find(
        call => call[1] === 'API_SUCCESS'
      );
      
      expect(successLogCall).toBeDefined();
      expect(successLogCall[4].duration_ms).toBeGreaterThan(0);
      expect(successLogCall[4].duration_ms).toBeLessThan(1000); // 합리적인 범위
    });
  });
});