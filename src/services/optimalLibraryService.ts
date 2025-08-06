import { ServiceResult } from '@/types';
import { LibraryDatabaseService, LibraryDatabaseRecord } from './libraryDatabaseService';
import { LibraryApiClient } from './libraryApiClient';
import { AladdinApiClient } from './AladdinApiClient';

export interface OptimalLibraryRequest {
  isbns: string[]; // 1-3개의 ISBN
}

export interface BookWithLibraries {
  isbn: string;
  title: string;
  cover: string;
  libraries: {
    lib_code: number;
    lib_name: string;
    address: string | null;
  }[];
}

export interface OptimalLibrarySet {
  books: BookWithLibraries[];
  coverageRate: number; // 요청한 책 중 몇 %를 커버하는지
}

export interface OptimalLibraryResponse {
  optimalSets: OptimalLibrarySet[]; // 최대 5개
}

export class OptimalLibraryService {
  private readonly libraryDbService: LibraryDatabaseService;
  private readonly libraryApiClient: LibraryApiClient;
  private readonly aladdinApiClient: AladdinApiClient;

  constructor() {
    this.libraryDbService = new LibraryDatabaseService();
    this.libraryApiClient = new LibraryApiClient();
    this.aladdinApiClient = new AladdinApiClient();
  }

  async calculateOptimalLibrarySet(request: OptimalLibraryRequest): Promise<ServiceResult<OptimalLibraryResponse>> {
    try {
      // 1. 입력 검증
      if (!request.isbns || request.isbns.length < 1 || request.isbns.length > 3) {
        return {
          success: false,
          error: 'ISBN list must contain 1-3 items'
        };
      }

      // 2. DB에서 모든 도서관 가져오기
      const librariesResult = await this.libraryDbService.getAllLibraries();
      if (!librariesResult.success || !librariesResult.data) {
        return {
          success: false,
          error: 'Failed to fetch libraries from database'
        };
      }

      // 3. 알라딘 API에서 책 정보 가져오기 (병렬 처리)
      const bookInfoMap = new Map<string, { title: string; cover: string }>(); // ISBN -> {title, cover}
      
      // Promise.allSettled 사용 이유:
      // - Promise.all은 하나라도 실패하면 전체 실패 (fail-fast)
      // - Promise.allSettled는 모든 Promise를 기다림 (일부 실패해도 진행)
      // - 외부 API 호출에서는 일부 책 정보를 못 가져와도 나머지는 처리해야 함
      const aladdinPromises = request.isbns.map(isbn => this.aladdinApiClient.searchBooksByISBN(isbn));
      const aladdinResults = await Promise.allSettled(aladdinPromises);
      
      for (let i = 0; i < request.isbns.length; i++) {
        const isbn = request.isbns[i];
        const result = aladdinResults[i];
        
        if (result.status === 'fulfilled' && result.value.success && 
            result.value.data?.item && result.value.data.item.length > 0) {
          // API 호출 성공 + 데이터 존재 시 책 정보 저장
          const book = result.value.data.item[0];
          bookInfoMap.set(isbn, {
            title: book.title,
            cover: book.cover
          });
        } else {
          // API 호출 실패 또는 데이터 없음 시 기본값 사용
          // 이렇게 하면 일부 책만 실패해도 전체 프로세스는 계속됨
          bookInfoMap.set(isbn, {
            title: `Book ${isbn}`,
            cover: ''
          });
        }
      }

      // 4. 각 ISBN에 대해 소장 도서관 조회 (병렬 처리)
      const libraryBookMap = new Map<number, string[]>(); // lib_code -> ISBN[]
      
      // 도서관정보나루 API 병렬 호출 (성능 최적화)
      // 여러 ISBN을 순차적으로 호출하면 시간이 오래 걸리므로 병렬 처리
      const libraryPromises = request.isbns.map(isbn => 
        this.libraryApiClient.searchLibrariesByISBN(isbn)
      );
      const libraryResults = await Promise.allSettled(libraryPromises);
      
      for (let i = 0; i < request.isbns.length; i++) {
        const isbn = request.isbns[i];
        const result = libraryResults[i];
        
        if (result.status === 'fulfilled' && result.value.success && 
            result.value.data?.response?.libs) {
          // 해당 ISBN을 소장한 도서관들 처리
          for (const libWrapper of result.value.data.response.libs) {
            const libCode = parseInt(libWrapper.lib.libCode, 10);
            
            // DB에 존재하는 도서관만 처리 (데이터 정합성 보장)
            // API에서 반환된 도서관이 우리 DB에 없을 수도 있음
            const dbLibrary = librariesResult.data.find(lib => lib.lib_code === libCode);
            if (dbLibrary) {
              if (!libraryBookMap.has(libCode)) {
                libraryBookMap.set(libCode, []);
              }
              libraryBookMap.get(libCode)!.push(isbn);
            }
          }
        }
        // 실패한 경우는 해당 ISBN의 도서관 정보가 없는 것으로 처리
        // 전체 프로세스는 계속 진행됨
      }

      // 5. Set Cover 알고리즘 적용
      const optimalSets = this.findOptimalLibrarySets(
        request.isbns,
        librariesResult.data,
        libraryBookMap,
        bookInfoMap
      );

      return {
        success: true,
        data: {
          optimalSets
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private findOptimalLibrarySets(
    requestedBooks: string[],
    allLibraries: LibraryDatabaseRecord[],
    libraryBookMap: Map<number, string[]>,
    bookInfoMap: Map<string, { title: string; cover: string }>
  ): OptimalLibrarySet[] {
    // 책을 보유한 도서관들만 필터링
    const validLibraries = allLibraries.filter(lib => libraryBookMap.has(lib.lib_code));
    
    const allSolutions: OptimalLibrarySet[] = [];
    
    // 1~5개 도서관 조합을 모두 시도
    for (let size = 1; size <= Math.min(5, validLibraries.length); size++) {
      const combinations = this.getCombinations(validLibraries, size);
      
      for (const combination of combinations) {
        const solution = this.calculateCombinationCoverage(
          combination,
          requestedBooks,
          libraryBookMap,
          bookInfoMap
        );
        
        if (solution) {
          allSolutions.push(solution);
        }
      }
    }
    
    // 커버리지 기준으로 정렬 (높은 커버리지 우선, 같으면 적은 도서관 수 우선)
    return allSolutions
      .sort((a, b) => {
        if (b.coverageRate !== a.coverageRate) {
          return b.coverageRate - a.coverageRate;
        }
        // 도서관 수 계산: 각 책의 도서관들을 모두 합친 유니크한 도서관 수
        const aLibraryCount = new Set(a.books.flatMap(book => book.libraries.map(lib => lib.lib_code))).size;
        const bLibraryCount = new Set(b.books.flatMap(book => book.libraries.map(lib => lib.lib_code))).size;
        return aLibraryCount - bLibraryCount;
      })
      .slice(0, 5);
  }

  private getCombinations<T>(arr: T[], size: number): T[][] {
    if (size === 1) {
      return arr.map(item => [item]);
    }
    
    const result: T[][] = [];
    for (let i = 0; i <= arr.length - size; i++) {
      const rest = this.getCombinations(arr.slice(i + 1), size - 1);
      for (const combination of rest) {
        result.push([arr[i], ...combination]);
      }
    }
    
    return result;
  }

  private calculateCombinationCoverage(
    libraries: LibraryDatabaseRecord[],
    requestedBooks: string[],
    libraryBookMap: Map<number, string[]>,
    bookInfoMap: Map<string, { title: string; cover: string }>
  ): OptimalLibrarySet | null {
    const coveredBooks = new Set<string>();
    
    // 이 조합이 커버하는 모든 책 수집
    for (const library of libraries) {
      const books = libraryBookMap.get(library.lib_code) || [];
      books.forEach(book => {
        if (requestedBooks.includes(book)) {
          coveredBooks.add(book);
        }
      });
    }
    
    if (coveredBooks.size === 0) {
      return null;
    }
    
    const coverageRate = (coveredBooks.size / requestedBooks.length) * 100;
    
    // 각 책마다 해당 책을 소장한 도서관들 정보 생성
    const booksWithLibraries: BookWithLibraries[] = Array.from(coveredBooks).map(isbn => {
      const bookLibraries = libraries
        .filter(library => {
          const libraryBooks = libraryBookMap.get(library.lib_code) || [];
          return libraryBooks.includes(isbn);
        })
        .map(library => ({
          lib_code: library.lib_code,
          lib_name: library.lib_name,
          address: library.address
        }));
      
      const bookInfo = bookInfoMap.get(isbn) || { title: `Book ${isbn}`, cover: '' };
      return {
        isbn,
        title: bookInfo.title,
        cover: bookInfo.cover,
        libraries: bookLibraries
      };
    });
    
    return {
      books: booksWithLibraries,
      coverageRate: Math.round(coverageRate * 100) / 100
    };
  }
}