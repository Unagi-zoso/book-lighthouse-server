import { BookSearchService } from '@/services/bookSearchService';
import { NLApiClient } from '@/services/nlApiClient';
import { createBookSearchResponse, DEFAULTS } from '@/__tests__/fixtures/bookFixtures';

jest.mock('@/services/nlApiClient');

const MockedNLApiClient = NLApiClient as jest.MockedClass<typeof NLApiClient>;

describe('BookSearchService', () => {
  let sut: BookSearchService;
  let mockNLClient: jest.Mocked<NLApiClient>;

  beforeEach(() => {
    process.env.NL_API_KEY = 'test-key';
    MockedNLApiClient.mockClear();
    mockNLClient = new MockedNLApiClient() as jest.Mocked<NLApiClient>;
    sut = new BookSearchService();
    
    // 목 클라이언트 주입
    (sut as any).nlClient = mockNLClient;
  });

  describe('제목으로 책을 검색할 시', () => {

    it('기본 옵션으로 책 검색이 성공해야 함', async () => {
      const { createNLBibliographicResponse } = await import('@/__tests__/fixtures/nlFixtures');
      const mockResponse = createNLBibliographicResponse();
      mockNLClient.searchBibliographic.mockResolvedValue({
        success: true,
        data: mockResponse
      });

      const result = await sut.searchByTitle(DEFAULTS.QUERY);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.books).toHaveLength(DEFAULTS.BOOKS_COUNT);
      expect(result.data!.pagination).toEqual({
        page: DEFAULTS.PAGE,
        limit: DEFAULTS.LIMIT,
        total: DEFAULTS.BOOKS_COUNT, // 필터링된 결과 개수
        totalPages: 1 // Math.ceil(2/10) = 1
      });

      expect(mockNLClient.searchBibliographic).toHaveBeenCalledWith(DEFAULTS.QUERY, {
        page_no: '1',
        page_size: '15' // 항상 15로 고정
      });
    });

    it('커스텀 페이징으로 책 검색이 성공해야 함', async () => {
      const { createNLBibliographicResponse } = await import('@/__tests__/fixtures/nlFixtures');
      const mockResponse = createNLBibliographicResponse({ TOTAL_COUNT: DEFAULTS.TOTAL.toString() });
      mockNLClient.searchBibliographic.mockResolvedValue({
        success: true,
        data: mockResponse
      });

      const result = await sut.searchByTitle(DEFAULTS.QUERY, { page: 2, limit: 5 });

      expect(result.success).toBe(true);
      expect(result.data!.pagination).toEqual({
        page: 2,
        limit: 5,
        total: DEFAULTS.BOOKS_COUNT, // 필터링된 결과 개수
        totalPages: 1 // Math.ceil(2/5) = 1
      });

      expect(mockNLClient.searchBibliographic).toHaveBeenCalledWith(DEFAULTS.QUERY, {
        page_no: '1',
        page_size: '15'
      });
    });

    it('잘못된 페이지 번호에 대해 에러를 반환해야 함', async () => {
      const result = await sut.searchByTitle(DEFAULTS.QUERY, { page: 0 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Page must be a positive integer');
      expect(mockNLClient.searchBibliographic).not.toHaveBeenCalled();
    });

    it('큰 제한값을 자동으로 최대값으로 조정해야 함', async () => {
      const { createNLBibliographicResponse } = await import('@/__tests__/fixtures/nlFixtures');
      const mockResponse = createNLBibliographicResponse();
      mockNLClient.searchBibliographic.mockResolvedValue({
        success: true,
        data: mockResponse
      });

      const result = await sut.searchByTitle(DEFAULTS.QUERY, { limit: 100 });

      expect(result.success).toBe(true);
      expect(result.data!.pagination.limit).toBe(10); // 최대값이 10으로 변경됨
      expect(mockNLClient.searchBibliographic).toHaveBeenCalledWith(DEFAULTS.QUERY, {
        page_no: '1',
        page_size: '15'
      });
    });

    it('작은 제한값을 자동으로 최소값으로 조정해야 함', async () => {
      const { createNLBibliographicResponse } = await import('@/__tests__/fixtures/nlFixtures');
      const mockResponse = createNLBibliographicResponse();
      mockNLClient.searchBibliographic.mockResolvedValue({
        success: true,
        data: mockResponse
      });

      const result = await sut.searchByTitle(DEFAULTS.QUERY, { limit: 0 });

      expect(result.success).toBe(true);
      expect(result.data!.pagination.limit).toBe(1); // 자동으로 1로 조정
      expect(mockNLClient.searchBibliographic).toHaveBeenCalledWith(DEFAULTS.QUERY, {
        page_no: '1',
        page_size: '15'
      });
    });

    it('API 클라이언트 에러를 처리해야 함', async () => {
      mockNLClient.searchBibliographic.mockResolvedValue({
        success: false,
        error: 'API request failed'
      });

      const result = await sut.searchByTitle(DEFAULTS.QUERY);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API request failed');
    });

    it('에러 메시지가 없는 API 클라이언트 에러를 처리해야 함', async () => {
      mockNLClient.searchBibliographic.mockResolvedValue({
        success: false
      });

      const result = await sut.searchByTitle(DEFAULTS.QUERY);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to search books');
    });

    it('API에서 데이터가 누락된 경우를 처리해야 함', async () => {
      mockNLClient.searchBibliographic.mockResolvedValue({
        success: true,
        data: undefined
      });

      const result = await sut.searchByTitle(DEFAULTS.QUERY);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No data received from search API');
    });

    it('다양한 시나리오에서 올바른 페이징을 계산해야 함', async () => {
      const { createNLBibliographicResponse } = await import('@/__tests__/fixtures/nlFixtures');
      // 다양한 페이징 시나리오 테스트 (필터링된 결과 기준)
      const scenarios = [
        { docsCount: 5, limit: 5, expectedPages: 1 }, // 5개 결과, limit 5 = 1페이지
        { docsCount: 6, limit: 5, expectedPages: 2 }, // 6개 결과, limit 5 = 2페이지  
        { docsCount: 5, limit: 5, expectedPages: 1 }, // 5개 결과, limit 5 = 1페이지
        { docsCount: 0, limit: 5, expectedPages: 0 }  // 0개 결과 = 0페이지
      ];

      for (const scenario of scenarios) {
        const mockResponse = createNLBibliographicResponse({
          TOTAL_COUNT: '25', // API 응답은 상관없고 실제 docs 개수만 중요
          docsCount: scenario.docsCount
        });

        mockNLClient.searchBibliographic.mockResolvedValue({
          success: true,
          data: mockResponse
        });

        const result = await sut.searchByTitle(DEFAULTS.QUERY, { limit: scenario.limit });

        expect(result.success).toBe(true);
        expect(result.data!.pagination.totalPages).toBe(scenario.expectedPages);
        expect(result.data!.pagination.total).toBe(scenario.docsCount); // 필터링된 결과 개수
      }
    });
  });
});