/**
 * constants/prelista.ts
 * 
 * Configuración parametrizable para la "Pre-lista" de partidos.
 * Controla el filtrado temporal, límite de resultados, pesos del algoritmo
 * de relevancia y ponderación por liga/torneo.
 * 
 * @module constants/prelista
 * @version 1.0.0
 */

import type { PrelistaConfig } from '../types/match';

// ──────────────────────────────────────────────────────────────────
//  CONFIGURACIÓN POR DEFECTO
// ──────────────────────────────────────────────────────────────────

/**
 * Configuración por defecto del sistema de Pre-lista.
 * 
 * Parámetros:
 * - daysAhead: 7 → Filtra partidos desde hoy hasta T+7
 * - maxMatches: 10 → Límite estricto de partidos en la pre-lista
 * - weights: Distribución porcentual de los factores de scoring
 * - leagueWeights: Puntuación base por nombre de liga (1-10)
 * - decayFactor: Factor de decaimiento exponencial por día de cercanía
 */
export const DEFAULT_PRELISTA_CONFIG: PrelistaConfig = {
  /** Número de días hacia adelante para filtrar partidos */
  daysAhead: 7,

  /** Máximo número de partidos a mostrar en la pre-lista */
  maxMatches: 10,

  /**
   * Pesos para cada factor del algoritmo de scoring.
   * La suma debe ser 1.0 para normalización correcta.
   */
  weights: {
    /** Importancia de la liga/torneo (40%) */
    league: 0.40,
    /** Cercanía del partido en el tiempo (35%) */
    recency: 0.35,
    /** Estado actual del partido (15%) */
    status: 0.15,
    /** Datos extra: derby, ronda eliminatoria, etc. (10%) */
    metadata: 0.10,
  },

  /**
   * Ponderación de ligas por nombre (escala 1-10).
   * Ligas no listadas reciben un valor fallback de 5.
   * 
   * Estos valores representan la "popularidad percibida" de cada liga
   * desde la perspectiva de usuarioshispanohablantes (target de Telodije).
   */
  leagueWeights: {
    // 🏆 Competiciones internacionales
    'Copa Libertadores': 10,
    'Copa América': 10,
    'Champions League': 10,
    'UEFA Champions League': 10,
    'Europa League': 9,
    'UEFA Europa League': 9,
    'Copa del Mundo': 10,
    'World Cup': 10,
    'Mundial de Clubes': 9,
    'FIFA Club World Cup': 9,

    // 🇪🇺 Ligas Top Europeas
    'Premier League': 9,
    'LaLiga': 9,
    'La Liga': 9,
    'Serie A': 8,
    'Bundesliga': 8,
    'Ligue 1': 7,

    // 🌎 Ligas Sudamericanas
    'Liga Argentina': 8,
    'Liga Profesional Argentina': 8,
    'Liga Profesional': 8,
    'Brasileirão': 8,
    'Brasileirão Série A': 8,
    'Liga MX': 8,
    'Liga BetPlay': 7,
    'Liga Ecuador': 7,
    'Liga 1 Perú': 6,
    'Liga Chile': 6,
    'Liga Uruguay': 6,
    'Liga Paraguaya': 5,

    // 🏟️ Otras competiciones
    'Copa Sudamericana': 8,
    'CONCACAF Champions League': 7,
    'Copa MX': 6,
  },

  /**
   * Factor de decaimiento exponencial para el bonus de cercanía.
   * Un valor de 0.85 significa que cada día de distancia reduce
   * el bonus un 15%.
   * 
   * Fórmula: recencyBonus = maxScore × (decayFactor ^ daysUntilMatch)
   * 
   * - Partido hoy: 10 × (0.85^0) = 10
   * - Partido mañana: 10 × (0.85^1) = 8.5
   * - Partido en 3 días: 10 × (0.85^3) = 6.14
   * - Partido en 7 días: 10 × (0.85^7) = 3.20
   */
  decayFactor: 0.85,
};

// ──────────────────────────────────────────────────────────────────
//  PESOS DEL ALGORITMO (para display/UI)
// ──────────────────────────────────────────────────────────────────

/**
 * Descripción legible de cada factor de scoring.
 * Útil para tooltips o explicaciones en la UI.
 */
export const SCORING_FACTOR_DESCRIPTIONS: Record<string, string> = {
  league: 'Importancia de la liga o torneo',
  recency: 'Cercanía del partido en el tiempo',
  status: 'Estado actual del partido (programado, en vivo, etc.)',
  metadata: 'Factores especiales (derby, ronda eliminatoria, etc.)',
};

/**
 * Rangos de score para clasificar visualmente la relevancia.
 * Usado por los componentes UI para colorear badges.
 */
export const RELEVANCE_TIERS = {
  /** Score >= 8: Alta relevancia → badge verde/dorado */
  HIGH: { min: 8, label: 'Alta', color: 'success' },
  /** Score >= 5: Relevancia media → badge amarillo/naranja */
  MEDIUM: { min: 5, label: 'Media', color: 'warning' },
  /** Score < 5: Baja relevancia → badge gris/azul */
  LOW: { min: 0, label: 'Baja', color: 'info' },
} as const;

// ──────────────────────────────────────────────────────────────────
//  MENSAJES DE UI
// ──────────────────────────────────────────────────────────────────

/**
 * Textos predefinidos para la sección de pre-lista.
 */
export const PRELISTA_UI = {
  /** Título de la sección */
  sectionTitle: '🎯 Partidos Destacados de la Semana',
  /** Subtítulo explicativo */
  sectionSubtitle: 'Los 10 encuentros más relevantes para predecir',
  /** Texto cuando no hay partidos */
  emptyState: 'No hay partidos programados para los próximos 7 días',
  /** Texto de carga */
  loadingText: 'Buscando los mejores partidos...',
  /** Texto del badge de posición */
  positionBadge: '#{position}',
  /** Texto del tooltip de relevancia */
  relevanceTooltip: 'Relevancia: {score}/10',
} as const;

// ──────────────────────────────────────────────────────────────────
//  AUTO-SYNC CONFIGURATION
// ──────────────────────────────────────────────────────────────────

/**
 * Intervalo en horas para considerar que el sync está desactualizado.
 * Si el último sync fue hace más de estas horas, se ejecuta uno nuevo.
 * 
 * Default: 24 horas (1 día)
 */
export const AUTO_SYNC_INTERVAL_HOURS = 24;

/**
 * Textos de UI para el auto-sync
 */
export const AUTO_SYNC_UI = {
  /** Texto mostrado mientras se sincronizan partidos */
  syncingText: 'Actualizando partidos...',
  /** Texto de éxito después del sync */
  successText: 'Partidos actualizados',
  /** Texto de error si el sync falla */
  errorText: 'No se pudieron actualizar los partidos',
} as const;
