import { LibraryApiClient } from '@/services/libraryApiClient';
import { ExternalApiService } from '@/services/externalApi';
import { createLibrarySearchResponse, DEFAULT_LIBRARY_COUNT } from '@/__tests__/fixtures/libraryFixtures';

jest.mock('@/services/externalApi');

const MockedExternalApiService = ExternalApiService as jest.MockedClass<typeof ExternalApiService>;

// 환경변수 모킹
const originalEnv = process.env;

beforeAll(() => {
  process.env = {
    ...originalEnv,
    LIBRARY_API_KEY: 'test-api-key'
  };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('LibraryApiClient', () => {
  let sut: LibraryApiClient;
  let mockApiService: jest.Mocked<ExternalApiService>;

  beforeEach(() => {
    MockedExternalApiService.mockClear();
    mockApiService = new MockedExternalApiService({} as any) as jest.Mocked<ExternalApiService>;
    sut = new LibraryApiClient();
    
    // 목 서비스 주입
    (sut as any).apiService = mockApiService;
  });

  describe('searchLibrariesByBook', () => {
    it('ISBN으로 도서관 검색이 성공해야 함', async () => {
      const mockResponse = createLibrarySearchResponse();
      mockApiService.get.mockResolvedValue({
        success: true,
        data: mockResponse
      });

      const result = await sut.searchLibrariesByBook({
        isbn: '9788936433529',
        region: 11
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.response.libs).toHaveLength(DEFAULT_LIBRARY_COUNT);
      expect(result.data!.response.numFound).toBe(25);

      expect(mockApiService.get).toHaveBeenCalledWith(
        expect.stringContaining('/libSrchByBook?')
      );
    });

    it('커스텀 페이징으로 도서관 검색이 성공해야 함', async () => {
      const mockResponse = createLibrarySearchResponse({
        pageNo: 2,
        pageSize: 5,
        resultNum: 5
      });
      mockApiService.get.mockResolvedValue({
        success: true,
        data: mockResponse
      });

      const result = await sut.searchLibrariesByBook({
        isbn: '9788936433529',
        region: 11,
        pageNo: 2,
        pageSize: 5
      });

      expect(result.success).toBe(true);
      expect(result.data!.response.pageNo).toBe(2);
      expect(result.data!.response.pageSize).toBe(5);
      expect(result.data!.response.resultNum).toBe(5);
    });

    it('세부지역과 함께 검색이 성공해야 함', async () => {
      const mockResponse = createLibrarySearchResponse();
      mockApiService.get.mockResolvedValue({
        success: true,
        data: mockResponse
      });

      const result = await sut.searchLibrariesByBook({
        isbn: '9788936433529',
        region: 11,
        dtl_region: 11110
      });

      expect(result.success).toBe(true);
      expect(mockApiService.get).toHaveBeenCalledWith(
        expect.stringContaining('dtl_region=11110')
      );
    });

    it('다양한 개수의 도서관 검색 결과를 처리해야 함', async () => {
      const libraryCount = 5;
      const mockResponse = createLibrarySearchResponse({
        libraryCount,
        resultNum: libraryCount
      });
      mockApiService.get.mockResolvedValue({
        success: true,
        data: mockResponse
      });

      const result = await sut.searchLibrariesByBook({
        isbn: '9788936433529',
        region: 11
      });

      expect(result.success).toBe(true);
      expect(result.data!.response.libs).toHaveLength(libraryCount);
      expect(result.data!.response.resultNum).toBe(libraryCount);
    });

    it('API 에러를 처리해야 함', async () => {
      mockApiService.get.mockResolvedValue({
        success: false,
        error: 'API request failed'
      });

      const result = await sut.searchLibrariesByBook({
        isbn: '9788936433529',
        region: 11
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('API request failed');
    });
  });

  describe('searchLibrariesByISBN', () => {
    it('간편 ISBN 검색이 성공해야 함', async () => {
      const mockResponse = createLibrarySearchResponse();
      mockApiService.get.mockResolvedValue({
        success: true,
        data: mockResponse
      });

      const result = await sut.searchLibrariesByISBN('9788936433529');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockApiService.get).toHaveBeenCalledWith(
        expect.stringContaining('isbn=9788936433529')
      );
    });

    it('옵션과 함께 ISBN 검색이 성공해야 함', async () => {
      const mockResponse = createLibrarySearchResponse();
      mockApiService.get.mockResolvedValue({
        success: true,
        data: mockResponse
      });

      const result = await sut.searchLibrariesByISBN('9788936433529', {
        dtl_region: 11110,
        pageSize: 20
      });

      expect(result.success).toBe(true);
      expect(mockApiService.get).toHaveBeenCalledWith(
        expect.stringContaining('dtl_region=11110')
      );
      expect(mockApiService.get).toHaveBeenCalledWith(
        expect.stringContaining('pageSize=20')
      );
    });
  });
});