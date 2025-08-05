import dotenv from 'dotenv';
import { ExternalApiService, ApiServiceConfig } from '@/services/externalApi';
import { 
  ServiceResult, 
  AladdinSearchParams, 
  AladdinSearchResponse 
} from '@/types';

dotenv.config();

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
    this.ttbKey = process.env.ALADDIN_API_KEY ?? 
      (() => { throw new Error('ALADDIN_API_KEY is required in environment variables'); })();
  }

  async searchBooks(params: Omit<AladdinSearchParams, 'TTBKey' | 'Version'>): Promise<ServiceResult<AladdinSearchResponse>> {
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

    return this.apiService.get<AladdinSearchResponse>(endpoint);
  }

  async searchBooksByTitle(title: string, options?: Partial<AladdinSearchParams>): Promise<ServiceResult<AladdinSearchResponse>> {
    return this.searchBooks({
      Query: title,
      QueryType: 'Title',
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

