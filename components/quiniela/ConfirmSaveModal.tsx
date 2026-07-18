import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Modal, Button, Badge } from '../ui';

interface PredictionSummary {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

interface ConfirmSaveModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  predictions: PredictionSummary[];
  loading?: boolean;
}

export function ConfirmSaveModal({
  visible,
  onClose,
  onConfirm,
  predictions,
  loading = false,
}: ConfirmSaveModalProps) {
  const getPredictionResult = (homeScore: number, awayScore: number) => {
    if (homeScore > awayScore) return { winner: 'Local', variant: 'primary' as const };
    if (homeScore < awayScore) return { winner: 'Visitante', variant: 'secondary' as const };
    return { winner: 'Empate', variant: 'default' as const };
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Confirmar Pronósticos"
      size="md"
    >
      <View>
        {/* Summary Header */}
        <View className="bg-gray-50 p-3 rounded-lg mb-4">
          <Text className="text-sm text-gray-600 text-center">
            Vas a guardar {predictions.length} pronóstico{predictions.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Predictions List */}
        <ScrollView className="max-h-64 mb-4">
          {predictions.map((prediction, index) => {
            const result = getPredictionResult(prediction.homeScore, prediction.awayScore);
            return (
              <View 
                key={prediction.matchId}
                className={`py-3 ${
                  index < predictions.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-xs text-gray-500">
                    {prediction.homeTeam}
                  </Text>
                  <Badge label={result.winner} variant={result.variant} size="sm" />
                  <Text className="text-xs text-gray-500">
                    {prediction.awayTeam}
                  </Text>
                </View>
                <View className="flex-row items-center justify-center">
                  <Text className="text-2xl font-bold text-primary-600">
                    {prediction.homeScore}
                  </Text>
                  <Text className="mx-3 text-gray-400">-</Text>
                  <Text className="text-2xl font-bold text-primary-600">
                    {prediction.awayScore}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Info */}
        <View className="bg-blue-50 p-3 rounded-lg mb-4">
          <Text className="text-xs text-blue-700 text-center">
            ℹ️ Los pronósticos se pueden modificar hasta 5 minutos antes del partido
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row space-x-3">
          <Button
            title="Cancelar"
            onPress={onClose}
            variant="outline"
            fullWidth
          />
          <Button
            title="Guardar"
            onPress={onConfirm}
            loading={loading}
            fullWidth
          />
        </View>
      </View>
    </Modal>
  );
}
