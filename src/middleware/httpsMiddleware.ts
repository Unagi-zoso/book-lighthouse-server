import { Request, Response, NextFunction } from 'express';
import fs from 'fs';

/**
 * HTTPS 리다이렉션 미들웨어
 * HTTP 요청을 HTTPS로 리다이렉션합니다.
 */
export const httpsRedirect = (req: Request, res: Response, next: NextFunction): void => {
  // 개발 환경에서는 HTTPS 리다이렉션 비활성화
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  // 이미 HTTPS인 경우 통과
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    return next();
  }

  // HTTP를 HTTPS로 리다이렉션
  const httpsUrl = `https://${req.get('host')}${req.originalUrl}`;
  res.redirect(301, httpsUrl);
};

/**
 * HSTS (HTTP Strict Transport Security) 헤더 설정 미들웨어
 * 브라우저가 HTTPS만 사용하도록 강제합니다.
 */
export const setHSTS = (req: Request, res: Response, next: NextFunction): void => {
  // 개발 환경에서는 HSTS 비활성화
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  // HSTS 헤더 설정 (1년간 유효, 서브도메인 포함, preload 허용)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  next();
};

/**
 * SSL 인증서 경로 검증 및 로드
 * 환경변수로 설정된 SSL 인증서 경로를 검증합니다.
 */
export const getSSLConfig = () => {
  const sslCertPath = process.env.SSL_CERT_PATH;
  const sslKeyPath = process.env.SSL_KEY_PATH;

  // 개발 환경에서는 SSL 설정 건너뛰기
  if (process.env.NODE_ENV === 'development') {
    return null;
  }

  // 환경변수 검증
  if (!sslCertPath || !sslKeyPath) {
    throw new Error('SSL_CERT_PATH and SSL_KEY_PATH environment variables are required for production');
  }

  // 파일 존재 여부 검증
  if (!fs.existsSync(sslCertPath)) {
    throw new Error(`SSL certificate file not found: ${sslCertPath}`);
  }

  if (!fs.existsSync(sslKeyPath)) {
    throw new Error(`SSL key file not found: ${sslKeyPath}`);
  }

  try {
    return {
      cert: fs.readFileSync(sslCertPath, 'utf8'),
      key: fs.readFileSync(sslKeyPath, 'utf8')
    };
  } catch (error) {
    throw new Error(`Failed to read SSL certificates: ${error}`);
  }
};

/**
 * 보안 헤더 설정 미들웨어
 * 다양한 보안 헤더들을 설정합니다.
 */
export const setSecurityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // X-Content-Type-Options: MIME 타입 스니핑 방지
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options: 클릭재킹 방지
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-XSS-Protection: XSS 공격 방지 (구형 브라우저용)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer-Policy: 리퍼러 정보 제한
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content-Security-Policy: 기본적인 CSP 설정
  res.setHeader(
    'Content-Security-Policy', 
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
  );
  
  next();
};