import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Card, Button, Badge, Input, Loading, EmptyState, Modal } from '../../components/ui';
import { matchService } from '../../services/match.service';
import type { Match } from '../../types';

export default function AdminMatchesScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  
  // Form state
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [league, setLeague] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setLoading(true);
    const data = await matchService.getUpcoming(50);
    setMatches(data);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const handleCreateMatch = async () => {
    if (!homeTeam || !awayTeam || !matchDate) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    // TODO: Implement match creation via Edge Function
    Alert.alert('Info', 'Funcionalidad en desarrollo');
    setShowCreateModal(false);
    resetForm();
  };

  const handleUpdateScore = async (matchId: string) => {
    if (!homeScore || !awayScore) {
      Alert.alert('Error', 'Ingresa los goles de ambos equipos');
      return;
    }

    // TODO: Implement score update via Edge Function
    Alert.alert('Info', 'Funcionalidad en desarrollo');
    resetForm();
  };

  const resetForm = () => {
    setHomeTeam('');
    setAwayTeam('');
    setLeague('');
    setMatchDate('');
    setHomeScore('');
    setAwayScore('');
    setEditingMatch(null);
  };

  const openEditModal = (match: Match) => {
    setEditingMatch(match);
    setHomeTeam(match.home_team);
    setAwayTeam(match.away_team);
    setLeague(match.league || '');
    setHomeScore(match.home_score?.toString() || '');
    setAwayScore(match.away_score?.toString() || '');
    setShowCreateModal(true);
  };

  if (loading && !refreshing) {
    return <Loading fullScreen text="Cargando partidos..." />;
  }

  return (
    <ScrollView 
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-4">
        {/* Header */}
        <Card className="mb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-bold text-gray-900">
                Gestionar Partidos
              </Text>
              <Text className="text-gray-500">
                {matches.length} partidos registrados
              </Text>
            </View>
            <Button
              title="Crear"
              onPress={() => setShowCreateModal(true)}
              size="sm"
            />
          </View>
        </Card>

        {/* Matches List */}
        {matches.length > 0 ? (
          matches.map((match) => (
            <Card key={match.id} className="mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs text-gray-500">
                  {match.league || 'Sin liga'}
                </Text>
                <Badge
                  label={match.status === 'finished' ? 'Finalizado' : match.status === 'live' ? 'En Vivo' : 'Programado'}
                  variant={match.status === 'finished' ? 'default' : match.status === 'live' ? 'error' : 'success'}
                  size="sm"
                />
              </View>
              
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold text-gray-900 flex-1">
                  {match.home_team}
                </Text>
                {match.status === 'finished' ? (
                  <Text className="text-lg font-bold text-primary-600 mx-4">
                    {match.home_score} - {match.away_score}
                  </Text>
                ) : (
                  <Text className="text-gray-400 mx-4">VS</Text>
                )}
                <Text className="font-semibold text-gray-900 flex-1 text-right">
                  {match.away_team}
                </Text>
              </View>

              <Text className="text-xs text-gray-500 text-center mt-2">
                {new Date(match.match_date).toLocaleDateString('es-ES', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>

              <View className="flex-row justify-between mt-3 pt-3 border-t border-gray-100">
                <Button
                  title="Editar"
                  onPress={() => openEditModal(match)}
                  variant="outline"
                  size="sm"
                />
                {match.status === 'scheduled' && (
                  <Button
                    title="Actualizar Marcador"
                    onPress={() => {
                      setEditingMatch(match);
                      setHomeScore(match.home_score?.toString() || '');
                      setAwayScore(match.away_score?.toString() || '');
                    }}
                    variant="primary"
                    size="sm"
                  />
                )}
              </View>
            </Card>
          ))
        ) : (
          <EmptyState
            icon="⚽"
            title="No hay partidos"
            description="Crea el primer partido para empezar"
          />
        )}
      </View>

      {/* Create/Edit Modal */}
      <Modal
        visible={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title={editingMatch ? "Editar Partido" : "Crear Partido"}
      >
        <View>
          <Input
            label="Equipo Local *"
            placeholder="Ej: Real Madrid"
            value={homeTeam}
            onChangeText={setHomeTeam}
          />
          
          <Input
            label="Equipo Visitante *"
            placeholder="Ej: FC Barcelona"
            value={awayTeam}
            onChangeText={setAwayTeam}
          />
          
          <Input
            label="Liga"
            placeholder="Ej: La Liga"
            value={league}
            onChangeText={setLeague}
          />
          
          <Input
            label="Fecha del Partido *"
            placeholder="YYYY-MM-DD HH:MM"
            value={matchDate}
            onChangeText={setMatchDate}
          />

          {editingMatch && (
            <>
              <Input
                label="Goles Local"
                placeholder="0"
                value={homeScore}
                onChangeText={setHomeScore}
                type="number"
              />
              
              <Input
                label="Goles Visitante"
                placeholder="0"
                value={awayScore}
                onChangeText={setAwayScore}
                type="number"
              />
            </>
          )}

          <Button
            title={editingMatch ? "Guardar Cambios" : "Crear Partido"}
            onPress={editingMatch ? () => handleUpdateScore(editingMatch.id) : handleCreateMatch}
            fullWidth
          />
        </View>
      </Modal>
    </ScrollView>
  );
}
