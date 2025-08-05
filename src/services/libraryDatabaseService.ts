import { ServiceResult } from '@/types';
import { supabase } from '@/config/supabase';

/**
 * DB 에서 직접 관리하는 도서관 정보
 */
export interface LibraryDatabaseRecord {
  lib_code: number;
  lib_name: string;
  address: string | null;
  website: string | null;
  detailed_address: string | null;
  latitude: string | null;
  longitude: string | null;
  operating_hours: string | null;
  closed_days: string | null;
  created_at: string;
  updated_at: string;
}

export class LibraryDatabaseService {
  async getAllLibraries(): Promise<ServiceResult<LibraryDatabaseRecord[]>> {
    try {
      const { data, error } = await supabase
        .from('libraries')
        .select('*')
        .order('lib_code');

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as LibraryDatabaseRecord[]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}