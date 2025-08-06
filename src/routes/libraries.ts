import { Router } from 'express';
import { OptimalLibraryService } from '@/services/optimalLibraryService';

const router = Router();
const optimalLibraryService = new OptimalLibraryService();

/**
 * POST /api/libraries/calculate-optimal-library-set
 * 최적의 도서관 조합을 계산합니다
 */
router.post('/calculate-optimal-library-set', async (req, res) => {
  try {
    const { isbns } = req.body;

    if (!isbns || !Array.isArray(isbns)) {
      return res.status(400).json({
        success: false,
        message: 'isbns array is required'
      });
    }

    if (isbns.length < 1 || isbns.length > 3) {
      return res.status(400).json({
        success: false,
        message: 'isbns array must contain 1-3 items'
      });
    }

    // ISBN 형식 간단 검증
    const isbnPattern = /^[\d\-X]+$/i;
    const invalidIsbns = isbns.filter(isbn => !isbnPattern.test(isbn));
    if (invalidIsbns.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid ISBN format: ${invalidIsbns.join(', ')}`
      });
    }

    const result = await optimalLibraryService.calculateOptimalLibrarySet({ isbns });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    return res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Error in calculate-optimal-library-set:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;