/**
 * sync.service.ts
 * 
 * Servicio de sincronización de partidos.
 * Utiliza una Edge Function de Supabase para llamar a Football-Data.org
 * y evitar problemas de CORS.
 * 
 * @module services/sync.service
 * @version 2.1.0
 */

import { supabase } from '../lib/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

// ──────────────────────────────────────────────────────────────────
//  TYPES
// ──────────────────────────────────────────────────────────────────

export interface SyncResult {
  created: number;
  updated: number;
  errors: number;
  total: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  records_processed: number;
  records_created: number;
  records_updated: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

// ──────────────────────────────────────────────────────────────────
//  SYNC SERVICE
// ──────────────────────────────────────────────────────────────────

export const syncService = {
  /**
   * Main sync function: sync matches via Edge Function.
   * 
   * Intenta dos métodos:
   * 1. supabase.functions.invoke (método estándar)
   * 2. fetch directo (fallback si invoke falla)
   * 
   * @returns SyncResult con estadísticas de la sincronización
   */
  async syncMatches(): Promise<SyncResult> {
    // Método 1: Intentar con supabase.functions.invoke
    try {
      console.log('Starting sync via Edge Function (invoke)...');

      const { data, error } = await supabase.functions.invoke('sync-matches', {
        method: 'POST',
        body: {},
      });

      if (!error && data && !data.error) {
        const result: SyncResult = {
          created: data?.created ?? 0,
          updated: data?.updated ?? 0,
          errors: data?.errors ?? 0,
          total: data?.total ?? 0,
          dateFrom: data?.dateFrom,
          dateTo: data?.dateTo,
        };
        console.log(`Sync completed (invoke): ${result.created} created, ${result.updated} updated`);
        return result;
      }

      console.warn('Edge Function invoke returned error, trying fallback...', error?.message || data?.error);
    } catch (invokeError) {
      console.warn('Edge Function invoke failed, trying fallback...', invokeError instanceof Error ? invokeError.message : invokeError);
    }

    // Método 2: Fetch directo (fallback)
    try {
      console.log('Starting sync via Edge Function (direct fetch)...');

      // Obtener la session actual para el token de auth
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch(`${SUPABASE_URL}/functions/v1/sync-matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unknown error');
        console.warn(`Edge Function fetch returned ${res.status}: ${errorText}`);
        return this.handleSyncFailure(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();

      if (data.error) {
        console.warn('Edge Function returned error:', data.error);
        return this.handleSyncFailure(data.error);
      }

      const result: SyncResult = {
        created: data?.created ?? 0,
        updated: data?.updated ?? 0,
        errors: data?.errors ?? 0,
        total: data?.total ?? 0,
        dateFrom: data?.dateFrom,
        dateTo: data?.dateTo,
      };

      console.log(`Sync completed (fetch): ${result.created} created, ${result.updated} updated`);
      return result;

    } catch (fetchError) {
      console.warn('Edge Function direct fetch failed:', fetchError instanceof Error ? fetchError.message : fetchError);
      return this.handleSyncFailure(fetchError instanceof Error ? fetchError.message : 'Unknown fetch error');
    }
  },

  /**
   * Maneja fallos del sync sin bloquear la app.
   * Retorna un SyncResult con errors=1 y log de warning.
   */
  handleSyncFailure(reason: string): SyncResult {
    console.warn(`Sync skipped: ${reason}`);
    console.warn('The app will continue with existing data.');
    return {
      created: 0,
      updated: 0,
      errors: 1,
      total: 0,
    };
  },

  /**
   * Get recent sync logs
   */
  async getSyncLogs(limit: number = 10): Promise<SyncLog[]> {
    const { data } = await supabase
      .from('sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    return data || [];
  },

  /**
   * Get active tournaments (for admin panel compatibility)
   */
  async getActiveTournaments() {
    return [];
  },

  /**
   * Toggle tournament active status (for admin panel compatibility)
   */
  async toggleTournament(_id: number, _isActive: boolean) {
    console.log('Tournament toggle not needed with Football-Data.org API');
  },
};
