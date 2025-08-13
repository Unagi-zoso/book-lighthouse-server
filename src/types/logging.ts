// 로깅 관련 타입 정의
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface LogEntry {
  log_level: LogLevel;
  event_type: string;
  ip_address?: string | null;
  user_agent?: string | null;
  http_method?: string | null;
  request_path?: string | null;
  message: string;
  details?: Record<string, any> | null;
  created_at?: string;
}