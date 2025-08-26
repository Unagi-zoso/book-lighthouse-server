import { NLSearchResponse, NLBookItem, NLBibliographicResponse, NLBibliographicItem } from './nlApiClient';
import { BookSearchResponse, BookItem } from '@/types';

export class BookApiAdapter {
  static convertNLToBook(nlResponse: NLSearchResponse, bibliographicResponse?: NLBibliographicResponse): BookSearchResponse {
    return {
      version: 1,
      title: 'National Library Search Results',
      link: 'https://www.nl.go.kr',
      pubDate: new Date().toISOString(),
      totalResults: nlResponse.total || 0,
      startIndex: ((nlResponse.pageNum - 1) * nlResponse.pageSize) + 1,
      itemsPerPage: nlResponse.pageSize || 5,
      query: nlResponse.kwd || '',
      item: nlResponse.result?.map(nlItem => this.convertNLBookItem(nlItem, bibliographicResponse)) || []
    };
  }

  static convertSingleNLBook(nlItem: NLBookItem, bibliographicResponse?: NLBibliographicResponse): BookItem {
    return this.convertNLBookItem(nlItem, bibliographicResponse);
  }

  static convertBibliographicToBook(bibItem: NLBibliographicItem): BookItem {
    // HTML 태그 제거 및 정리
    const cleanTitle = bibItem.TITLE?.replace(/<[^>]*>/g, '').trim() || '';
    let cleanAuthor = bibItem.AUTHOR?.replace(/<[^>]*>/g, '').trim() || '';
    
    // 저자 정보에서 불필요한 prefix 제거
    cleanAuthor = cleanAuthor.replace(/글·그림:\s*|글:\s*|그림:\s*|지은이:\s*|저자:\s*|번역:\s*|역:\s*|공역\s*|저;\s*|역\s*/g, '').trim();
    
    // 출판사 정보 정리
    let publisher = bibItem.PUBLISHER?.replace(/<[^>]*>/g, '').trim() || '';
    
    // ISBN 정보 추출
    const fullIsbn = bibItem.EA_ISBN?.replace(/[^\d]/g, '') || '';
    const isbn13 = fullIsbn.slice(0, 13);
    const isbn = fullIsbn.slice(0, 10);
    const cover = bibItem.TITLE_URL || '';
    
    return {
      title: cleanTitle,
      link: `https://www.nl.go.kr/seoji/contents/S80100000000.do?schM=intgr_detail_view_isbn&page=1&pageUnit=10&schType=simple&schStr=${encodeURIComponent(cleanTitle)}&isbn=${bibItem.EA_ISBN}`,
      author: cleanAuthor,
      pubDate: bibItem.PUBLISH_PREDATE || '',
      description: '', // 큰 의미가 없어 공백 반환
      isbn,
      isbn13,
      priceSales: 0,
      priceStandard: parseInt(bibItem.REAL_PRICE?.replace(/[^\d]/g, '') || '0') || 0,
      mallType: 'LIBRARY',
      stockStatus: 'Available',
      mileage: 0,
      cover,
      categoryId: 0,
      categoryName: bibItem.FORM || '',
      publisher,
      salesPoint: 0,
      adult: false,
      fixedPrice: false,
      customerReviewRank: 0,
      subInfo: {
        itemPage: parseInt(bibItem.PAGE?.replace(/[^\d]/g, '') || '0') || 0,
      }
    };
  }

  private static convertNLBookItem(nlItem: NLBookItem, bibliographicResponse?: NLBibliographicResponse): BookItem {
    // HTML 태그 제거 (더 강력한 정규식)
    const cleanTitle = nlItem.titleInfo?.replace(/<[^>]*>/g, '').trim() || '';
    let cleanAuthor = nlItem.authorInfo?.replace(/<[^>]*>/g, '').trim() || '';
    
    // 저자 정보에서 불필요한 prefix 제거
    cleanAuthor = cleanAuthor.replace(/글·그림:\s*|글:\s*|그림:\s*|지은이:\s*|저자:\s*|번역:\s*|역:\s*|공역\s*/g, '').trim();
    
    // 출판사 정보 파싱 및 HTML 태그 제거
    let publisher = nlItem.pubInfo?.split(':')[0]?.trim() || '';
    publisher = publisher.replace(/<[^>]*>/g, '').trim();
    
    // 서지정보에서 ISBN과 커버 이미지 찾기
    let isbn = '';
    let isbn13 = '';
    let cover = '';
    
    if (bibliographicResponse?.docs) {
      
      // 제목으로 1차 매칭 (정확도 높음)
      let matchingBib = bibliographicResponse.docs.find(bib => 
        this.isTitleMatch(cleanTitle, bib.TITLE)
      );
      
      // 제목 매칭이 안 되면 저자로 2차 매칭 (정확도 낮음)
      if (!matchingBib && cleanAuthor) {
        matchingBib = bibliographicResponse.docs.find(bib => 
          this.isAuthorMatch(cleanAuthor, bib.AUTHOR)
        );
      }
      
      // 가장 첫 번째 결과 사용 (마지막 수단)
      if (!matchingBib && bibliographicResponse.docs.length > 0) {
        matchingBib = bibliographicResponse.docs[0];
      }
      
      if (matchingBib) {
        const fullIsbn = matchingBib.EA_ISBN?.replace(/[^\d]/g, '') || '';
        isbn13 = fullIsbn.slice(0, 13);
        isbn = fullIsbn.slice(0, 10);
        cover = matchingBib.TITLE_URL || '';
      }
    }
    
    const result = {
      title: cleanTitle,
      link: `https://www.nl.go.kr${nlItem.detailLink || ''}`,
      author: cleanAuthor,
      pubDate: nlItem.pubYearInfo || '',
      description: nlItem.placeInfo || '',
      isbn,
      isbn13,
      priceSales: 0,
      priceStandard: 0,
      mallType: 'LIBRARY',
      stockStatus: 'Available',
      mileage: 0,
      cover,
      categoryId: 0,
      categoryName: nlItem.typeName || '',
      publisher,
      salesPoint: 0,
      adult: false,
      fixedPrice: false,
      customerReviewRank: 0,
      subInfo: {
        itemPage: 0,
      }
    };
    
    return result;
  }

  private static isTitleMatch(searchTitle: string, bibTitle: string): boolean {
    if (!searchTitle || !bibTitle) return false;
    
    // 더 강력한 정리 (특수문자, 조사 등 제거)
    const cleanSearchTitle = searchTitle
      .replace(/[^\w가-힣\s]/g, ' ')  // 특수문자를 공백으로
      .replace(/\s+/g, ' ')          // 연속 공백 하나로
      .toLowerCase().trim();
    const cleanBibTitle = bibTitle
      .replace(/[^\w가-힣\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase().trim();
    
    // 완전 일치
    if (cleanSearchTitle === cleanBibTitle) return true;
    
    // 포함 관계 (양방향)
    if (cleanBibTitle.includes(cleanSearchTitle) || cleanSearchTitle.includes(cleanBibTitle)) return true;
    
    // 핵심 단어 추출 (2글자 이상)
    const searchWords = cleanSearchTitle.split(/\s+/).filter(word => word.length >= 2);
    const bibWords = cleanBibTitle.split(/\s+/).filter(word => word.length >= 2);
    
    if (searchWords.length === 0) return false;
    
    // 더 유연한 매칭: 각 단어가 부분 문자열로라도 포함되는지 확인
    const matchedWords = searchWords.filter(searchWord => 
      bibWords.some(bibWord => 
        bibWord.includes(searchWord) || 
        searchWord.includes(bibWord) ||
        // 레벤시타인 거리 기반 유사도 체크 (간단 버전)
        this.isWordSimilar(searchWord, bibWord)
      )
    );
    
    // 매칭 비율을 40%로 낮춤 (더 관대하게)
    return (matchedWords.length / searchWords.length) >= 0.4;
  }

  private static isWordSimilar(word1: string, word2: string): boolean {
    if (word1.length < 2 || word2.length < 2) return false;
    
    // 한 단어가 다른 단어의 80% 이상을 포함하면 유사하다고 판단
    const shorter = word1.length < word2.length ? word1 : word2;
    const longer = word1.length < word2.length ? word2 : word1;
    
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) matches++;
    }
    
    return (matches / shorter.length) >= 0.8;
  }

  private static isAuthorMatch(searchAuthor: string, bibAuthor: string): boolean {
    if (!searchAuthor || !bibAuthor) return false;
    
    const cleanSearchAuthor = searchAuthor.replace(/[^\w가-힣\s]/g, '').toLowerCase().trim();
    const cleanBibAuthor = bibAuthor.replace(/[^\w가-힣\s]/g, '').toLowerCase().trim();
    
    // 저자는 더 엄격하게 매칭 (완전 일치 또는 포함)
    return cleanBibAuthor.includes(cleanSearchAuthor) || cleanSearchAuthor.includes(cleanBibAuthor);
  }
}