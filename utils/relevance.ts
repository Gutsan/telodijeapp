/**
 * utils/relevance.ts
 * 
 * Algoritmo de scoring de relevancia para partidos de fútbol.
 * Calcula un score (0-10) basado en múltiples factores ponderados:
 * 
 * 1. **Liga/Torneo** (40%): Popularidad percibida de la competición
 * 2. **Cercanía** (35%): Cuán pronto se juega el partido (decaimiento exponencial)
 * 3. **Estado** (15%): Si está programado, en vivo o finalizado
 * 4. **Metadata** (10%): Factores especiales (derby, ronda eliminatoria, etc.)
 * 
 * @module utils/relevance
 * @version 1.0.0
 * 
 * @example
 * ```typescript
 * import { calculateRelevanceScore, filterAndRankMatches } from './relevance';
 * import { DEFAULT_PRELISTA_CONFIG } from '../constants/prelista';
 * 
 * const match = { ... }; // Match from DB
 * const score = calculateRelevanceScore(match, DEFAULT_PRELISTA_CONFIG);
 * console.log(score.total); // 7.8
 * console.log(score.tier);  // 'high'
 * ```
 */

import type {
  Match,
  MatchWithRelevance,
  PrelistaConfig,
  RelevanceScore,
} from '../types/match';

// ──────────────────────────────────────────────────────────────────
//  FUNCIONES AUXILIARES
// ──────────────────────────────────────────────────────────────────

/**
 * Obtiene la puntuación de una liga desde la config.
 * Si la liga no está en el mapa, retorna el valor fallback (5).
 * 
 * @param league - Nombre de la liga
 * @param leagueWeights - Mapa de ponderaciones de ligas
 * @returns Puntuación de la liga (1-10)
 */
function getLeagueScore(
  league: string | null,
  leagueWeights: Record<string, number>,
): number {
  if (!league) return 5; // Fallback para partidos sin liga definida

  // Búsqueda exacta
  if (league in leagueWeights) {
    return leagueWeights[league];
  }

  // Búsqueda case-insensitive
  const normalizedLeague = league.toLowerCase();
  for (const [key, value] of Object.entries(leagueWeights)) {
    if (key.toLowerCase() === normalizedLeague) {
      return value;
    }
  }

  // Fallback: valor base 5
  return 5;
}

/**
 * Calcula el bonus de cercanía usando decaimiento exponencial.
 * Partidos más cercanos obtienen mayor score.
 * 
 * Fórmula: score = maxScore × (decayFactor ^ daysUntilMatch)
 * 
 * @param daysUntilMatch - Días hasta el partido (0 = hoy)
 * @param decayFactor - Factor de decaimiento (0-1)
 * @param maxScore - Score máximo posible (default: 10)
 * @returns Score de cercanía (0-10)
 */
function calculateRecencyScore(
  daysUntilMatch: number,
  decayFactor: number,
  maxScore: number = 10,
): number {
  // Partido hoy o pasado: score máximo
  if (daysUntilMatch <= 0) return maxScore;

  // Caída exponencial
  const score = maxScore * Math.pow(decayFactor, daysUntilMatch);

  // Redondear a 1 decimal para legibilidad
  return Math.round(score * 10) / 10;
}

/**
 * Calcula el score basado en el estado del partido.
 * Solo los partidos programados son elegibles para predicciones.
 * 
 * @param status - Estado del partido
 * @returns Score de estado (0-10)
 */
function calculateStatusScore(status: Match['status']): number {
  switch (status) {
    case 'scheduled':
      return 10; // Máximo: se puede predecir
    case 'live':
      return 3;  // Bajo: ya comenzó, predicciones bloqueadas
    case 'finished':
      return 0;  // Mínimo: ya terminó
    default:
      return 0;
  }
}

/**
 * Calcula el bonus de metadata (placeholder para futuro).
 * 
 * Actualmente retorna un valor base. En el futuro se puede
 * expandir para detectar:
 * - Derby/rivalidad clásica
 * - Ronda eliminatoria vs fase de grupos
 * - Partido de definición de campeonato
 * - Presencia de estrellas mediáticas
 * 
 * @param match - Partido a evaluar
 * @returns Score de metadata (0-10)
 */
function calculateMetadataScore(_match: Match): number {
  // TODO: Implementar detección de derby, ronda eliminatoria, etc.
  // Por ahora retorna valor base
  return 5;
}

/**
 * Clasifica un score total en un tier de relevancia.
 * 
 * @param totalScore - Score normalizado (0-10)
 * @returns Tier de relevancia
 */
function getTier(totalScore: number): RelevanceScore['tier'] {
  if (totalScore >= 8) return 'high';
  if (totalScore >= 5) return 'medium';
  return 'low';
}

// ──────────────────────────────────────────────────────────────────
//  FUNCIONES PRINCIPALES (EXPORTADAS)
// ──────────────────────────────────────────────────────────────────

/**
 * Calcula el score de relevancia para un partido individual.
 * 
 * Esta función es PURA (sin side effects) y determinista:
 * dada la misma entrada, siempre produce la misma salida.
 * 
 * @param match - Partido a evaluar
 * @param config - Configuración de la pre-lista
 * @returns Objeto RelevanceScore con el total y desglose
 * 
 * @example
 * ```typescript
 * const match = {
 *   league: 'Liga Argentina',
 *   match_date: '2026-07-20T20:00:00Z',
 *   status: 'scheduled',
 *   // ... otros campos
 * };
 * 
 * const score = calculateRelevanceScore(match, DEFAULT_PRELISTA_CONFIG);
 * // { total: 8.2, breakdown: { league: 8, recency: 9.2, status: 10, metadata: 5 }, tier: 'high' }
 * ```
 */
export function calculateRelevanceScore(
  match: Match,
  config: PrelistaConfig,
): RelevanceScore {
  const now = new Date();
  const matchDate = new Date(match.match_date);

  // Calcular días hasta el partido (puede ser negativo si ya pasó)
  const diffMs = matchDate.getTime() - now.getTime();
  const daysUntilMatch = Math.max(0, diffMs / (1000 * 60 * 60 * 24));

  // 1. Score de liga (0-10)
  const leagueScore = getLeagueScore(match.league, config.leagueWeights);

  // 2. Score de cercanía (0-10)
  const recencyScore = calculateRecencyScore(
    daysUntilMatch,
    config.decayFactor,
  );

  // 3. Score de estado (0-10)
  const statusScore = calculateStatusScore(match.status);

  // 4. Score de metadata (0-10)
  const metadataScore = calculateMetadataScore(match);

  // Calcular total ponderado
  const total =
    leagueScore * config.weights.league +
    recencyScore * config.weights.recency +
    statusScore * config.weights.status +
    metadataScore * config.weights.metadata;

  // Normalizar a rango 0-10 y redondear a 1 decimal
  const normalizedTotal = Math.round(Math.min(10, Math.max(0, total)) * 10) / 10;

  return {
    total: normalizedTotal,
    breakdown: {
      league: leagueScore,
      recency: recencyScore,
      status: statusScore,
      metadata: metadataScore,
    },
    tier: getTier(normalizedTotal),
  };
}

/**
 * Calcula los días restantes hasta un partido.
 * 
 * @param matchDate - Fecha del partido (ISO string o Date)
 * @returns Número de días (0 = hoy, 1 = mañana, etc.)
 */
export function getDaysUntilMatch(matchDate: string | Date): number {
  const now = new Date();
  const match = new Date(matchDate);

  // Normalizar a inicio de día para comparación justa
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const matchDay = new Date(
    match.getFullYear(),
    match.getMonth(),
    match.getDate(),
  );

  const diffMs = matchDay.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Filtra partidos por rango de días y los rankea por relevancia.
 * 
 * Función principal del módulo. Combina:
 * 1. Filtrado por fecha (hoy a T+N días)
 * 2. Cálculo de score de relevancia para cada partido
 * 3. Ordenamiento descendente por score
 * 4. Truncamiento al máximo configurado
 * 
 * @param matches - Lista de partidos desde la DB
 * @param config - Configuración de la pre-lista
 * @returns Lista rankeada de partidos con relevancia calculada
 * 
 * @example
 * ```typescript
 * const allMatches = await matchService.getUpcoming(100);
 * const prelista = filterAndRankMatches(allMatches, DEFAULT_PRELISTA_CONFIG);
 * // → Los 10 partidos más relevantes de los próximos 7 días
 * ```
 */
export function filterAndRankMatches(
  matches: Match[],
  config: PrelistaConfig,
): MatchWithRelevance[] {
  const now = new Date();

  // Calcular fecha límite (T + daysAhead)
  const toDate = new Date(now);
  toDate.setDate(toDate.getDate() + config.daysAhead);

  // 1. Filtrar: solo partidos dentro del rango temporal y programados
  const filtered = matches.filter((match) => {
    const matchDate = new Date(match.match_date);
    return matchDate >= now && matchDate <= toDate && match.status === 'scheduled';
  });

  // 2. Calcular relevancia para cada partido
  const withRelevance: MatchWithRelevance[] = filtered.map((match) => {
    const relevance = calculateRelevanceScore(match, config);
    const daysUntilMatch = getDaysUntilMatch(match.match_date);

    return {
      ...match,
      relevance,
      position: 0, // Se asigna después del ordenamiento
      daysUntilMatch,
    };
  });

  // 3. Ordenar por score de relevancia (descendente)
  withRelevance.sort((a, b) => b.relevance.total - a.relevance.total);

  // 4. Asignar posiciones (1-based)
  const ranked = withRelevance.map((match, index) => ({
    ...match,
    position: index + 1,
  }));

  // 5. Truncar al máximo configurado
  return ranked.slice(0, config.maxMatches);
}

/**
 * Obtiene el label legible de un tier de relevancia.
 * 
 * @param tier - Tier de relevancia
 * @returns Texto descriptivo del tier
 */
export function getTierLabel(tier: RelevanceScore['tier']): string {
  switch (tier) {
    case 'high':
      return 'Alta';
    case 'medium':
      return 'Media';
    case 'low':
      return 'Baja';
    default:
      return 'Desconocido';
  }
}

/**
 * Obtiene el color asociado a un tier de relevancia.
 * Retorna valores de color compatibles con Tailwind/NativeWind.
 * 
 * @param tier - Tier de relevancia
 * @returns Clase de color de fondo
 */
export function getTierColor(tier: RelevanceScore['tier']): string {
  switch (tier) {
    case 'high':
      return 'bg-emerald-500';    // Verde brillante
    case 'medium':
      return 'bg-amber-500';      // Amarillo/naranja
    case 'low':
      return 'bg-slate-400';      // Gris neutro
    default:
      return 'bg-slate-300';
  }
}

/**
 * Formatea el score para display.
 * 
 * @param score - Score numérico (0-10)
 * @returns String formateado (ej: "7.8")
 */
export function formatScore(score: number): string {
  return score.toFixed(1);
}
