import { AladdinApiClient } from './AladdinApiClient';
import { ServiceResult, AladdinSearchResponse, PaginationMeta } from '@/types';

export interface BookSearchOptions {
  page?: number;
  limit?: number;
}

export interface BookSearchResult {
  books: any[];
  pagination: PaginationMeta;
}

export class BookSearchService {
  private aladdinClient: AladdinApiClient;

  constructor() {
    this.aladdinClient = new AladdinApiClient();
  }

  async searchByTitle(title: string, options: BookSearchOptions = {}): Promise<ServiceResult<BookSearchResult>> {
    const { page = 1, limit = 10 } = options;

    if (page < 1) {
      return {
        success: false,
        error: 'Page must be a positive integer'
      };
    }

    if (limit < 1 || limit > 50) {
      return {
        success: false,
        error: 'Limit must be between 1 and 50'
      };
    }

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
}