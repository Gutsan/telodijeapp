import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Card, Badge } from '../ui';

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  league: string | null;
  match_date: string;
  status: 'scheduled' | 'live' | 'finished';
  home_score: number | null;
  away_score: number | null;
}

interface Prediction {
  home_score_prediction: number;
  away_score_prediction: number;
}

interface CardPartidoProps {
  match: Match;
  prediction?: Prediction;
  onPredictionChange?: (matchId: string, field: 'home' | 'away', value: string) => void;
  showInputs?: boolean;
  compact?: boolean;
}

// Deadline: 5 minutes before match
const DEADLINE_MINUTES = 5;

export function CardPartido({
  match,
  prediction,
  onPredictionChange,
  showInputs = true,
  compact = false,
}: CardPartidoProps) {
  const isFinished = match.status === 'finished';
  const isLive = match.status === 'live';
  const isScheduled = match.status === 'scheduled';

  // Check if match is within deadline (less than 5 minutes to start)
  const matchTime = new Date(match.match_date).getTime();
  const now = Date.now();
  const fiveMinutes = DEADLINE_MINUTES * 60 * 1000;
  const isWithinDeadline = matchTime - now <= fiveMinutes;
  
  // Can only predict if scheduled and not within deadline
  const canPredict = isScheduled && !isWithinDeadline;

  const getStatusBadge = () => {
    if (isWithinDeadline && isScheduled) {
      return { label: 'Cerrando', variant: 'warning' as const };
    }
    
    switch (match.status) {
      case 'finished':
        return { label: 'Finalizado', variant: 'default' as const };
      case 'live':
        return { label: 'En Vivo', variant: 'error' as const };
      case 'scheduled':
        return { label: 'Programado', variant: 'success' as const };
      default:
        return { label: match.status, variant: 'default' as const };
    }
  };

  const statusBadge = getStatusBadge();

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

  const getTimeUntilMatch = () => {
    const diff = matchTime - now;
    if (diff <= 0) return 'Ya comenzó';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (compact) {
    return (
      <Card className="mb-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-xs text-gray-500">{match.league || 'Fútbol'}</Text>
            <Text className="font-medium text-gray-900" numberOfLines={1}>
              {match.home_team} vs {match.away_team}
            </Text>
          </View>
          
          {isFinished ? (
            <Text className="text-lg font-bold text-primary-600">
              {match.home_score} - {match.away_score}
            </Text>
          ) : (
            <Badge label={statusBadge.label} variant={statusBadge.variant} size="sm" />
          )}
        </View>
      </Card>
    );
  }

  return (
    <Card className={`mb-3 ${isWithinDeadline && isScheduled ? 'border border-yellow-300' : ''}`}>
      {/* Header: League and Status */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-xs text-gray-500">
          {match.league || 'Fútbol'}
        </Text>
        <View className="flex-row items-center">
          {isScheduled && !isWithinDeadline && (
            <Text className="text-xs text-gray-500 mr-2">
              ⏰ {getTimeUntilMatch()}
            </Text>
          )}
          <Badge label={statusBadge.label} variant={statusBadge.variant} size="sm" />
        </View>
      </View>

      {/* Teams and Score */}
      <View className="flex-row items-center justify-between mb-3">
        {/* Home Team */}
        <View className="flex-1 items-center">
          <Text className="font-semibold text-gray-900 text-center" numberOfLines={1}>
            {match.home_team}
          </Text>
          {isFinished && (
            <Text className="text-3xl font-bold text-primary-600 mt-1">
              {match.home_score}
            </Text>
          )}
        </View>

        {/* VS / Score */}
        <View className="px-4 items-center">
          {isFinished ? (
            <Text className="text-gray-400 font-bold">-</Text>
          ) : (
            <Text className="text-gray-400 font-bold">VS</Text>
          )}
        </View>

        {/* Away Team */}
        <View className="flex-1 items-center">
          <Text className="font-semibold text-gray-900 text-center" numberOfLines={1}>
            {match.away_team}
          </Text>
          {isFinished && (
            <Text className="text-3xl font-bold text-primary-600 mt-1">
              {match.away_score}
            </Text>
          )}
        </View>
      </View>

      {/* Match Date */}
      <Text className="text-xs text-gray-500 text-center mb-3">
        {formatDate(match.match_date)}
      </Text>

      {/* Deadline Warning */}
      {isWithinDeadline && isScheduled && (
        <View className="bg-yellow-50 p-2 rounded-lg mb-3">
          <Text className="text-xs text-yellow-700 text-center">
            ⚠️ Las predicciones se cerraron {DEADLINE_MINUTES} minutos antes del partido
          </Text>
        </View>
      )}

      {/* Prediction Inputs */}
      {showInputs && isScheduled && (
        <View className="flex-row items-center justify-center pt-3 border-t border-gray-100">
          <View className="flex-1 items-center">
            <Text className="text-xs text-gray-500 mb-1">Local</Text>
            <TextInput
              className={`w-16 h-12 text-center text-lg font-bold rounded-lg ${
                canPredict ? 'bg-gray-100' : 'bg-gray-200'
              }`}
              value={prediction?.home_score_prediction?.toString() || '0'}
              onChangeText={(value) => canPredict && onPredictionChange?.(match.id, 'home', value)}
              keyboardType="numeric"
              maxLength={2}
              editable={canPredict}
            />
          </View>

          <View className="px-4">
            <Text className="text-gray-400 font-bold">-</Text>
          </View>

          <View className="flex-1 items-center">
            <Text className="text-xs text-gray-500 mb-1">Visitante</Text>
            <TextInput
              className={`w-16 h-12 text-center text-lg font-bold rounded-lg ${
                canPredict ? 'bg-gray-100' : 'bg-gray-200'
              }`}
              value={prediction?.away_score_prediction?.toString() || '0'}
              onChangeText={(value) => canPredict && onPredictionChange?.(match.id, 'away', value)}
              keyboardType="numeric"
              maxLength={2}
              editable={canPredict}
            />
          </View>
        </View>
      )}

      {/* Show User Prediction if Finished */}
      {isFinished && prediction && (
        <View className="pt-3 border-t border-gray-100">
          <Text className="text-xs text-gray-500 text-center">
            Tu pronóstico: {prediction.home_score_prediction} - {prediction.away_score_prediction}
          </Text>
        </View>
      )}
    </Card>
  );
}
