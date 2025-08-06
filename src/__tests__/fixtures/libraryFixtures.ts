import { LibrarySearchResponse, Library } from '@/types';

/**
 * 테스트용 도서관 정보 생성 헬퍼
 */
export const createLibrary = (overrides: Partial<Library> = {}): Library => ({
  libCode: 'LIB001',
  libName: '테스트 도서관',
  address: '서울특별시 강남구 테스트로 123',
  tel: '02-1234-5678',
  fax: '02-1234-5679',
  latitude: '37.5665',
  longitude: '126.9780',
  homepage: 'https://testlibrary.kr',
  closed: '매주 월요일',
  operatingTime: '09:00~18:00',
  ...overrides
});

/**
 * 테스트용 도서관 검색 응답 생성 헬퍼
 */
export const createLibrarySearchResponse = (overrides: Partial<{
  pageNo: number;
  pageSize: number;
  numFound: number;
  resultNum: number;
  libraryCount: number;
  libraries: Library[];
}> = {}): LibrarySearchResponse => {
  const defaultLibraryCount = 2;
  const defaults = {
    pageNo: 1,
    pageSize: 10,
    numFound: 25,
    resultNum: defaultLibraryCount,
    libraryCount: defaultLibraryCount,
    libraries: Array.from({ length: overrides.libraryCount || defaultLibraryCount }, (_, index) =>
      createLibrary({ 
        libCode: `LIB${String(index + 1).padStart(3, '0')}`, 
        libName: `테스트 도서관 ${index + 1}`,
        address: `서울특별시 강남구 테스트로 ${(index + 1) * 100}`
      })
    )
  };

  const merged = { ...defaults, ...overrides };
  
  // libraryCount가 변경되면 libraries도 다시 생성
  if (overrides.libraryCount && !overrides.libraries) {
    merged.libraries = Array.from({ length: merged.libraryCount }, (_, index) =>
      createLibrary({ 
        libCode: `LIB${String(index + 1).padStart(3, '0')}`, 
        libName: `테스트 도서관 ${index + 1}`,
        address: `서울특별시 강남구 테스트로 ${(index + 1) * 100}`
      })
    );
  }

  return {
    response: {
      pageNo: merged.pageNo,
      pageSize: merged.pageSize,
      numFound: merged.numFound,
      resultNum: merged.resultNum,
      libs: merged.libraries.map(library => ({ lib: library }))
    }
  };
};

/**
 * 기본 도서관 개수 상수
 */
export const DEFAULT_LIBRARY_COUNT = 2;