import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ServiceResult } from '@/types';

export interface ApiServiceConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class ExternalApiService {
  private readonly client: AxiosInstance;
  private readonly retries: number;
  private readonly retryDelay: number;

  constructor(config: ApiServiceConfig) {
    this.retries = config.retries || 3;
    this.retryDelay = config.retryDelay || 1000;

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Bookshore-API/1.0',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      config => {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      error => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      response => {
        console.log(`[API] Response: ${response.status} - ${response.config.url}`);
        return response;
      },
      error => {
        console.error(`[API] Error: ${error.response?.status} - ${error.config?.url}`);
        return Promise.reject(error);
      }
    );
  }

  private async makeRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    attempt: number = 1
  ): Promise<ServiceResult<T>> {
    try {
      const response = await requestFn();
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      // Retry logic for network errors
      if (attempt < this.retries && this.shouldRetry(error)) {
        console.log(`[API] Retrying request (${attempt}/${this.retries})...`);
        await this.delay(this.retryDelay * attempt);
        return this.makeRequest(requestFn, attempt + 1);
      }

      const errorMessage = this.extractErrorMessage(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors or 5xx server errors
    return (
      !error.response ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ENOTFOUND' ||
      (error.response?.status >= 500 && error.response?.status < 600)
    );
  }

  private extractErrorMessage(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.message) {
      return error.message;
    }
    return 'Unknown API error occurred';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ServiceResult<T>> {
    return this.makeRequest(() => this.client.get<T>(endpoint, config));
  }

  async post<T>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ServiceResult<T>> {
    return this.makeRequest(() => this.client.post<T>(endpoint, data, config));
  }

  async put<T>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ServiceResult<T>> {
    return this.makeRequest(() => this.client.put<T>(endpoint, data, config));
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ServiceResult<T>> {
    return this.makeRequest(() => this.client.patch<T>(endpoint, data, config));
  }

  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ServiceResult<T>> {
    return this.makeRequest(() => this.client.delete<T>(endpoint, config));
  }
}
