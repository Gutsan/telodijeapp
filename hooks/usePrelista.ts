/**
 * hooks/usePrelista.ts
 * 
 * Hook dedicado para gestionar la "Pre-lista" de partidos.
 * Proporciona estados de carga, error, datos y funciones de refresco.
 * 
 * @module hooks/usePrelista
 * @version 1.0.0
 * 
 * @example
 * ```tsx
 * import { usePrelista } from '../hooks';
 * 
 * function PrelistaScreen() {
 *   const { matches, loading, error, refresh } = usePrelista();
 * 
 *   if (loading) return <LoadingSpinner />;
 *   if (error) return <ErrorAlert message={error} />;
 * 
 *   return (
 *     <FlatList
 *       data={matches}
 *       keyExtractor={(item) => item.id}
 *       renderItem={({ item }) => <PrelistaCard match={item} />}
 *       onRefresh={refresh}
 *       refreshing={loading}
 *     />
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import type { MatchWithRelevance, PrelistaConfig, PrelistaResult } from '../types';
import { matchService } from '../services/match.service';
import { DEFAULT_PRELISTA_CONFIG } from '../constants/prelista';

// ──────────────────────────────────────────────────────────────────
//  TIPOS DE RETORNO
// ──────────────────────────────────────────────────────────────────

/**
 * Estado completo retornado por el hook usePrelista.
 */
export interface UsePrelistaReturn {
  /** Partidos rankeados por relevancia */
  matches: MatchWithRelevance[];

  /** Indicador de carga en progreso */
  loading: boolean;

  /** Mensaje de error (null si no hay error) */
  error: string | null;

  /** Metadatos de la última consulta */
  meta: {
    fromDate: string;
    toDate: string;
    totalFound: number;
  } | null;

  /** Configuración utilizada para la consulta actual */
  config: PrelistaConfig;

  /** Función para refrescar los datos manualmente */
  refresh: () => Promise<void>;

  /** Función para actualizar la configuración y recargar */
  updateConfig: (newConfig: Partial<PrelistaConfig>) => Promise<void>;

  /** Indicador de si hay partidos disponibles */
  hasMatches: boolean;

  /** Número total de partidos en la pre-lista */
  matchCount: number;
}

// ──────────────────────────────────────────────────────────────────
//  HOOK PRINCIPAL
// ──────────────────────────────────────────────────────────────────

/**
 * Hook para gestionar la pre-lista de partidos.
 * 
 * Características:
 * - Carga automática al montar el componente
 * - Soporte para configuración personalizada
 * - Función de refresco para pull-to-refresh
 * - Estados de carga y error tipados
 * - Actualización dinámica de configuración
 * 
 * @param initialConfig - Configuración inicial opcional (override parcial)
 * @returns UsePrelistaReturn con datos y funciones
 */
export function usePrelista(
  initialConfig?: Partial<PrelistaConfig>,
): UsePrelistaReturn {
  // Estado del hook
  const [matches, setMatches] = useState<MatchWithRelevance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    fromDate: string;
    toDate: string;
    totalFound: number;
  } | null>(null);
  const [config, setConfig] = useState<PrelistaConfig>({
    ...DEFAULT_PRELISTA_CONFIG,
    ...initialConfig,
  });

  /**
   * Función interna para cargar los partidos.
   * Extraída para poder ser llamada desde refresh y updateConfig.
   */
  const fetchPrelista = useCallback(async (currentConfig: PrelistaConfig) => {
    try {
      setLoading(true);
      setError(null);

      // Auto-sync: verificar si necesitamos sincronizar partidos
      const syncResult = await matchService.checkAndSyncIfNeeded();
      if (syncResult.synced) {
        console.log(`Auto-sync executed: ${syncResult.reason}`, syncResult.result);
      }

      // Cargar partidos
      const result: PrelistaResult = await matchService.getPrelista(currentConfig);

      setMatches(result.matches);
      setMeta({
        fromDate: result.fromDate,
        toDate: result.toDate,
        totalFound: result.totalFound,
      });
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : 'Error al cargar la pre-lista de partidos';
      setError(message);
      console.error('usePrelista error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carga inicial al montar el componente.
   * Se ejecuta una sola vez (o cuando cambia la config).
   */
  useEffect(() => {
    fetchPrelista(config);
  }, [config, fetchPrelista]);

  /**
   * Función de refresco para pull-to-refresh o botones de reload.
   * Mantiene la configuración actual.
   */
  const refresh = useCallback(async () => {
    await fetchPrelista(config);
  }, [config, fetchPrelista]);

  /**
   * Actualiza la configuración y recarga los datos.
   * Útil para filtros dinámicos o ajustes del usuario.
   * 
   * @param newConfig - Partial de configuración a aplicar
   */
  const updateConfig = useCallback(async (newConfig: Partial<PrelistaConfig>) => {
    setConfig((prev) => ({
      ...prev,
      ...newConfig,
    }));
    // La recarga se dispara automáticamente por el useEffect
  }, []);

  // Valores derivados para conveniencia
  const hasMatches = matches.length > 0;
  const matchCount = matches.length;

  return {
    matches,
    loading,
    error,
    meta,
    config,
    refresh,
    updateConfig,
    hasMatches,
    matchCount,
  };
}

// ──────────────────────────────────────────────────────────────────
//  HOOK SIMPLIFICADO (solo datos, sin configuración dinámica)
// ──────────────────────────────────────────────────────────────────

/**
 * Versión simplificada del hook que solo retorna matches y estado de carga.
 * Ideal para componentes que solo necesitan mostrar la lista sin controlar la config.
 * 
 * @returns Objeto con matches, loading, error y refresh
 */
export function usePrelistaSimple() {
  const { matches, loading, error, refresh, hasMatches, matchCount } = usePrelista();

  return {
    matches,
    loading,
    error,
    refresh,
    hasMatches,
    matchCount,
  };
}
