import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { Card, Button, Badge, Loading, EmptyState, Modal } from '../../../components/ui';
import { JoinRequestsCard } from '../../../components/quiniela/JoinRequestsCard';
import { supabase } from '../../../lib/supabase';
import { copyToClipboard, generateShareLink } from '../../../utils/share';

export default function QuinielaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [quiniela, setQuiniela] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState('');

  useEffect(() => {
    if (id) loadQuiniela();
  }, [id]);

  const loadQuiniela = async () => {
    if (!id) return;
    setLoading(true);

    // Load quiniela
    const { data: q } = await supabase.from('quinielas').select('*').eq('id', id).single();
    setQuiniela(q);

    // Load players WITH user names (JOIN)
    const { data: p } = await supabase
      .from('quiniela_players')
      .select(`
        id,
        quiniela_id,
        user_id,
        role,
        joined_at,
        user:users(full_name, avatar_url, email)
      `)
      .eq('quiniela_id', id);

    // For players missing profiles, try to create from available data
    const playersList = p || [];
    const missingPlayers = playersList.filter((pl: any) => !pl.user);
    
    for (const player of missingPlayers) {
      // Try to upsert a minimal profile using the user_id
      // This will work once the INSERT RLS policy (003) is applied
      const { error: upsertErr } = await supabase
        .from('users')
        .upsert({
          id: player.user_id,
          email: player.user_id + '@telodije.app',
          full_name: 'Jugador',
          plan_type: 'free',
        }, { onConflict: 'id' });
      
      if (!upsertErr) {
        player.user = { full_name: 'Jugador', avatar_url: null };
      }
    }

    setPlayers(playersList);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQuiniela();
    setRefreshing(false);
  };

  const showCopied = (msg: string) => {
    setCopiedMessage(msg);
    setTimeout(() => setCopiedMessage(''), 2000);
  };

  const handleCopyCode = async () => {
    if (quiniela?.invite_code) {
      await copyToClipboard(quiniela.invite_code);
      showCopied('Código copiado');
    }
  };

  const handleCopyLink = async () => {
    if (quiniela?.invite_code) {
      const link = generateShareLink(quiniela.invite_code);
      await copyToClipboard(link);
      showCopied('Enlace copiado');
    }
  };

  if (loading && !refreshing) {
    return <Loading fullScreen text="Cargando apuesta..." />;
  }

  if (!quiniela) {
    return (
      <EmptyState
        icon="🔍"
        title="Apuesta no encontrada"
        description="Esta apuesta no existe o fue eliminada"
        action={
          <Button
            title="Volver a apuestas"
            onPress={() => router.push('/(tabs)/quinielas')}
          />
        }
      />
    );
  }

  const isOwner = quiniela.created_by === user?.id;

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="p-4">
        {/* Copied toast */}
        {copiedMessage ? (
          <View className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
            <Text className="text-green-600 text-sm text-center">✅ {copiedMessage}</Text>
          </View>
        ) : null}

        {/* Header */}
        <Card className="mb-4">
          <View className="flex-row items-center mb-2">
            <Text className="text-3xl mr-3">{quiniela.is_private ? '🔒' : '🌍'}</Text>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900">{quiniela.name}</Text>
              <Text className="text-gray-500">{quiniela.description || 'Sin descripción'}</Text>
            </View>
          </View>
          <View className="flex-row items-center mt-3">
            <Badge label={quiniela.is_private ? 'Privada' : 'Pública'} variant={quiniela.is_private ? 'primary' : 'success'} />
            <View className="ml-3">
              <Badge label={`${players.length}/${quiniela.max_players} jugadores`} variant="default" />
            </View>
          </View>
        </Card>

        {/* Invite Section */}
        {isOwner && (
          <Card className="mb-4">
            <Text className="font-semibold text-gray-900 mb-3">Invitar Jugadores</Text>
            <View className="flex-row items-center justify-between mb-3 bg-gray-50 p-3 rounded-lg">
              <Text className="text-gray-600">Código:</Text>
              <Text className="font-mono text-lg font-bold text-primary-600">{quiniela.invite_code}</Text>
            </View>
            <View className="flex-row justify-between">
              <Button title="Copiar Código" onPress={handleCopyCode} variant="outline" size="sm" />
              <Button title="Copiar Enlace" onPress={handleCopyLink} variant="outline" size="sm" />
              <Button
                title="Compartir"
                onPress={async () => {
                  const link = generateShareLink(quiniela.invite_code);
                  const msg = `¡Únete a mi apuesta "${quiniela.name}" en Telodije!\n\nCódigo: ${quiniela.invite_code}\nEnlace: ${link}`;
                  if (typeof window !== 'undefined' && navigator.share) {
                    await navigator.share({ title: 'Telodije', text: msg });
                  } else {
                    await copyToClipboard(msg);
                    showCopied('Mensaje copiado');
                  }
                }}
                variant="primary"
                size="sm"
              />
            </View>
          </Card>
        )}

        {/* Players List */}
        <Card className="mb-4">
          <Text className="font-semibold text-gray-900 mb-3">Participantes ({players.length})</Text>
          {players.length > 0 ? (
            players.map((player, index) => (
              <View
                key={player.id}
                className={`flex-row items-center justify-between py-2 ${
                  index < players.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <View className="flex-row items-center">
                  <View className="w-8 h-8 bg-primary-100 rounded-full items-center justify-center mr-3">
                    <Text className="text-primary-600 font-medium">{index + 1}</Text>
                  </View>
                  <View>
                    <Text className="font-medium text-gray-900">
                      {player.user?.full_name || 'Jugador'}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {player.role === 'owner' ? 'Creador' : 'Jugador'}
                    </Text>
                  </View>
                </View>
                {player.role === 'owner' && <Badge label="Creador" variant="primary" size="sm" />}
              </View>
            ))
          ) : (
            <Text className="text-gray-500 text-center py-4">No hay participantes aún</Text>
          )}
        </Card>

        {/* Join Requests (owner only) */}
        {isOwner && (
          <JoinRequestsCard quinielaId={id!} onRequestHandled={loadQuiniela} />
        )}

        {/* Action Buttons */}
        <Button
          title="⚽ Jugar Apuesta"
          onPress={() => router.push(`/quiniela/${id}/predict`)}
          fullWidth
        />

        <View className="flex-row mt-3 mb-8 gap-3">
          <View className="flex-1">
            <Button
              title="🏆 Ver Ranking"
              onPress={() => router.push(`/quiniela/${id}/ranking`)}
              variant="outline"
              fullWidth
            />
          </View>
          <View className="flex-1">
            <Button
              title="👥 Invitar"
              onPress={() => setShowInviteModal(true)}
              variant="outline"
              fullWidth
            />
          </View>
        </View>
      </View>

      {/* Invite Modal */}
      <Modal visible={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invitar Jugadores">
        <View>
          <View className="bg-gray-50 p-4 rounded-lg mb-4">
            <Text className="text-sm text-gray-600 mb-2">Comparte este código con tus amigos:</Text>
            <Text className="text-2xl font-bold text-primary-600 text-center font-mono">{quiniela.invite_code}</Text>
          </View>
          <Button title="Copiar Código" onPress={handleCopyCode} fullWidth />
          <View className="mt-3">
            <Button title="Copiar Enlace" onPress={handleCopyLink} variant="outline" fullWidth />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
