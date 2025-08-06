import { LibraryDatabaseRecord } from '@/services/libraryDatabaseService';
import { OptimalLibraryResponse } from '@/services/optimalLibraryService';

export const createLibraryRecord = (overrides: Partial<LibraryDatabaseRecord> = {}): LibraryDatabaseRecord => ({
  lib_code: 111001,
  lib_name: '테스트 도서관',
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

export const createOptimalLibraryResponse = (overrides: Partial<{
  libraryCount: number;
  bookCount: number;
  coverageRate: number;
  isbns: string[];
}> = {}): OptimalLibraryResponse => {
  const defaults = {
    libraryCount: 1,
    bookCount: 2,
    coverageRate: 100.0,
    isbns: ['9788936433529', '9788937460777']
  };
  
  const merged = { ...defaults, ...overrides };
  
  const libraries = Array.from({ length: merged.libraryCount }, (_, index) =>
    createLibraryRecord({
      lib_code: 111001 + index,
      lib_name: `테스트 도서관 ${String.fromCharCode(65 + index)}` // A, B, C...
    })
  );
  
  const books = merged.isbns.slice(0, merged.bookCount).map(isbn => ({
    isbn,
    title: `Book ${isbn}`,
    cover: `https://example.com/cover/${isbn}.jpg`,
    libraries: libraries.map(lib => ({
      lib_code: lib.lib_code,
      lib_name: lib.lib_name,
      address: lib.address
    }))
  }));
  
  return {
    optimalSets: [
      {
        books,
        coverageRate: merged.coverageRate
      }
    ]
  };
};

export const createExpectedApiResponse = (data: any) => ({
  success: true,
  data
});

export const createExpectedErrorResponse = (message: string) => ({
  success: false,
  message
});

export const LIBRARY_DEFAULTS = {
  VALID_ISBNS: ['9788936433529', '9788937460777'],
  SINGLE_ISBN: ['9788936433529'],
  INVALID_ISBN: 'invalid-isbn!@#',
  VALID_ISBN_FORMATS: [
    '9788936433529',    // 13자리 숫자
    '978-89-364-3352-9', // 하이픈 포함
    '123456789X'        // X 포함
  ]
};