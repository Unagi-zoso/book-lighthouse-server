import { ExternalApiService, ApiServiceConfig } from '@/services/externalApi';
import { 
  ServiceResult, 
  AladdinSearchParams, 
  AladdinSearchResponse 
} from '@/types';
import { loggingService } from './loggingService';

export class AladdinApiClient {
  private readonly apiService: ExternalApiService;
  private readonly ttbKey: string;
  private readonly version: string = '20131101';

  constructor() {
    const config: ApiServiceConfig = {
      baseURL: process.env.ALADDIN_API_BASE_URL || 'http://www.aladin.co.kr/ttb/api',
      timeout: 15000,
      retries: 3,
    };

    this.apiService = new ExternalApiService(config);
    
    if (!process.env.ALADDIN_API_KEY) {
      throw new Error('ALADDIN_API_KEY is required in environment variables');
    }
    this.ttbKey = process.env.ALADDIN_API_KEY;
  }

  async searchBooks(params: Omit<AladdinSearchParams, 'TTBKey' | 'Version'>): Promise<ServiceResult<AladdinSearchResponse>> {
    const startTime = Date.now();
    
    const searchParams: AladdinSearchParams = {
      TTBKey: this.ttbKey,
      Version: this.version,
      output: 'js',
      SearchTarget: 'Book',
      QueryType: 'Keyword',
      Start: 1,
      MaxResults: 10,
      Cover: 'Mid',
      Sort: 'Accuracy',
      ...params,
    };

    const queryString = this.buildQueryString(searchParams);
    const endpoint = `/ItemSearch.aspx?${queryString}`;

    try {
      const result = await this.apiService.get<AladdinSearchResponse>(endpoint);
      const duration = Date.now() - startTime;

      // 외부 API 호출 로깅
      await loggingService.logExternalApiCall(
        'Aladdin',
        endpoint,
        result.success,
        duration,
        {
          query: searchParams.Query,
          query_type: searchParams.QueryType,
          max_results: searchParams.MaxResults,
          results_count: result.success ? result.data?.totalResults || 0 : 0
        }
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // 에러 로깅
      await loggingService.logExternalApiCall(
        'Aladdin',
        endpoint,
        false,
        duration,
        {
          query: searchParams.Query,
          query_type: searchParams.QueryType,
          error: (error as Error).message
        }
      );

      throw error;
    }
  }

  async searchBooksByTitle(title: string, options?: Partial<AladdinSearchParams>): Promise<ServiceResult<AladdinSearchResponse>> {
    return this.searchBooks({
      Query: title,
      QueryType: 'Title',
      ...options,
    });
  }

  async searchBooksByISBN(isbn: string, options?: Partial<AladdinSearchParams>): Promise<ServiceResult<AladdinSearchResponse>> {
    return this.searchBooks({
      Query: isbn,
      QueryType: 'Keyword',
      MaxResults: 1, // ISBN은 고유하므로 1개만 검색
      ...options,
    });
  }

  private buildQueryString(params: AladdinSearchParams): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return searchParams.toString();
  }
}

