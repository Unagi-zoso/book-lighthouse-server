import { AladdinSearchResponse, AladdinBookItem } from '@/types';

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
    totalResults: 25,
    startIndex: 1,
    itemsPerPage: 10,
    query: 'test book',
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