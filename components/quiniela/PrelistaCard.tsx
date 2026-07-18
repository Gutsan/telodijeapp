/**
 * components/quiniela/PrelistaCard.tsx
 * 
 * Componente de card para partidos en la Pre-lista.
 * Extiende la CardPartido existente con:
 * - Badge de posición en la pre-lista (#1, #2, etc.)
 * - Indicador visual de nivel de relevancia (color)
 * - Score de relevancia visible
 * - Días restantes hasta el partido
 * 
 * @module components/quiniela/PrelistaCard
 * @version 1.0.0
 * 
 * @example
 * ```tsx
 * <PrelistaCard
 *   match={matchWithRelevance}
 *   onPress={() => navigateToMatch(match.id)}
 * />
 * ```
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Card, Badge } from '../ui';
import type { MatchWithRelevance } from '../../types';
import { getTierLabel, getTierColor, formatScore } from '../../utils/relevance';

// ──────────────────────────────────────────────────────────────────
//  PROPIEDADES
// ──────────────────────────────────────────────────────────────────

interface PrelistaCardProps {
  /** Partido con información de relevancia calculada */
  match: MatchWithRelevance;

  /** Callback al presionar la card (navegación al detalle) */
  onPress?: () => void;

  /** Si se muestran los inputs de predicción (default: false) */
  showInputs?: boolean;

  /** Si se muestra en modo compacto */
  compact?: boolean;
}

// ──────────────────────────────────────────────────────────────────
//  COMPONENTE
// ──────────────────────────────────────────────────────────────────

/**
 * Card de partido para la Pre-lista con indicadores de relevancia.
 * 
 * Muestra:
 * - Posición en la pre-lista (badge circular)
 * - Equipos y fecha/hora
 * - Liga y estado
 * - Score de relevancia y nivel (alta/media/baja)
 * - Días restantes hasta el partido
 */
export function PrelistaCard({
  match,
  onPress,
  showInputs = false,
  compact = false,
}: PrelistaCardProps) {
  const { relevance, position, daysUntilMatch } = match;

  // Colores del tier de relevancia
  const tierColor = getTierColor(relevance.tier);
  const tierLabel = getTierLabel(relevance.tier);

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Texto de días restantes
  const getDaysText = () => {
    if (daysUntilMatch === 0) return 'Hoy';
    if (daysUntilMatch === 1) return 'Mañana';
    return `En ${daysUntilMatch} días`;
  };

  // ──────────────────────────────────────────────────────────────
  //  MODO COMPACTO
  // ──────────────────────────────────────────────────────────────

  if (compact) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
        <Card className="mb-2">
          <View className="flex-row items-center">
            {/* Posición */}
            <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${tierColor}`}>
              <Text className="text-white font-bold text-sm">
                {position}
              </Text>
            </View>

            {/* Info del partido */}
            <View className="flex-1">
              <Text className="text-xs text-gray-500">{match.league || 'Fútbol'}</Text>
              <Text className="font-medium text-gray-900" numberOfLines={1}>
                {match.home_team} vs {match.away_team}
              </Text>
            </View>

            {/* Score de relevancia */}
            <View className="items-end">
              <Text className="text-lg font-bold text-gray-900">
                {formatScore(relevance.total)}
              </Text>
              <Text className="text-xs text-gray-500">{getDaysText()}</Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  }

  // ──────────────────────────────────────────────────────────────
  //  MODO COMPLETO
  // ──────────────────────────────────────────────────────────────

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Card className="mb-3">
        {/* Header: Posición + Liga + Score */}
        <View className="flex-row items-center justify-between mb-3">
          {/* Badge de posición */}
          <View className={`w-10 h-10 rounded-full items-center justify-center ${tierColor}`}>
            <Text className="text-white font-bold text-lg">
              {position}
            </Text>
          </View>

          {/* Liga */}
          <View className="flex-1 mx-3">
            <Text className="text-xs text-gray-500">
              {match.league || 'Fútbol'}
            </Text>
          </View>

          {/* Score de relevancia */}
          <View className="items-end">
            <Text className="text-xl font-bold text-gray-900">
              {formatScore(relevance.total)}
            </Text>
            <Badge
              label={tierLabel}
              variant={
                relevance.tier === 'high'
                  ? 'success'
                  : relevance.tier === 'medium'
                  ? 'warning'
                  : 'default'
              }
              size="sm"
            />
          </View>
        </View>

        {/* Equipos */}
        <View className="flex-row items-center justify-between mb-3">
          {/* Local */}
          <View className="flex-1 items-center">
            <Text className="font-semibold text-gray-900 text-center" numberOfLines={1}>
              {match.home_team}
            </Text>
          </View>

          {/* VS */}
          <View className="px-4 items-center">
            <Text className="text-gray-400 font-bold">VS</Text>
          </View>

          {/* Visitante */}
          <View className="flex-1 items-center">
            <Text className="font-semibold text-gray-900 text-center" numberOfLines={1}>
              {match.away_team}
            </Text>
          </View>
        </View>

        {/* Footer: Fecha + Días restantes + Desglose */}
        <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
          {/* Fecha */}
          <Text className="text-xs text-gray-500">
            {formatDate(match.match_date)}
          </Text>

          {/* Días restantes */}
          <View className="flex-row items-center">
            <Text className="text-xs text-gray-500 mr-2">
              {getDaysText()}
            </Text>
            <View className={`px-2 py-0.5 rounded ${tierColor}`}>
              <Text className="text-xs text-white font-medium">
                #{position}
              </Text>
            </View>
          </View>
        </View>

        {/* Desglose de scores (debug/preview) */}
        {__DEV__ && (
          <View className="mt-2 pt-2 border-t border-gray-50">
            <Text className="text-[10px] text-gray-400 text-center">
              Liga: {formatScore(relevance.breakdown.league)} | 
              Cercanía: {formatScore(relevance.breakdown.recency)} | 
              Estado: {formatScore(relevance.breakdown.status)} | 
              Meta: {formatScore(relevance.breakdown.metadata)}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}
