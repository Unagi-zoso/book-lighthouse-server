import dotenv from 'dotenv';
import { ExternalApiService, ApiServiceConfig } from '@/services/externalApi';
import { 
  ServiceResult, 
  LibrarySearchRequest,
  LibrarySearchParams, 
  LibrarySearchResponse 
} from '@/types';

dotenv.config();

export class LibraryApiClient {
  private readonly apiService: ExternalApiService;
  private readonly authKey: string;
  private readonly DEFAULT_REGION = 11; // 서울특별시

  constructor() {
    const config: ApiServiceConfig = {
      baseURL: process.env.LIBRARY_API_BASE_URL || 'http://data4library.kr/api',
      timeout: 15000,
      retries: 3,
    };

    this.apiService = new ExternalApiService(config);

    if (!process.env.LIBRARY_API_KEY) {
      throw new Error('LIBRARY_API_KEY is required in environment variables');
    }
    this.authKey = process.env.LIBRARY_API_KEY;
  }

  async searchLibrariesByBook(params: LibrarySearchRequest): Promise<ServiceResult<LibrarySearchResponse>> {
    const searchParams: LibrarySearchParams = {
      authKey: this.authKey,
      format: 'json',
      pageNo: 1,
      pageSize: 10,
      region: this.DEFAULT_REGION,
      ...params,
    };

    const queryString = this.buildQueryString(searchParams);
    const endpoint = `/libSrchByBook?${queryString}`;

    return this.apiService.get<LibrarySearchResponse>(endpoint);
  }

  async searchLibrariesByISBN(isbn: string, options?: Omit<LibrarySearchRequest, 'isbn'>): Promise<ServiceResult<LibrarySearchResponse>> {
    return this.searchLibrariesByBook({ isbn, ...options });
  }

  private buildQueryString(params: LibrarySearchParams): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return searchParams.toString();
  }
}