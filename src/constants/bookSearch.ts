/**
 * 책 검색 관련 상수들
 */
export const BOOK_SEARCH_CONSTANTS = {
  // 페이징 관련
  DEFAULT_PAGE: 1,
  MIN_PAGE: 1,
  DEFAULT_LIMIT: 10, // 기본 5권
  MIN_LIMIT: 1,
  MAX_LIMIT: 10, // 자동 조정 기준
} as const;