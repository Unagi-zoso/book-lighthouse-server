import { BookSearchService } from '@/services/bookSearchService';
import { AladdinApiClient } from '@/services/AladdinApiClient';
import { createAladdinSearchResponse, DEFAULTS } from '@/__tests__/fixtures/bookFixtures';

jest.mock('@/services/AladdinApiClient');

const MockedAladdinApiClient = AladdinApiClient as jest.MockedClass<typeof AladdinApiClient>;

describe('BookSearchService', () => {
  let sut: BookSearchService;
  let mockAladdinClient: jest.Mocked<AladdinApiClient>;

  beforeEach(() => {
    MockedAladdinApiClient.mockClear();
    mockAladdinClient = new MockedAladdinApiClient() as jest.Mocked<AladdinApiClient>;
    sut = new BookSearchService();
    
    // 목 클라이언트 주입
    (sut as any).aladdinClient = mockAladdinClient;
  });

  describe('제목으로 책을 검색할 시', () => {

    it('기본 옵션으로 책 검색이 성공해야 함', async () => {
      const mockResponse = createAladdinSearchResponse();
      mockAladdinClient.searchBooksByTitle.mockResolvedValue({
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
        total: DEFAULTS.TOTAL,
        totalPages: DEFAULTS.TOTAL_PAGES
      });

      expect(mockAladdinClient.searchBooksByTitle).toHaveBeenCalledWith(DEFAULTS.QUERY, {
        Start: DEFAULTS.START_INDEX,
        MaxResults: DEFAULTS.LIMIT
      });
    });

    it('커스텀 페이징으로 책 검색이 성공해야 함', async () => {
      const mockResponse = createAladdinSearchResponse({ totalResults: DEFAULTS.TOTAL });
      mockAladdinClient.searchBooksByTitle.mockResolvedValue({
        success: true,
        data: mockResponse
      });

      const result = await sut.searchByTitle(DEFAULTS.QUERY, { page: 2, limit: 5 });

      expect(result.success).toBe(true);
      expect(result.data!.pagination).toEqual({
        page: 2,
        limit: 5,
        total: DEFAULTS.TOTAL,
        totalPages: 5
      });

      expect(mockAladdinClient.searchBooksByTitle).toHaveBeenCalledWith(DEFAULTS.QUERY, {
        Start: 6,
        MaxResults: 5
      });
    });

    it('잘못된 페이지 번호에 대해 에러를 반환해야 함', async () => {
      const result = await sut.searchByTitle(DEFAULTS.QUERY, { page: 0 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Page must be a positive integer');
      expect(mockAladdinClient.searchBooksByTitle).not.toHaveBeenCalled();
    });

    it('잘못된 제한값에 대해 에러를 반환해야 함', async () => {
      const result = await sut.searchByTitle(DEFAULTS.QUERY, { limit: 100 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Limit must be between 5 and 50');
      expect(mockAladdinClient.searchBooksByTitle).not.toHaveBeenCalled();
    });

    it('1보다 작은 제한값에 대해 에러를 반환해야 함', async () => {
      const result = await sut.searchByTitle(DEFAULTS.QUERY, { limit: 0 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Limit must be between 5 and 50');
      expect(mockAladdinClient.searchBooksByTitle).not.toHaveBeenCalled();
    });

    it('API 클라이언트 에러를 처리해야 함', async () => {
      mockAladdinClient.searchBooksByTitle.mockResolvedValue({
        success: false,
        error: 'API request failed'
      });

      const result = await sut.searchByTitle(DEFAULTS.QUERY);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API request failed');
    });

    it('에러 메시지가 없는 API 클라이언트 에러를 처리해야 함', async () => {
      mockAladdinClient.searchBooksByTitle.mockResolvedValue({
        success: false
      });

      const result = await sut.searchByTitle(DEFAULTS.QUERY);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to search books');
    });

    it('API에서 데이터가 누락된 경우를 처리해야 함', async () => {
      mockAladdinClient.searchBooksByTitle.mockResolvedValue({
        success: true,
        data: undefined
      });

      const result = await sut.searchByTitle(DEFAULTS.QUERY);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No data received from search API');
    });

    it('다양한 시나리오에서 올바른 페이징을 계산해야 함', async () => {
      // 다양한 페이징 시나리오 테스트
      const scenarios = [
        { total: 100, limit: 10, expectedPages: 10 },
        { total: 105, limit: 10, expectedPages: 11 },
        { total: 5, limit: 10, expectedPages: 1 },
        { total: 0, limit: 10, expectedPages: 0 }
      ];

      for (const scenario of scenarios) {
        const mockResponse = createAladdinSearchResponse({
          totalResults: scenario.total
        });

        mockAladdinClient.searchBooksByTitle.mockResolvedValue({
          success: true,
          data: mockResponse
        });

        const result = await sut.searchByTitle(DEFAULTS.QUERY, { limit: scenario.limit });

        expect(result.success).toBe(true);
        expect(result.data!.pagination.totalPages).toBe(scenario.expectedPages);
      }
    });
  });
});