import { AladdinSearchResponse, AladdinBookItem } from '@/types';
import { BookSearchResult } from '@/services/bookSearchService';
import { BOOK_SEARCH_CONSTANTS } from '@/constants/bookSearch';

/**
 * 테스트에서 사용하는 기본값 상수들
 */
export const DEFAULTS = {
  PAGE: BOOK_SEARCH_CONSTANTS.DEFAULT_PAGE,
  LIMIT: BOOK_SEARCH_CONSTANTS.DEFAULT_LIMIT,
  MIN_LIMIT: BOOK_SEARCH_CONSTANTS.MIN_LIMIT,
  TOTAL: 25,
  TOTAL_PAGES: 3,
  BOOKS_COUNT: 2,
  START_INDEX: 1,
  QUERY: 'test book'
} as const;

/**
 * 테스트용 책 아이템 생성 헬퍼
 */
export const createBookItem = (overrides: Partial<AladdinBookItem> = {}): AladdinBookItem => ({
  title: '테스트 책',
  link: 'http://example.com/book',
  author: '테스트 저자',
  pubDate: '2023-01-01',
  description: '테스트 설명',
  isbn: '1234567890',
  isbn13: '1234567890123',
  priceSales: 15000,
  priceStandard: 20000,
  mallType: 'BOOK',
  stockStatus: '재고있음',
  mileage: 150,
  cover: 'http://example.com/cover.jpg',
  categoryId: 123,
  categoryName: 'Fiction',
  publisher: '테스트 출판사',
  salesPoint: 100,
  adult: false,
  fixedPrice: true,
  customerReviewRank: 4,
  ...overrides
});

/**
 * 테스트용 알라딘 검색 응답 생성 헬퍼
 */
export const createAladdinSearchResponse = (overrides: Partial<{
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  query: string;
  books: AladdinBookItem[];
}> = {}): AladdinSearchResponse => {
  const defaults = {
    totalResults: DEFAULTS.TOTAL,
    startIndex: DEFAULTS.START_INDEX,
    itemsPerPage: DEFAULTS.LIMIT,
    query: DEFAULTS.QUERY,
    books: [
      createBookItem({ title: '테스트 책 1', author: '저자 1' }),
      createBookItem({ title: '테스트 책 2', author: '저자 2' })
    ]
  };

  const merged = { ...defaults, ...overrides };

  return {
    version: 20131101,
    title: 'Search Results',
    link: 'http://example.com',
    pubDate: '2023-01-01',
    totalResults: merged.totalResults,
    startIndex: merged.startIndex,
    itemsPerPage: merged.itemsPerPage,
    query: merged.query,
    item: merged.books
  };
};

/**
 * 테스트용 BookSearchResult  검색 결과 생성 헬퍼
 */
export const createBookSearchResult = (overrides: Partial<{
  totalBooks: number;
  page: number;
  limit: number;
  totalResults: number;
}> = {}): BookSearchResult => {
  const defaults = {
    totalBooks: 2,
    page: 1,
    limit: 10,
    totalResults: 25
  };

  const merged = { ...defaults, ...overrides };
  const totalPages = Math.ceil(merged.totalResults / merged.limit);

  return {
    books: Array.from({ length: merged.totalBooks }, (_, index) => 
      createBookItem({
        title: `테스트 책 ${index + 1}`,
        author: `저자 ${index + 1}`,
        isbn: `123456789012${index}`,
        publisher: `출판사 ${index + 1}`,
        cover: `http://example.com/cover${index + 1}.jpg`
      })
    ),
    pagination: {
      page: merged.page,
      limit: merged.limit,
      total: merged.totalResults,
      totalPages
    }
  };
};