import { LibraryDatabaseRecord } from '@/services/libraryDatabaseService';
import { AladdinSearchResponse, LibrarySearchResponse } from '@/types';

export const createMockLibrary = (overrides: Partial<LibraryDatabaseRecord> = {}): LibraryDatabaseRecord => ({
  lib_code: 111001,
  lib_name: '테스트 도서관 A',
  address: '서울시 강남구',
  website: null,
  detailed_address: null,
  latitude: '37.1234',
  longitude: '127.1234',
  operating_hours: '09:00-18:00',
  closed_days: '월요일',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  ...overrides
});

export const TEST_CONSTANTS = {
  LIBRARY_CODES: {
    LIBRARY_A: 111001,
    LIBRARY_B: 111002,
    NON_EXISTENT: 999999
  },
  EXPECTED_VALUES: {
    FULL_COVERAGE_RATE: 100,
    EMPTY_SETS_LENGTH: 0,
    SINGLE_SET_LENGTH: 1,
    SINGLE_BOOK_LENGTH: 1,
    MULTIPLE_BOOKS_LENGTH: 2,
    SINGLE_LIBRARY_LENGTH: 1
  }
};

export const MOCK_LIBRARIES = [
  createMockLibrary({
    lib_code: TEST_CONSTANTS.LIBRARY_CODES.LIBRARY_A,
    lib_name: '테스트 도서관 A',
    address: '서울시 강남구'
  }),
  createMockLibrary({
    lib_code: TEST_CONSTANTS.LIBRARY_CODES.LIBRARY_B,
    lib_name: '테스트 도서관 B',
    address: '서울시 서초구',
    latitude: '37.5678',
    longitude: '127.5678',
    operating_hours: '10:00-19:00',
    closed_days: '화요일'
  })
];

export const createMockAladdinResponse = (isbn: string, title: string, cover: string): AladdinSearchResponse => ({
  item: [{
    title,
    cover,
    author: 'Test Author',
    pubDate: '2023-01-01',
    description: 'Test Description',
    isbn,
    isbn13: isbn,
    priceSales: 15000,
    priceStandard: 18000,
    mallType: 'BOOK',
    stockStatus: 'NEW',
    mileage: 150,
    categoryId: 1,
    categoryName: 'Test Category',
    publisher: 'Test Publisher',
    salesPoint: 100,
    adult: false,
    fixedPrice: false,
    customerReviewRank: 5,
    link: 'https://example.com/book'
  }],
  totalResults: 1,
  startIndex: 1,
  itemsPerPage: 1,
  query: isbn,
  version: 1,
  title: 'Test Search',
  link: 'https://example.com',
  pubDate: '2023-01-01'
});

export const createMockLibrarySearchResponse = (libCode: string, libName: string, address: string): LibrarySearchResponse => ({
  response: {
    pageNo: 1,
    pageSize: 10,
    numFound: 1,
    resultNum: 1,
    libs: [{
      lib: {
        libCode,
        libName,
        address,
        tel: '02-1234-5678',
        fax: '02-1234-5679',
        latitude: '37.1234',
        longitude: '127.1234',
        homepage: 'http://test.com',
        closed: '월요일',
        operatingTime: '09:00-18:00'
      }
    }]
  }
});

export const MOCK_SUCCESS_RESPONSES = {
  database: {
    success: true,
    data: MOCK_LIBRARIES
  },
  aladdin: {
    singleBook: createMockAladdinResponse('9788936433529', 'Test Book Title', 'https://example.com/cover.jpg'),
    book1: createMockAladdinResponse('9788936433529', 'Book 1', 'https://example.com/1.jpg'),
    book2: createMockAladdinResponse('9788937460777', 'Book 2', 'https://example.com/2.jpg'),
    testBook: createMockAladdinResponse('9788936433529', 'Test Book', 'https://example.com/cover.jpg')
  },
  libraryApi: {
    libraryA: createMockLibrarySearchResponse(TEST_CONSTANTS.LIBRARY_CODES.LIBRARY_A.toString(), '테스트 도서관 A', '서울시 강남구'),
    libraryB: createMockLibrarySearchResponse(TEST_CONSTANTS.LIBRARY_CODES.LIBRARY_B.toString(), '테스트 도서관 B', '서울시 서초구'),
    nonExistentLibrary: createMockLibrarySearchResponse(TEST_CONSTANTS.LIBRARY_CODES.NON_EXISTENT.toString(), '존재하지 않는 도서관', '어딘가')
  }
};

export const MOCK_FAILURE_RESPONSES = {
  database: {
    success: false,
    error: 'Database connection failed'
  },
  aladdin: {
    success: false,
    error: 'Aladdin API failed'
  },
  libraryApi: {
    success: false,
    error: 'API call failed'
  }
};

export const TEST_ISBNS = {
  SINGLE: '9788936433529',
  MULTIPLE: ['9788936433529', '9788937460777'],
  EMPTY: [],
  TOO_MANY: ['isbn1', 'isbn2', 'isbn3', 'isbn4']
};