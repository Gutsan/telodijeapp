import { supabase } from '../lib/supabase';
import type { Match, MatchWithRelevance, PrelistaConfig, PrelistaResult } from '../types';
import { filterAndRankMatches } from '../utils/relevance';
import { DEFAULT_PRELISTA_CONFIG, AUTO_SYNC_INTERVAL_HOURS } from '../constants/prelista';
import { syncService } from './sync.service';

export const matchService = {
  async getById(matchId: string): Promise<Match | null> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (error) {
      console.error('Error fetching match:', error);
      return null;
    }

    return data;
  },

  async getUpcoming(limit: number = 50): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'scheduled')
      .gte('match_date', new Date().toISOString())
      .order('match_date', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching upcoming matches:', error);
      return [];
    }

    return data || [];
  },

  async getByQuiniela(quinielaId: string): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        quiniela_matches!inner(quiniela_id)
      `)
      .eq('quiniela_matches.quiniela_id', quinielaId)
      .order('match_date', { ascending: true });

    if (error) {
      console.error('Error fetching matches by quiniela:', error);
      return [];
    }

    return data || [];
  },

  async getWeekly(): Promise<Match[]> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .gte('match_date', startOfWeek.toISOString())
      .lte('match_date', endOfWeek.toISOString())
      .order('match_date', { ascending: true });

    if (error) {
      console.error('Error fetching weekly matches:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Search matches by team name, league, or date
   * Used when adding matches to a private quiniela
   */
  async search(query: string, limit: number = 20): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .or(`home_team.ilike.%${query}%,away_team.ilike.%${query}%,league.ilike.%${query}%`)
      .eq('status', 'scheduled')
      .gte('match_date', new Date().toISOString())
      .order('match_date', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error searching matches:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Get all scheduled matches (for selection in quiniela creation)
   */
  async getScheduledForSelection(): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'scheduled')
      .gte('match_date', new Date().toISOString())
      .order('match_date', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error fetching scheduled matches:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Link a match to a quiniela (no duplicate — uses PK on quiniela_matches)
   */
  async linkToQuiniela(matchId: string, quinielaId: string): Promise<boolean> {
    const { error } = await supabase
      .from('quiniela_matches')
      .insert({
        quiniela_id: quinielaId,
        match_id: matchId,
      });

    if (error) {
      // If duplicate key error, it's already linked — that's OK
      if (error.code === '23505') return true;
      console.error('Error linking match to quiniela:', error);
      return false;
    }

    return true;
  },

  /**
   * Link multiple matches to a quiniela
   */
  async linkMultipleToQuiniela(matchIds: string[], quinielaId: string): Promise<{ linked: number; errors: number }> {
    let linked = 0;
    let errors = 0;

    for (const matchId of matchIds) {
      const success = await this.linkToQuiniela(matchId, quinielaId);
      if (success) linked++;
      else errors++;
    }

    return { linked, errors };
  },

  /**
   * Unlink a match from a quiniela
   */
  async unlinkFromQuiniela(matchId: string, quinielaId: string): Promise<boolean> {
    const { error } = await supabase
      .from('quiniela_matches')
      .delete()
      .eq('quiniela_id', quinielaId)
      .eq('match_id', matchId);

    if (error) {
      console.error('Error unlinking match:', error);
      return false;
    }

    return true;
  },

  /**
   * Get matches already linked to a quiniela
   */
  async getLinkedMatchIds(quinielaId: string): Promise<string[]> {
    const { data } = await supabase
      .from('quiniela_matches')
      .select('match_id')
      .eq('quiniela_id', quinielaId);

    return (data || []).map((r) => r.match_id);
  },

  /**
   * Obtiene la "Pre-lista" de partidos: los más relevantes de los próximos N días.
   * 
   * Este método:
   * 1. Consulta todos los partidos programados desde la DB
   * 2. Filtra por el rango temporal configurado (default: 7 días)
   * 3. Calcula un score de relevancia para cada partido
   * 4. Ordena por relevancia (descendente)
   * 5. Trunca al máximo configurado (default: 10)
   * 
   * @param config - Configuración personalizada (opcional, usa DEFAULT_PRELISTA_CONFIG)
   * @returns PrelistaResult con partidos rankeados y metadatos
   * 
   * @example
   * ```typescript
   * // Uso con configuración por defecto
   * const result = await matchService.getPrelista();
   * console.log(result.matches); // Top 10 partidos de los próximos 7 días
   * 
   * // Uso con configuración personalizada
   * const custom = await matchService.getPrelista({
   *   daysAhead: 14,
   *   maxMatches: 5,
   *   weights: { league: 0.5, recency: 0.3, status: 0.1, metadata: 0.1 },
   *   leagueWeights: DEFAULT_PRELISTA_CONFIG.leagueWeights,
   *   decayFactor: 0.9,
   * });
   * ```
   */
  async getPrelista(
    config: PrelistaConfig = DEFAULT_PRELISTA_CONFIG,
  ): Promise<PrelistaResult> {
    // Calcular rango de fechas para el filtro DB (con margen extra)
    const now = new Date();
    const toDate = new Date(now);
    toDate.setDate(toDate.getDate() + config.daysAhead);

    // Consultar partidos programados en el rango
    // Nota: Hacemos un query más amplio y filtramos en cliente para
    // permitir que el algoritmo de scoring funcione correctamente
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'scheduled')
      .gte('match_date', now.toISOString())
      .order('match_date', { ascending: true })
      .limit(200); // Límite generoso para tener datos suficientes

    if (error) {
      console.error('Error fetching prelista matches:', error);
      return {
        matches: [],
        fromDate: now.toISOString(),
        toDate: toDate.toISOString(),
        totalFound: 0,
        config,
      };
    }

    const allMatches = data || [];

    // Aplicar algoritmo de filtrado y ranking
    const rankedMatches = filterAndRankMatches(allMatches, config);

    return {
      matches: rankedMatches,
      fromDate: now.toISOString(),
      toDate: toDate.toISOString(),
      totalFound: allMatches.length,
      config,
    };
  },

  /**
   * Versión simplificada de getPrelista que solo retorna los partidos rankeados.
   * Útil cuando no se necesitan los metadatos de la consulta.
   * 
   * @param config - Configuración personalizada (opcional)
   * @returns Array de partidos con relevancia calculada, ordenados y truncados
   */
  async getPrelistaMatches(
    config: PrelistaConfig = DEFAULT_PRELISTA_CONFIG,
  ): Promise<MatchWithRelevance[]> {
    const result = await this.getPrelista(config);
    return result.matches;
  },

  // ──────────────────────────────────────────────────────────────────
  //  AUTO-SYNC METHODS
  // ──────────────────────────────────────────────────────────────────

  /**
   * Obtiene la fecha del último sync exitoso.
   * 
   * @returns ISO string de la fecha del último sync, o null si nunca se ha sincronizado
   */
  async getLastSyncTime(): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('sync_logs')
        .select('completed_at')
        .eq('status', 'success')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return data.completed_at;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  },

  /**
   * Verifica si el sync está desactualizado.
   * 
   * @param lastSyncTime - Fecha del último sync (ISO string)
   * @param intervalHours - Intervalo en horas para considerar desactualizado
   * @returns true si el sync está desactualizado
   */
  isSyncStale(lastSyncTime: string, intervalHours: number = AUTO_SYNC_INTERVAL_HOURS): boolean {
    const lastSync = new Date(lastSyncTime);
    const now = new Date();
    const diffMs = now.getTime() - lastSync.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours >= intervalHours;
  },

  /**
   * Verifica si hay partidos en la base de datos.
   * 
   * @returns true si hay al menos 1 partido programado
   */
  async hasMatchesInDB(): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'scheduled');

      if (error) {
        console.error('Error checking matches:', error);
        return false;
      }

      return (count ?? 0) > 0;
    } catch (error) {
      console.error('Error checking matches:', error);
      return false;
    }
  },

  /**
   * Verifica y ejecuta sync si es necesario.
   * 
   * Ejecuta sync si:
   * 1. Nunca se ha sincronizado, O
   * 2. El último sync fue hace más de AUTO_SYNC_INTERVAL_HOURS horas, O
   * 3. No hay partidos en la base de datos
   * 
   * IMPORTANTE: Este método es tolerante a fallos. Si el sync falla
   * (ej: API de SofaScore no disponible), la app puede seguir funcionando
   * con los datos existentes en la DB.
   * 
   * @returns Objeto con el resultado del sync
   */
  async checkAndSyncIfNeeded(): Promise<{
    synced: boolean;
    reason: string;
    result?: { created: number; updated: number; errors: number };
  }> {
    try {
      // 1. Verificar si hay partidos en la DB
      const hasMatches = await this.hasMatchesInDB();
      
      if (!hasMatches) {
        console.log('No matches in DB, attempting sync...');
        try {
          const result = await syncService.syncMatches();
          return {
            synced: true,
            reason: 'No matches in database',
            result,
          };
        } catch (syncError) {
          console.warn('Sync failed but continuing:', syncError);
          return {
            synced: false,
            reason: 'Sync failed, no matches available',
          };
        }
      }

      // 2. Verificar último sync
      const lastSyncTime = await this.getLastSyncTime();
      
      if (!lastSyncTime) {
        console.log('No previous sync found, attempting sync...');
        try {
          const result = await syncService.syncMatches();
          return {
            synced: true,
            reason: 'No previous sync found',
            result,
          };
        } catch (syncError) {
          console.warn('Sync failed but continuing:', syncError);
          return {
            synced: false,
            reason: 'Sync failed, using existing data',
          };
        }
      }

      // 3. Verificar si está desactualizado
      if (this.isSyncStale(lastSyncTime)) {
        console.log(`Last sync was stale (${lastSyncTime}), attempting sync...`);
        try {
          const result = await syncService.syncMatches();
          return {
            synced: true,
            reason: `Last sync was stale (${lastSyncTime})`,
            result,
          };
        } catch (syncError) {
          console.warn('Sync failed but continuing:', syncError);
          return {
            synced: false,
            reason: 'Sync failed, using existing data',
          };
        }
      }

      // 4. Sync no necesario
      return {
        synced: false,
        reason: `Sync is fresh (last: ${lastSyncTime})`,
      };
    } catch (error) {
      // Error inesperado - no bloquear la app
      console.warn('Error in checkAndSyncIfNeeded:', error);
      return {
        synced: false,
        reason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};
