import { ExternalApiService, ApiServiceConfig } from '@/services/externalApi';
import { ServiceResult } from '@/types';
import { loggingService } from './loggingService';

export interface NLSearchParams {
  key: string;
  apiType?: 'xml' | 'json';
  srchTarget?: 'total';
  kwd?: string;
  pageSize?: number;
  pageNum?: number;
  sort?: string;
  category?: string;
  detailSearch?: boolean;
  f1?: 'title' | 'author' | 'publisher';
  v1?: string;
}

export interface NLBookItem {
  titleInfo: string;
  typeName: string;
  placeInfo: string;
  authorInfo: string;
  pubInfo: string;
  menuName: string;
  mediaName: string;
  manageName: string;
  pubYearInfo: string;
  controlNo: string;
  id: string;
  detailLink: string;
}

export interface NLSearchResponse {
  total: number;
  kwd: string;
  pageNum: number;
  pageSize: number;
  category: string;
  sort: string;
  result: NLBookItem[];
}

// 서지정보 API 타입
export interface NLBibliographicItem {
  TITLE: string;
  AUTHOR: string;
  PUBLISHER: string;
  PUBLISH_PREDATE: string;
  EA_ISBN: string; // 실제 응답에서는 EA_ISBN
  TITLE_URL: string; // 표지이미지 URL  
  CONTROL_NO: string;
  FORM: string;
  DDC: string;
  UPDATE_DATE: string;
  EA_ADD_CODE: string;
  PRE_PRICE: string;
  DEPOSIT_YN: string;
  BOOK_SIZE: string;
  EBOOK_YN: string;
  REAL_PRICE: string;
  FORM_DETAIL: string;
  INPUT_DATE: string;
  SET_EXPRESSION: string;
  VOL: string;
  CIP_YN: string;
  SUBJECT: string;
  BIB_YN: string;
  SET_ADD_CODE: string;
  PAGE: string;
  RELATED_ISBN: string;
  SERIES_TITLE: string;
  SERIES_NO: string;
}

export interface NLBibliographicResponse {
  TOTAL_COUNT: string;
  PAGE_NO: string;
  docs: NLBibliographicItem[];
}

export class NLApiClient {
  private readonly apiService: ExternalApiService;
  private readonly apiKey: string;

  constructor() {
    const config: ApiServiceConfig = {
      baseURL: 'https://www.nl.go.kr',
      timeout: 15000,
      retries: 3,
    };

    this.apiService = new ExternalApiService(config);
    
    if (!process.env.NL_API_KEY) {
      throw new Error('NL_API_KEY is required in environment variables');
    }
    this.apiKey = process.env.NL_API_KEY;
  }

  async searchBooks(params: Omit<NLSearchParams, 'key'>): Promise<ServiceResult<NLSearchResponse>> {
    const startTime = Date.now();
    
    const searchParams: NLSearchParams = {
      key: this.apiKey,
      apiType: 'json',
      srchTarget: 'total',
      pageSize: 10,
      pageNum: 1,
      category: '도서',
      ...params,
    };

    const queryString = this.buildQueryString(searchParams);
    const endpoint = `/NL/search/openApi/search.do?${queryString}`;

    try {
      const result = await this.apiService.get<NLSearchResponse>(endpoint);
      const duration = Date.now() - startTime;

      await loggingService.logExternalApiCall(
        'NationalLibrary',
        endpoint,
        result.success,
        duration,
        {
          query: searchParams.kwd || searchParams.v1,
          page_size: searchParams.pageSize,
          results_count: result.success ? (result.data?.result?.length || 0) : 0
        }
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      await loggingService.logExternalApiCall(
        'NationalLibrary',
        endpoint,
        false,
        duration,
        {
          query: searchParams.kwd || searchParams.v1,
          error: (error as Error).message
        }
      );

      throw error;
    }
  }

  async searchBooksByTitle(title: string, options?: Partial<NLSearchParams>): Promise<ServiceResult<NLSearchResponse>> {
    return this.searchBooks({
      detailSearch: true,
      f1: 'title',
      v1: title,
      ...options,
    });
  }

  async searchBibliographic(title: string, options?: { page_no?: string; page_size?: string }): Promise<ServiceResult<NLBibliographicResponse>> {
    const startTime = Date.now();
    
    const searchParams = new URLSearchParams({
      cert_key: this.apiKey,
      result_style: 'json',
      page_no: options?.page_no || '1',
      page_size: options?.page_size || '15',
      title: title,
      ebook_yn: 'N',
    });

    const endpoint = `/seoji/SearchApi.do?${searchParams.toString()}`;

    try {
      const result = await this.apiService.get<NLBibliographicResponse>(endpoint);
      const duration = Date.now() - startTime;

      await loggingService.logExternalApiCall(
        'NationalLibrary-Bibliography',
        endpoint,
        result.success,
        duration,
        {
          query: title,
          results_count: result.success ? (result.data?.docs?.length || 0) : 0
        }
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      await loggingService.logExternalApiCall(
        'NationalLibrary-Bibliography',
        endpoint,
        false,
        duration,
        {
          query: title,
          error: (error as Error).message
        }
      );

      throw error;
    }
  }

  async searchBibliographicByISBN(isbn: string, options?: { page_no?: string; page_size?: string }): Promise<ServiceResult<NLBibliographicResponse>> {
    const startTime = Date.now();
    
    const searchParams = new URLSearchParams({
      cert_key: this.apiKey,
      result_style: 'json',
      page_no: options?.page_no || '1',
      page_size: options?.page_size || '15',
      isbn: isbn,
      ebook_yn: 'N',
    });

    const endpoint = `/seoji/SearchApi.do?${searchParams.toString()}`;

    try {
      const result = await this.apiService.get<NLBibliographicResponse>(endpoint);
      const duration = Date.now() - startTime;

      await loggingService.logExternalApiCall(
        'NationalLibrary-Bibliography-ISBN',
        endpoint,
        result.success,
        duration,
        {
          query: isbn,
          results_count: result.success ? (result.data?.docs?.length || 0) : 0
        }
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      await loggingService.logExternalApiCall(
        'NationalLibrary-Bibliography-ISBN',
        endpoint,
        false,
        duration,
        {
          query: isbn,
          error: (error as Error).message
        }
      );

      throw error;
    }
  }

  private buildQueryString(params: NLSearchParams): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return searchParams.toString();
  }
}