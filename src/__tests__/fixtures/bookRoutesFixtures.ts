/**
 * 테스트용 라우터 응답 검증 헬퍼
 */
export const createExpectedApiResponse = (data: any, message: string = 'Books retrieved successfully') => ({
  success: true,
  data,
  message,
  meta: expect.objectContaining({
    timestamp: expect.any(String)
  })
});

/**
 * 테스트용 에러 응답 검증 헬퍼
 */
export const createExpectedErrorResponse = (message: string) => ({
  success: false,
  message,
  meta: expect.objectContaining({
    timestamp: expect.any(String)
  })
});