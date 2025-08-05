import { AladdinApiClient } from './AladdinApiClient';
import { ServiceResult, PaginationMeta, AladdinBookItem } from '@/types';
import { BOOK_SEARCH_CONSTANTS } from '@/constants/bookSearch';

export interface BookSearchOptions {
  page?: number;
  limit?: number;
}

export interface BookSearchResult {
  books: AladdinBookItem[];
  pagination: PaginationMeta;
}

export class BookSearchService {
  private aladdinClient: AladdinApiClient;

  constructor() {
    this.aladdinClient = new AladdinApiClient();
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

    const start = (page - 1) * limit + 1;

    const result = await this.aladdinClient.searchBooksByTitle(title, {
      Start: start,
      MaxResults: limit
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to search books'
      };
    }

    const { data } = result;
    if (!data) {
      return {
        success: false,
        error: 'No data received from search API'
      };
    }

    const totalPages = Math.ceil(data.totalResults / limit);
    
    const pagination: PaginationMeta = {
      page,
      limit,
      total: data.totalResults,
      totalPages
    };

    const searchResult: BookSearchResult = {
      books: data.item,
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
   * 제한값 정규화
   * 참고: 최솟값/최댓값 검증은 validatePaginationParams에서 처리
   */
  private normalizeLimit(limit?: number): number {
    if (limit === undefined || limit === null || isNaN(limit)) {
      return BOOK_SEARCH_CONSTANTS.DEFAULT_LIMIT;
    }
    return Math.floor(limit);
  }

  /**
   * 페이징 파라미터 검증 (정규화 전 원시 값 검증)
   */
  private validatePaginationParams(page?: number, limit?: number): string | null {
    // page 검증
    if (page !== undefined) {
      if (isNaN(page) || page < BOOK_SEARCH_CONSTANTS.MIN_PAGE) {
        return 'Page must be a positive integer';
      }
    }

    // limit 검증
    if (limit !== undefined) {
      if (isNaN(limit) || limit < BOOK_SEARCH_CONSTANTS.MIN_LIMIT || limit > BOOK_SEARCH_CONSTANTS.MAX_LIMIT) {
        return `Limit must be between ${BOOK_SEARCH_CONSTANTS.MIN_LIMIT} and ${BOOK_SEARCH_CONSTANTS.MAX_LIMIT}`;
      }
    }

    return null;
  }
}