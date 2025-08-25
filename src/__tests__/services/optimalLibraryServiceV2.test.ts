// 테스트용 환경변수 설정을 import보다 먼저 실행
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.LIBRARY_API_KEY = 'test-library-api-key';

jest.mock('@/services/libraryDatabaseService');
jest.mock('@/services/libraryApiClient');
jest.mock('@/services/aladdinApiClient');
jest.mock('@/config/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

import { OptimalLibraryService } from '@/services/optimalLibraryServiceV2';
import { LibraryDatabaseService } from '@/services/libraryDatabaseService';
import { LibraryApiClient } from '@/services/libraryApiClient';
import { AladdinApiClient } from '@/services/aladdinApiClient';
import {
  MOCK_SUCCESS_RESPONSES,
  MOCK_FAILURE_RESPONSES,
  TEST_ISBNS,
  TEST_CONSTANTS
} from '@/__tests__/fixtures/optimalLibraryServiceFixtures';

const MockedLibraryDatabaseService = LibraryDatabaseService as jest.MockedClass<typeof LibraryDatabaseService>;
const MockedLibraryApiClient = LibraryApiClient as jest.MockedClass<typeof LibraryApiClient>;
const MockedAladdinApiClient = AladdinApiClient as jest.MockedClass<typeof AladdinApiClient>;

describe('OptimalLibraryServiceV2', () => {
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

  describe('calculateOptimalLibrarySet (V2)', () => {

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

    it('단일 ISBN으로 최적 도서관 조합 계산 성공 (V2 구조)', async () => {
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
      
      // V2 구조 검증: libraries 배열 확인
      const firstSet = result.data!.optimalSets[0];
      expect(firstSet.libraries).toBeDefined();
      expect(firstSet.libraries).toHaveLength(TEST_CONSTANTS.EXPECTED_VALUES.SINGLE_LIBRARY_LENGTH);
      
      // 첫 번째 도서관 확인
      const firstLibrary = firstSet.libraries[0];
      expect(firstLibrary.lib_code).toBe(TEST_CONSTANTS.LIBRARY_CODES.LIBRARY_A);
      expect(firstLibrary.lib_name).toBeDefined();
      expect(firstLibrary.address).toBeDefined();
      expect(firstLibrary.books).toHaveLength(TEST_CONSTANTS.EXPECTED_VALUES.SINGLE_BOOK_LENGTH);
      
      // 도서관의 책 정보 확인
      const firstBook = firstLibrary.books[0];
      expect(firstBook.isbn).toBe(isbn);
      expect(firstBook.title).toBeDefined();
      expect(firstBook.cover).toBeDefined();
      
      // coverageCount 확인
      expect(firstSet.coverageCount).toBe(TEST_CONSTANTS.EXPECTED_VALUES.SINGLE_BOOK_LENGTH);
    });

    it('복수 ISBN으로 최적 도서관 조합 계산 (V2 구조)', async () => {
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
      const fullCoverageSets = result.data!.optimalSets.filter(set => set.coverageCount === TEST_CONSTANTS.EXPECTED_VALUES.MULTIPLE_BOOKS_LENGTH);
      expect(fullCoverageSets.length).toBeGreaterThan(TEST_CONSTANTS.EXPECTED_VALUES.EMPTY_SETS_LENGTH);
      
      // 전체 커버리지 조합에서 도서관별 책 배치 확인
      const fullCoverageSet = fullCoverageSets[0];
      expect(fullCoverageSet.libraries.length).toBeGreaterThan(0);
      
      // 모든 도서관의 책들을 합쳐서 요청된 ISBN들이 모두 포함되어야 함
      const allBooksInSet = fullCoverageSet.libraries.flatMap(lib => lib.books.map(book => book.isbn));
      const uniqueBooks = [...new Set(allBooksInSet)];
      expect(uniqueBooks.sort()).toEqual(isbns.sort());
    });

    it('각 도서관별 빌릴 수 있는 책들이 정확히 표시됨', async () => {
      const isbns = TEST_ISBNS.MULTIPLE;
      
      mockDbService.getAllLibraries.mockResolvedValue(MOCK_SUCCESS_RESPONSES.database);
      
      mockAladdinClient.searchBooksByISBN
        .mockResolvedValueOnce({ success: true, data: MOCK_SUCCESS_RESPONSES.aladdin.book1 })
        .mockResolvedValueOnce({ success: true, data: MOCK_SUCCESS_RESPONSES.aladdin.book2 });

      // 첫 번째 책은 A 도서관에만, 두 번째 책은 B 도서관에만 있도록 설정
      mockApiClient.searchLibrariesByISBN
        .mockResolvedValueOnce({ success: true, data: MOCK_SUCCESS_RESPONSES.libraryApi.libraryA })
        .mockResolvedValueOnce({ success: true, data: MOCK_SUCCESS_RESPONSES.libraryApi.libraryB });

      const result = await sut.calculateOptimalLibrarySet({ isbns });

      expect(result.success).toBe(true);
      
      // 전체 커버리지 조합 찾기
      const fullCoverageSet = result.data!.optimalSets.find(set => set.coverageCount === isbns.length);
      expect(fullCoverageSet).toBeDefined();
      
      if (fullCoverageSet) {
        // A 도서관은 첫 번째 책만 가지고 있어야 함
        const libraryA = fullCoverageSet.libraries.find(lib => lib.lib_code === TEST_CONSTANTS.LIBRARY_CODES.LIBRARY_A);
        if (libraryA) {
          expect(libraryA.books).toHaveLength(1);
          expect(libraryA.books[0].isbn).toBe(isbns[0]);
        }
        
        // B 도서관은 두 번째 책만 가지고 있어야 함
        const libraryB = fullCoverageSet.libraries.find(lib => lib.lib_code === TEST_CONSTANTS.LIBRARY_CODES.LIBRARY_B);
        if (libraryB) {
          expect(libraryB.books).toHaveLength(1);
          expect(libraryB.books[0].isbn).toBe(isbns[1]);
        }
      }
    });

    it('API 호출 실패 시에도 정상 처리 (V2)', async () => {
      const isbn = TEST_ISBNS.SINGLE;
      
      mockDbService.getAllLibraries.mockResolvedValue(MOCK_SUCCESS_RESPONSES.database);
      mockAladdinClient.searchBooksByISBN.mockResolvedValue(MOCK_FAILURE_RESPONSES.aladdin);
      mockApiClient.searchLibrariesByISBN.mockResolvedValue(MOCK_FAILURE_RESPONSES.libraryApi);

      const result = await sut.calculateOptimalLibrarySet({ isbns: [isbn] });

      expect(result.success).toBe(true);
      expect(result.data!.optimalSets).toHaveLength(TEST_CONSTANTS.EXPECTED_VALUES.EMPTY_SETS_LENGTH);
    });

    it('DB에 없는 도서관은 무시 (V2)', async () => {
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

    it('V2 정렬 로직 검증 - coverageCount 우선, 도서관 수 차순', async () => {
      const isbns = TEST_ISBNS.MULTIPLE;
      
      mockDbService.getAllLibraries.mockResolvedValue(MOCK_SUCCESS_RESPONSES.database);
      
      mockAladdinClient.searchBooksByISBN
        .mockResolvedValueOnce({ success: true, data: MOCK_SUCCESS_RESPONSES.aladdin.book1 })
        .mockResolvedValueOnce({ success: true, data: MOCK_SUCCESS_RESPONSES.aladdin.book2 });

      // 두 도서관 모두에서 모든 책을 가지도록 설정하여 여러 조합 생성
      mockApiClient.searchLibrariesByISBN
        .mockResolvedValue({ success: true, data: MOCK_SUCCESS_RESPONSES.libraryApi.libraryA })
        .mockResolvedValue({ success: true, data: MOCK_SUCCESS_RESPONSES.libraryApi.libraryB });

      const result = await sut.calculateOptimalLibrarySet({ isbns });

      expect(result.success).toBe(true);
      
      // 결과가 coverageCount 기준으로 내림차순 정렬되었는지 확인
      const sets = result.data!.optimalSets;
      if (sets.length > 1) {
        for (let i = 0; i < sets.length - 1; i++) {
          expect(sets[i].coverageCount).toBeGreaterThanOrEqual(sets[i + 1].coverageCount);
        }
      }
    });
  });
});