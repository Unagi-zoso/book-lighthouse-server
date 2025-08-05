// HTTP Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: PaginationMeta;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Error Types
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Service Types
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Aladdin API Types
export interface AladdinSearchParams {
  TTBKey: string;
  Query: string;
  QueryType?: 'Keyword' | 'Title' | 'Author' | 'Publisher';
  SearchTarget?: 'Book' | 'Foreign' | 'Music' | 'DVD' | 'Used' | 'eBook' | 'All';
  Start?: number;
  MaxResults?: number;
  Sort?: 'Accuracy' | 'PublishTime' | 'Title' | 'SalesPoint' | 'CustomerRating' | 'MyReviewCount';
  Cover?: 'Big' | 'MidBig' | 'Mid' | 'Small' | 'Mini' | 'None';
  CategoryId?: number;
  Version?: string;
  output?: 'xml' | 'js';
  OptResult?: string;
}

export interface AladdinBookItem {
  title: string;
  link: string;
  author: string;
  pubDate: string;
  description: string;
  isbn: string;
  isbn13: string;
  priceSales: number;
  priceStandard: number;
  mallType: string;
  stockStatus: string;
  mileage: number;
  cover: string;
  categoryId: number;
  categoryName: string;
  publisher: string;
  salesPoint: number;
  adult: boolean;
  fixedPrice: boolean;
  customerReviewRank: number;
  bestDuration?: string;
  bestRank?: number;
  seriesInfo?: {
    seriesId: number;
    seriesLink: string;
    seriesName: string;
  };
  subInfo?: {
    subTitle?: string;
    originalTitle?: string;
    itemPage?: number;
    weight?: number;
    sizeDepth?: number;
    sizeHeight?: number;
    sizeWidth?: number;
  };
}

export interface AladdinSearchResponse {
  version: number;
  title: string;
  link: string;
  pubDate: string;
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  query: string;
  searchCategoryId?: number;
  searchCategoryName?: string;
  item: AladdinBookItem[];
}
