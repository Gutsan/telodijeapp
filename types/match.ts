// Match types
export interface Match {
  id: string;
  external_id: string | null;
  home_team: string;
  away_team: string;
  league: string | null;
  match_date: string;
  status: 'scheduled' | 'live' | 'finished';
  home_score: number | null;
  away_score: number | null;
  created_at: string;
}

export type MatchInsert = Omit<Match, 'id' | 'created_at'>;
export type MatchUpdate = Partial<Omit<Match, 'id' | 'created_at'>>;

// ──────────────────────────────────────────────────────────────────
//  PRE-LISTA TYPES
// ──────────────────────────────────────────────────────────────────

/**
 * Pesos para cada factor del algoritmo de scoring de relevancia.
 * La suma de todos los valores debe ser 1.0.
 */
export interface ScoringWeights {
  /** Peso de la importancia de la liga/torneo (0-1) */
  league: number;
  /** Peso de la cercanía del partido en el tiempo (0-1) */
  recency: number;
  /** Peso del estado actual del partido (0-1) */
  status: number;
  /** Peso de datos extra: derby, ronda eliminatoria, etc. (0-1) */
  metadata: number;
}

/**
 * Mapa de nombres de ligas a su ponderación de popularidad (1-10).
 * Clave: nombre exacto de la liga (como aparece en la DB).
 * Valor: puntuación de popularidad (1=mínima, 10=máxima).
 * 
 * Las ligas no presentes en el mapa reciben un valor fallback (default: 5).
 */
export type LeagueWeights = Record<string, number>;

/**
 * Configuración parametrizable del sistema de Pre-lista.
 * 
 * Controla el comportamiento del filtrado, ordenamiento y truncamiento
 * de partidos para generar la lista destacada semanal.
 */
export interface PrelistaConfig {
  /** Número de días hacia adelante para filtrar partidos (desde hoy) */
  daysAhead: number;

  /** Máximo número de partidos a incluir en la pre-lista */
  maxMatches: number;

  /** Pesos para cada factor del algoritmo de scoring */
  weights: ScoringWeights;

  /** Mapa de ligas a su ponderación de popularidad */
  leagueWeights: LeagueWeights;

  /** Factor de decaimiento exponencial por día de distancia (0-1) */
  decayFactor: number;
}

/**
 * Resultado del cálculo de scoring de relevancia para un partido.
 * Se adjunta a cada `Match` para crear un `MatchWithRelevance`.
 */
export interface RelevanceScore {
  /** Puntuación total de relevancia (0-10, normalizada) */
  total: number;

  /** Desglose por factor (valores individuales antes de aplicar pesos) */
  breakdown: {
    /** Score del factor de liga (0-10) */
    league: number;
    /** Score del factor de cercanía (0-10) */
    recency: number;
    /** Score del factor de estado (0-10) */
    status: number;
    /** Score del factor de metadata (0-10) */
    metadata: number;
  };

  /** Nivel de relevancia pre-calculado para UI */
  tier: 'high' | 'medium' | 'low';
}

/**
 * Extensión de `Match` con información de relevancia calculada.
 * Usado por la pre-lista para mostrar partidos rankeados.
 */
export interface MatchWithRelevance extends Match {
  /** Puntuación de relevancia calculada */
  relevance: RelevanceScore;

  /** Posición en la pre-lista (1 = más relevante) */
  position: number;

  /** Días restantes hasta el partido (0 = hoy) */
  daysUntilMatch: number;
}

/**
 * Resultado completo de la consulta de pre-lista.
 * Incluye los partidos rankeados y metadatos de la consulta.
 */
export interface PrelistaResult {
  /** Partidos ordenados por relevancia (máximo `config.maxMatches`) */
  matches: MatchWithRelevance[];

  /** Fecha de inicio del filtro (ISO string) */
  fromDate: string;

  /** Fecha de fin del filtro (ISO string) */
  toDate: string;

  /** Número total de partidos encontrados antes del truncamiento */
  totalFound: number;

  /** Configuración utilizada para esta consulta */
  config: PrelistaConfig;
}
