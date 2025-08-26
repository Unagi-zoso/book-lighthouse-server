import { NLSearchResponse, NLBookItem, NLBibliographicResponse, NLBibliographicItem } from '@/services/nlApiClient';

export const createNLSearchResponse = (options: {
  total?: number;
  pageNum?: number;
  pageSize?: number;
  booksCount?: number;
} = {}): NLSearchResponse => {
  const {
    total = 25,
    pageNum = 1,
    pageSize = 10,
    booksCount = 2
  } = options;

  const books: NLBookItem[] = Array.from({ length: booksCount }, (_, index) => ({
    titleInfo: `테스트 도서 ${index + 1}`,
    typeName: '도서',
    placeInfo: '일반도서실',
    authorInfo: `테스트 작가 ${index + 1}`,
    pubInfo: `테스트 출판사 ${index + 1}`,
    menuName: '오프라인자료',
    mediaName: '인쇄자료(책자형)',
    manageName: '국립중앙도서관',
    pubYearInfo: '2023',
    controlNo: `CTRL${String(index + 1).padStart(6, '0')}`,
    id: `ID${String(index + 1).padStart(6, '0')}`,
    detailLink: `/NL/contents/search.do#viewKey=ID${String(index + 1).padStart(6, '0')}`
  }));

  return {
    total,
    kwd: 'test',
    pageNum,
    pageSize,
    category: '도서',
    sort: '',
    result: books
  };
};

export const createNLBibliographicResponse = (options: {
  TOTAL_COUNT?: string;
  PAGE_NO?: string;
  docsCount?: number;
} = {}): NLBibliographicResponse => {
  const {
    TOTAL_COUNT = '25',
    PAGE_NO = '1',
    docsCount = 2
  } = options;

  const docs: NLBibliographicItem[] = Array.from({ length: docsCount }, (_, index) => ({
    TITLE: `테스트 도서 ${index + 1}`,
    AUTHOR: `테스트 작가 ${index + 1}`,
    PUBLISHER: `테스트 출판사 ${index + 1}`,
    PUBLISH_PREDATE: '2023',
    EA_ISBN: `978898392535${index}`,
    TITLE_URL: '',
    CONTROL_NO: `CTRL${String(index + 1).padStart(6, '0')}`,
    FORM: '도서',
    DDC: '000',
    UPDATE_DATE: '2023-01-01',
    EA_ADD_CODE: '',
    PRE_PRICE: '15000',
    DEPOSIT_YN: 'Y',
    BOOK_SIZE: '',
    EBOOK_YN: 'N',
    REAL_PRICE: '15000',
    FORM_DETAIL: '단행본',
    INPUT_DATE: '2023-01-01',
    SET_EXPRESSION: '',
    VOL: '',
    CIP_YN: 'Y',
    SUBJECT: '일반도서',
    BIB_YN: 'Y',
    SET_ADD_CODE: '',
    PAGE: '200',
    RELATED_ISBN: '',
    SERIES_TITLE: '',
    SERIES_NO: ''
  }));

  return {
    TOTAL_COUNT,
    PAGE_NO,
    docs
  };
};