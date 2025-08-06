// 테스트용 환경변수 설정을 import보다 먼저 실행
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.LIBRARY_API_KEY = 'test-library-api-key';

jest.mock('@/services/libraryDatabaseService');
jest.mock('@/services/libraryApiClient');
jest.mock('@/services/AladdinApiClient');
jest.mock('@/config/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

import { OptimalLibraryService } from '@/services/optimalLibraryService';
import { LibraryDatabaseService } from '@/services/libraryDatabaseService';
import { LibraryApiClient } from '@/services/libraryApiClient';
import { AladdinApiClient } from '@/services/AladdinApiClient';
import {
  MOCK_SUCCESS_RESPONSES,
  MOCK_FAILURE_RESPONSES,
  TEST_ISBNS,
  TEST_CONSTANTS
} from '@/__tests__/fixtures/optimalLibraryServiceFixtures';

const MockedLibraryDatabaseService = LibraryDatabaseService as jest.MockedClass<typeof LibraryDatabaseService>;
const MockedLibraryApiClient = LibraryApiClient as jest.MockedClass<typeof LibraryApiClient>;
const MockedAladdinApiClient = AladdinApiClient as jest.MockedClass<typeof AladdinApiClient>;

describe('OptimalLibraryService', () => {
  let sut: OptimalLibraryService;
  let mockDbService: jest.Mocked<LibraryDatabaseService>;
  let mockApiClient: jest.Mocked<LibraryApiClient>;
  let mockAladdinClient: jest.Mocked<AladdinApiClient>;

  beforeEach(() => {
    MockedLibraryDatabaseService.mockClear();
    MockedLibraryApiClient.mockClear();
    MockedAladdinApiClient.mockClear();

    mockDbService = new MockedLibraryDatabaseService() as jest.Mocked<LibraryDatabaseService>;
    mockApiClient = new MockedLibraryApiClient() as jest.Mocked<LibraryApiClient>;
    mockAladdinClient = new MockedAladdinApiClient() as jest.Mocked<AladdinApiClient>;

    sut = new OptimalLibraryService();
    
    // 목 서비스 주입
    (sut as any).libraryDbService = mockDbService;
    (sut as any).libraryApiClient = mockApiClient;
    (sut as any).aladdinApiClient = mockAladdinClient;
  });

  describe('calculateOptimalLibrarySet', () => {

    it('입력 검증 - ISBN 배열이 없는 경우', async () => {
      const result = await sut.calculateOptimalLibrarySet({ isbns: TEST_ISBNS.EMPTY });

      expect(result.success).toBe(false);
      expect(result.error).toBe('ISBN list must contain 1-3 items');
    });

    it('입력 검증 - ISBN이 3개를 초과하는 경우', async () => {
      const result = await sut.calculateOptimalLibrarySet({ 
        isbns: TEST_ISBNS.TOO_MANY 
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('ISBN list must contain 1-3 items');
    });

    it('DB 조회 실패 시 에러 반환', async () => {
      mockDbService.getAllLibraries.mockResolvedValue(MOCK_FAILURE_RESPONSES.database);

      const result = await sut.calculateOptimalLibrarySet({ isbns: [TEST_ISBNS.SINGLE] });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch libraries from database');
    });

    it('단일 ISBN으로 최적 도서관 조합 계산 성공', async () => {
      const isbn = TEST_ISBNS.SINGLE;
      
      mockDbService.getAllLibraries.mockResolvedValue(MOCK_SUCCESS_RESPONSES.database);
      mockAladdinClient.searchBooksByISBN.mockResolvedValue({
        success: true,
        data: MOCK_SUCCESS_RESPONSES.aladdin.singleBook
      });
      mockApiClient.searchLibrariesByISBN.mockResolvedValue({
        success: true,
        data: MOCK_SUCCESS_RESPONSES.libraryApi.libraryA
      });

      const result = await sut.calculateOptimalLibrarySet({ isbns: [isbn] });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.optimalSets).toHaveLength(TEST_CONSTANTS.EXPECTED_VALUES.SINGLE_SET_LENGTH);
      expect(result.data!.optimalSets[0].books).toHaveLength(TEST_CONSTANTS.EXPECTED_VALUES.SINGLE_BOOK_LENGTH);
      expect(result.data!.optimalSets[0].books[0].isbn).toBe(isbn);
      expect(result.data!.optimalSets[0].books[0].title).toBeDefined();
      expect(result.data!.optimalSets[0].books[0].cover).toBeDefined();
      expect(result.data!.optimalSets[0].books[0].libraries).toHaveLength(TEST_CONSTANTS.EXPECTED_VALUES.SINGLE_LIBRARY_LENGTH);
      expect(result.data!.optimalSets[0].books[0].libraries[0].lib_code).toBe(TEST_CONSTANTS.LIBRARY_CODES.LIBRARY_A);
      expect(result.data!.optimalSets[0].coverageRate).toBe(TEST_CONSTANTS.EXPECTED_VALUES.FULL_COVERAGE_RATE);
    });

    it('복수 ISBN으로 최적 도서관 조합 계산', async () => {
      const isbns = TEST_ISBNS.MULTIPLE;
      
      mockDbService.getAllLibraries.mockResolvedValue(MOCK_SUCCESS_RESPONSES.database);
      
      // 알라딘 API - 두 책 정보 순차 반환
      mockAladdinClient.searchBooksByISBN
        .mockResolvedValueOnce({ success: true, data: MOCK_SUCCESS_RESPONSES.aladdin.book1 })
        .mockResolvedValueOnce({ success: true, data: MOCK_SUCCESS_RESPONSES.aladdin.book2 });

      // 도서관 API - 첫 번째 책은 A 도서관, 두 번째 책은 B 도서관
      mockApiClient.searchLibrariesByISBN
        .mockResolvedValueOnce({ success: true, data: MOCK_SUCCESS_RESPONSES.libraryApi.libraryA })
        .mockResolvedValueOnce({ success: true, data: MOCK_SUCCESS_RESPONSES.libraryApi.libraryB });

      const result = await sut.calculateOptimalLibrarySet({ isbns });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.optimalSets.length).toBeGreaterThan(0);
      
      // 모든 책을 커버하는 조합이 있어야 함
      const fullCoverageSets = result.data!.optimalSets.filter(set => set.coverageRate === TEST_CONSTANTS.EXPECTED_VALUES.FULL_COVERAGE_RATE);
      expect(fullCoverageSets.length).toBeGreaterThan(TEST_CONSTANTS.EXPECTED_VALUES.EMPTY_SETS_LENGTH);
      
      // 두 책이 모두 포함된 조합이 있어야 함
      const fullCoverageSet = fullCoverageSets[0];
      expect(fullCoverageSet.books).toHaveLength(TEST_CONSTANTS.EXPECTED_VALUES.MULTIPLE_BOOKS_LENGTH);
      expect(fullCoverageSet.books.map(book => book.isbn).sort()).toEqual(isbns.sort());
    });

    it('API 호출 실패 시에도 정상 처리', async () => {
      const isbn = TEST_ISBNS.SINGLE;
      
      mockDbService.getAllLibraries.mockResolvedValue(MOCK_SUCCESS_RESPONSES.database);
      mockAladdinClient.searchBooksByISBN.mockResolvedValue(MOCK_FAILURE_RESPONSES.aladdin);
      mockApiClient.searchLibrariesByISBN.mockResolvedValue(MOCK_FAILURE_RESPONSES.libraryApi);

      const result = await sut.calculateOptimalLibrarySet({ isbns: [isbn] });

      expect(result.success).toBe(true);
      expect(result.data!.optimalSets).toHaveLength(TEST_CONSTANTS.EXPECTED_VALUES.EMPTY_SETS_LENGTH);
    });

    it('DB에 없는 도서관은 무시', async () => {
      const isbn = TEST_ISBNS.SINGLE;
      
      mockDbService.getAllLibraries.mockResolvedValue(MOCK_SUCCESS_RESPONSES.database);
      mockAladdinClient.searchBooksByISBN.mockResolvedValue({
        success: true,
        data: MOCK_SUCCESS_RESPONSES.aladdin.testBook
      });
      
      // DB에 없는 도서관만 반환
      mockApiClient.searchLibrariesByISBN.mockResolvedValue({
        success: true,
        data: MOCK_SUCCESS_RESPONSES.libraryApi.nonExistentLibrary
      });

      const result = await sut.calculateOptimalLibrarySet({ isbns: [isbn] });

      expect(result.success).toBe(true);
      expect(result.data!.optimalSets).toHaveLength(TEST_CONSTANTS.EXPECTED_VALUES.EMPTY_SETS_LENGTH);
    });
  });
});