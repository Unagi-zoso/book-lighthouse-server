import { NLApiClient } from './nlApiClient';
import { BookApiAdapter } from './bookApiAdapter';
import { ServiceResult, PaginationMeta, BookItem } from '@/types';
import { BOOK_SEARCH_CONSTANTS } from '@/constants/bookSearch';

export interface BookSearchOptions {
  page?: number;
  limit?: number;
}

export interface BookSearchResult {
  books: BookItem[];
  pagination: PaginationMeta;
}

export class BookSearchService {
  private nlClient: NLApiClient;

  constructor() {
    this.nlClient = new NLApiClient();
  }

  async searchByTitle(title: string, options: BookSearchOptions = {}): Promise<ServiceResult<BookSearchResult>> {
    // 입력값 검증 (정규화 전)
    const validationError = this.validatePaginationParams(options.page, options.limit);
    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    // 입력값 정규화 및 기본값 설정
    const page = this.normalizePage(options.page);
    const limit = this.normalizeLimit(options.limit);

    // 서지정보 검색으로 직접 검색 (항상 1페이지, 15개)
    const bibliographicResult = await this.nlClient.searchBibliographic(title, {
      page_no: '1',
      page_size: '15'
    });

    if (!bibliographicResult.success) {
      return {
        success: false,
        error: bibliographicResult.error || 'Failed to search books'
      };
    }

    const { data } = bibliographicResult;
    if (!data || !data.docs) {
      return {
        success: false,
        error: 'No data received from search API'
      };
    }

    // 서지정보를 직접 책 정보로 변환하고 ISBN13이 있는 것만 필터링
    const allConvertedBooks = data.docs
      .map(doc => BookApiAdapter.convertBibliographicToBook(doc))
      .filter(book => book.isbn13 && book.isbn13.length >= 13);
    
    // 요청된 페이지와 limit에 따라 결과 추출
    const startIndex = (page - 1) * limit;
    const convertedBooks = allConvertedBooks.slice(startIndex, startIndex + limit);
    
    // 전체 결과와 페이징 정보 계산
    const totalResults = allConvertedBooks.length;
    const totalPages = Math.ceil(totalResults / limit);
    
    const pagination: PaginationMeta = {
      page,
      limit,
      total: totalResults,
      totalPages
    };

    const searchResult: BookSearchResult = {
      books: convertedBooks,
      pagination
    };

    return {
      success: true,
      data: searchResult
    };
  }

  /**
   * 페이지 값 정규화
   * 참고: 최솟값/최댓값 검증은 validatePaginationParams에서 처리
   */
  private normalizePage(page?: number): number {
    if (page === undefined || page === null || isNaN(page)) {
      return BOOK_SEARCH_CONSTANTS.DEFAULT_PAGE;
    }
    return Math.floor(page);
  }

  /**
   * 제한값 정규화 및 자동 조정
   */
  private normalizeLimit(limit?: number): number {
    if (limit === undefined || limit === null || isNaN(limit)) {
      return BOOK_SEARCH_CONSTANTS.DEFAULT_LIMIT;
    }
    
    const normalizedLimit = Math.floor(limit);
    
    // 최소값보다 작으면 최소값으로 조정
    if (normalizedLimit < BOOK_SEARCH_CONSTANTS.MIN_LIMIT) {
      return BOOK_SEARCH_CONSTANTS.MIN_LIMIT;
    }
    
    // 최대값보다 크면 최대값으로 조정
    if (normalizedLimit > BOOK_SEARCH_CONSTANTS.MAX_LIMIT) {
      return BOOK_SEARCH_CONSTANTS.MAX_LIMIT;
    }
    
    return normalizedLimit;
  }

  /**
   * 페이징 파라미터 검증 (page만 검증, limit은 자동 조정)
   */
  private validatePaginationParams(page?: number, limit?: number): string | null {
    // page 검증만 수행 (limit은 자동 조정되므로 검증하지 않음)
    if (page !== undefined) {
      if (isNaN(page) || page < BOOK_SEARCH_CONSTANTS.MIN_PAGE) {
        return 'Page must be a positive integer';
      }
    }

    return null;
  }
}