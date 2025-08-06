import { supabase } from '@/config/supabase';
import { LogLevel, LogEntry } from '@/types/logging';
import { Request } from 'express';

export class LoggingService {
  
  /**
   * DB에 로그를 저장하는 메인 메소드
   */
  async log(entry: LogEntry): Promise<void> {
    try {
      // 한국 시간으로 타임스탬프 추가
      const logEntryWithTimestamp = {
        ...entry,
        created_at: this.getKoreanTimestamp()
      };

      const { error } = await supabase
        .from('app_logs')
        .insert([logEntryWithTimestamp]);

      if (error) {
        console.error('Failed to save log to database:', error);
      }
    } catch (error) {
      console.error('Database logging service error:', error);
    }
  }

  /**
   * HTTP 요청 정보를 포함한 로그 생성
   */
  async logWithRequest(
    level: LogLevel, 
    eventType: string, 
    message: string, 
    req?: Request, 
    details?: Record<string, any>
  ): Promise<void> {
    const entry: LogEntry = {
      log_level: level,
      event_type: eventType,
      message,
      details,
      // 요청 정보 추출
      ip_address: req ? this.extractIpAddress(req) : null,
      user_agent: req?.get('User-Agent') || null,
      http_method: req?.method || null,
      request_path: req?.originalUrl || null,
    };

    await this.log(entry);
  }

  /**
   * 간단한 로그 생성 (요청 정보 없음)
   */
  async logSimple(
    level: LogLevel, 
    eventType: string, 
    message: string, 
    details?: Record<string, any>
  ): Promise<void> {
    const entry: LogEntry = {
      log_level: level,
      event_type: eventType,
      message,
      details
    };

    await this.log(entry);
  }

  /**
   * API 에러 로깅 전용 메소드
   */
  async logApiError(
    error: Error, 
    req: Request, 
    details?: Record<string, any>
  ): Promise<void> {
    await this.logWithRequest(
      'ERROR',
      'API_ERROR',
      error.message,
      req,
      {
        stack: error.stack,
        name: error.name,
        ...details
      }
    );
  }

  /**
   * 외부 API 호출 로깅
   */
  async logExternalApiCall(
    apiName: string,
    endpoint: string,
    success: boolean,
    responseTime?: number,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSimple(
      success ? 'INFO' : 'WARN',
      'EXTERNAL_API_CALL',
      `${apiName} API call to ${endpoint} ${success ? 'succeeded' : 'failed'}`,
      {
        api_name: apiName,
        endpoint,
        success,
        response_time_ms: responseTime,
        ...details
      }
    );
  }

  /**
   * 비즈니스 로직 이벤트 로깅
   */
  async logBusinessEvent(
    event: string,
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSimple(
      'INFO',
      'BUSINESS_EVENT',
      message,
      {
        business_event: event,
        ...details
      }
    );
  }


  /**
   * 한국 시간 타임스탬프 생성
   */
  private getKoreanTimestamp(): string {
    return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).replace(' ', 'T') + 'Z';
  }

  /**
   * IP 주소 추출 (프록시 환경 고려)
   */
  private extractIpAddress(req: Request): string | null {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] as string ||
      req.socket?.remoteAddress ||
      req.ip ||
      null
    );
  }
}

// 싱글톤 인스턴스 생성
export const loggingService = new LoggingService();