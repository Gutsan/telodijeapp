import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useQuinielas } from '../../hooks/useQuinielas';
import { Card, Button, Input } from '../../components/ui';
import { PrelistaCard } from '../../components/quiniela/PrelistaCard';
import { usePrelista } from '../../hooks/usePrelista';
import { matchService } from '../../services/match.service';
import { generateInviteCode } from '../../utils/quiniela';

interface ScheduledMatch {
  id: string;
  home_team: string;
  away_team: string;
  league: string | null;
  match_date: string;
  status: string;
}

export default function CreateQuinielaScreen() {
  const { user } = useAuthStore();
  const { createQuiniela } = useQuinielas();
  const [step, setStep] = useState(1); // 1: info, 2: select matches
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('10');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState('');

  // Match selection state
  const [availableMatches, setAvailableMatches] = useState<ScheduledMatch[]>([]);
  const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(new Set());
  const [matchSearch, setMatchSearch] = useState('');
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Pre-lista for featured matches
  const { matches: prelistaMatches, loading: prelistaLoading } = usePrelista();

  useEffect(() => {
    if (step === 2) loadMatches();
  }, [step]);

  const loadMatches = async () => {
    setLoadingMatches(true);
    const matches = await matchService.getScheduledForSelection();
    setAvailableMatches(matches);
    setLoadingMatches(false);
  };

  const filteredMatches = availableMatches.filter((m) => {
    if (!matchSearch) return true;
    const q = matchSearch.toLowerCase();
    return (
      m.home_team?.toLowerCase().includes(q) ||
      m.away_team?.toLowerCase().includes(q) ||
      m.league?.toLowerCase().includes(q)
    );
  });

  const toggleMatch = (matchId: string) => {
    setSelectedMatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(matchId)) {
        next.delete(matchId);
      } else {
        next.add(matchId);
      }
      return next;
    });
  };

  const handleNextStep = () => {
    setErrorMessage('');
    if (!name.trim()) {
      setErrorMessage('Por favor ingresa un nombre para la quiniela');
      return;
    }
    setStep(2);
  };

  const handleCreate = async () => {
    setErrorMessage('');
    if (!user) return;

    setLoading(true);
    try {
      const inviteCode = generateInviteCode();

      const { data: newQuiniela, error: createError } = await createQuiniela({
        name: name.trim(),
        description: description.trim() || null,
        created_by: user.id,
        is_private: true,
        max_players: parseInt(maxPlayers) || 10,
        invite_code: inviteCode,
      });

      if (newQuiniela && selectedMatchIds.size > 0) {
        // Link selected matches
        await matchService.linkMultipleToQuiniela(
          [...selectedMatchIds],
          newQuiniela.id
        );
      }

      if (newQuiniela) {
        setCreatedId(newQuiniela.id);
        setCreatedCode(inviteCode);
        setSuccessMessage(`Quiniela "${name}" creada con ${selectedMatchIds.size} partidos`);
      } else {
        setErrorMessage(createError || 'No se pudo crear la quiniela');
      }
    } catch (error) {
      setErrorMessage('Ocurrió un error al crear la quiniela');
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (createdId) {
    return (
      <ScrollView className="flex-1 bg-gray-50">
        <View className="p-4">
          <Card className="mb-4">
            <View className="items-center py-6">
              <Text className="text-5xl mb-4">🎉</Text>
              <Text className="text-xl font-bold text-gray-900 mb-2">¡Quiniela Creada!</Text>
              <Text className="text-gray-500 text-center mb-4">{successMessage}</Text>
              <View className="bg-gray-50 p-4 rounded-lg w-full mb-6">
                <Text className="text-sm text-gray-600 mb-2 text-center">Código de invitación:</Text>
                <Text className="text-3xl font-bold text-primary-600 text-center font-mono">{createdCode}</Text>
              </View>
              <Button title="Ver Quiniela" onPress={() => router.push(`/quiniela/${createdId}`)} fullWidth />
              <View className="mt-3 w-full">
                <Button title="Volver al Inicio" onPress={() => router.replace('/(tabs)')} variant="outline" fullWidth />
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Progress */}
        <View className="flex-row mb-4">
          <View className={`flex-1 h-1 rounded-full mr-1 ${step >= 1 ? 'bg-primary-500' : 'bg-gray-200'}`} />
          <View className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-primary-500' : 'bg-gray-200'}`} />
        </View>

        {/* Error */}
        {errorMessage ? (
          <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <Text className="text-red-600 text-sm text-center">{errorMessage}</Text>
          </View>
        ) : null}

        {/* STEP 1: Info */}
        {step === 1 && (
          <>
            <Card className="mb-4">
              <View className="flex-row items-center mb-4">
                <Text className="text-3xl mr-3">➕</Text>
                <View>
                  <Text className="text-xl font-bold text-gray-900">Crear Quiniela</Text>
                  <Text className="text-gray-500">Paso 1 de 2: Información</Text>
                </View>
              </View>
              <Input label="Nombre *" placeholder="Ej: Amigos del Fútbol" value={name} onChangeText={(t) => { setName(t); setErrorMessage(''); }} leftIcon={<Text>📝</Text>} />
              <Input label="Descripción" placeholder="Opcional" value={description} onChangeText={setDescription} leftIcon={<Text>📋</Text>} />
              <Input label="Máximo jugadores" placeholder="10" value={maxPlayers} onChangeText={setMaxPlayers} type="number" leftIcon={<Text>👥</Text>} />
            </Card>
            <Button title="Siguiente: Seleccionar Partidos →" onPress={handleNextStep} fullWidth />
          </>
        )}

        {/* STEP 2: Select Matches */}
        {step === 2 && (
          <>
            <Card className="mb-4">
              <View className="flex-row items-center mb-4">
                <Text className="text-3xl mr-3">⚽</Text>
                <View>
                  <Text className="text-xl font-bold text-gray-900">Seleccionar Partidos</Text>
                  <Text className="text-gray-500">Paso 2 de 2: Elige los partidos (puedes saltar este paso)</Text>
                </View>
              </View>

              {/* Featured Matches (Pre-lista) */}
              {!prelistaLoading && prelistaMatches.length > 0 && (
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    🎯 Partidos Destacados
                  </Text>
                  <Text className="text-xs text-gray-500 mb-3">
                    Los más relevantes de esta semana
                  </Text>
                  {prelistaMatches.slice(0, 5).map((match) => {
                    const isSelected = selectedMatchIds.has(match.id);
                    return (
                      <TouchableOpacity
                        key={match.id}
                        onPress={() => toggleMatch(match.id)}
                        className={`p-3 rounded-lg mb-2 border ${
                          isSelected ? 'bg-primary-50 border-primary-300' : 'bg-white border-gray-200'
                        }`}
                      >
                        <View className="flex-row items-center">
                          {/* Relevance Badge */}
                          <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                            match.relevance.tier === 'high' ? 'bg-emerald-500' :
                            match.relevance.tier === 'medium' ? 'bg-amber-500' : 'bg-slate-400'
                          }`}>
                            <Text className="text-white font-bold text-xs">
                              {match.position}
                            </Text>
                          </View>

                          {/* Match Info */}
                          <View className="flex-1">
                            <Text className="text-xs text-gray-500">{match.league || 'Fútbol'}</Text>
                            <Text className="font-medium text-gray-900 text-sm">
                              {match.home_team} vs {match.away_team}
                            </Text>
                            <Text className="text-xs text-gray-400">
                              {new Date(match.match_date).toLocaleDateString('es-ES', {
                                weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                              })}
                            </Text>
                          </View>

                          {/* Score + Checkbox */}
                          <View className="items-end">
                            <Text className="text-lg font-bold text-gray-900">
                              {match.relevance.total.toFixed(1)}
                            </Text>
                            <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                              isSelected ? 'bg-primary-500 border-primary-500' : 'border-gray-300'
                            }`}>
                              {isSelected && <Text className="text-white text-xs font-bold">✓</Text>}
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Divider */}
              <View className="flex-row items-center my-3">
                <View className="flex-1 h-px bg-gray-200" />
                <Text className="px-3 text-xs text-gray-500">Todos los partidos</Text>
                <View className="flex-1 h-px bg-gray-200" />
              </View>

              {/* Search */}
              <Input
                placeholder="Buscar por equipo o liga..."
                value={matchSearch}
                onChangeText={setMatchSearch}
                leftIcon={<Text>🔍</Text>}
              />

              <Text className="text-sm text-gray-500 mt-2 mb-3">
                {selectedMatchIds.size} partido{selectedMatchIds.size !== 1 ? 's' : ''} seleccionado{selectedMatchIds.size !== 1 ? 's' : ''}
              </Text>

              {loadingMatches ? (
                <Text className="text-center text-gray-500 py-8">Cargando partidos...</Text>
              ) : filteredMatches.length > 0 ? (
                filteredMatches.slice(0, 30).map((match) => {
                  const isSelected = selectedMatchIds.has(match.id);
                  return (
                    <TouchableOpacity
                      key={match.id}
                      onPress={() => toggleMatch(match.id)}
                      className={`p-3 rounded-lg mb-2 border ${
                        isSelected ? 'bg-primary-50 border-primary-300' : 'bg-white border-gray-200'
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className="text-xs text-gray-500">{match.league || 'Fútbol'}</Text>
                          <Text className="font-medium text-gray-900 text-sm">
                            {match.home_team} vs {match.away_team}
                          </Text>
                          <Text className="text-xs text-gray-400">
                            {new Date(match.match_date).toLocaleDateString('es-ES', {
                              weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                            })}
                          </Text>
                        </View>
                        <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                          isSelected ? 'bg-primary-500 border-primary-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <Text className="text-white text-xs font-bold">✓</Text>}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text className="text-center text-gray-500 py-4">No hay partidos disponibles</Text>
              )}
            </Card>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button title="← Atrás" onPress={() => setStep(1)} variant="outline" fullWidth />
              </View>
              <View className="flex-2">
                <Button
                  title={`Crear Quiniela${selectedMatchIds.size > 0 ? ` (${selectedMatchIds.size} partidos)` : ''}`}
                  onPress={handleCreate}
                  loading={loading}
                  fullWidth
                />
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}
