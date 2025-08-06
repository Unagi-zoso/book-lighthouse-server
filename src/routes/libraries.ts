import { Router } from 'express';
import { OptimalLibraryService } from '@/services/optimalLibraryService';
import { loggingService } from '@/services/loggingService';

const router = Router();
const optimalLibraryService = new OptimalLibraryService();

/**
 * POST /api/libraries/calculate-optimal-library-set
 * 최적의 도서관 조합을 계산합니다
 */
router.post('/calculate-optimal-library-set', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { isbns } = req.body;

    // 요청 로깅
    await loggingService.logWithRequest(
      'INFO',
      'API_REQUEST',
      'Optimal library set calculation requested',
      req,
      { isbns }
    );

    if (!isbns || !Array.isArray(isbns)) {
      await loggingService.logWithRequest(
        'WARN',
        'VALIDATION_ERROR',
        'Missing or invalid isbns array',
        req,
        { received_isbns: isbns }
      );
      return res.status(400).json({
        success: false,
        message: 'isbns array is required'
      });
    }

    if (isbns.length < 1 || isbns.length > 3) {
      await loggingService.logWithRequest(
        'WARN',
        'VALIDATION_ERROR',
        'Invalid isbns array length',
        req,
        { isbns_length: isbns.length, isbns }
      );
      return res.status(400).json({
        success: false,
        message: 'isbns array must contain 1-3 items'
      });
    }

    // ISBN 형식 간단 검증
    const isbnPattern = /^[\d\-X]+$/i;
    const invalidIsbns = isbns.filter(isbn => !isbnPattern.test(isbn));
    if (invalidIsbns.length > 0) {
      await loggingService.logWithRequest(
        'WARN',
        'VALIDATION_ERROR',
        'Invalid ISBN format detected',
        req,
        { invalid_isbns: invalidIsbns, valid_isbns: isbns.filter(isbn => isbnPattern.test(isbn)) }
      );
      return res.status(400).json({
        success: false,
        message: `Invalid ISBN format: ${invalidIsbns.join(', ')}`
      });
    }

    const result = await optimalLibraryService.calculateOptimalLibrarySet({ isbns });

    if (!result.success) {
      await loggingService.logWithRequest(
        'ERROR',
        'BUSINESS_LOGIC_ERROR',
        'Optimal library calculation failed',
        req,
        { error: result.error, isbns }
      );
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    // 성공 로깅
    const duration = Date.now() - startTime;

    await loggingService.logWithRequest(
      'INFO',
      'API_SUCCESS',
      'Optimal library calculation completed successfully',
      req,
      { 
        duration_ms: duration,
        optimal_sets_count: result.data?.optimalSets.length || 0 
      }
    );

    return res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    // DB에 에러 로깅 (콘솔 대신)
    await loggingService.logApiError(
      error as Error,
      req,
      { 
        endpoint: '/calculate-optimal-library-set',
        duration_ms: Date.now() - startTime 
      }
    );

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;