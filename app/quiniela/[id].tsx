import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useQuinielas } from '../../hooks/useQuinielas';
import { Card, Button, Badge, Loading, EmptyState, Modal } from '../../components/ui';
import { quinielaService } from '../../services/quiniela.service';
import { copyToClipboard, generateShareLink } from '../../utils/share';

export default function QuinielaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { quinielas } = useQuinielas();
  const [quiniela, setQuiniela] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadQuiniela();
    }
  }, [id]);

  const loadQuiniela = async () => {
    if (!id) return;
    
    setLoading(true);
    const data = await quinielaService.getById(id);
    setQuiniela(data);
    
    const playersData = await quinielaService.getPlayers(id);
    setPlayers(playersData);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQuiniela();
    setRefreshing(false);
  };

  const handleCopyCode = async () => {
    if (quiniela?.invite_code) {
      await copyToClipboard(quiniela.invite_code);
      Alert.alert('Copiado', 'Código de invitación copiado al portapapeles');
    }
  };

  const handleCopyLink = async () => {
    if (quiniela?.invite_code) {
      const link = generateShareLink(quiniela.invite_code);
      await copyToClipboard(link);
      Alert.alert('Copiado', 'Enlace de invitación copiado al portapapeles');
    }
  };

  const handleShare = async () => {
    if (quiniela) {
      const link = generateShareLink(quiniela.invite_code);
      const message = `¡Únete a mi quiniela "${quiniela.name}" en Telodije!\n\nUsa el código: ${quiniela.invite_code}\nO haz clic en el enlace:\n${link}`;
      
      // For web, use clipboard
      await copyToClipboard(message);
      Alert.alert('Copiado', 'Mensaje de invitación copiado');
    }
  };

  if (loading && !refreshing) {
    return <Loading fullScreen text="Cargando quiniela..." />;
  }

  if (!quiniela) {
    return (
      <EmptyState
        icon="🔍"
        title="Quiniela no encontrada"
        description="Esta quiniela no existe o fue eliminada"
        action={
          <Button
            title="Volver a quinielas"
            onPress={() => router.push('/(tabs)/quinielas')}
          />
        }
      />
    );
  }

  const isOwner = quiniela.created_by === user?.id;
  const isPlayer = players.some((p) => p.user_id === user?.id);

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
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Text className="text-3xl mr-3">
                {quiniela.is_private ? '🔒' : '🌍'}
              </Text>
              <View>
                <Text className="text-xl font-bold text-gray-900">
                  {quiniela.name}
                </Text>
                <Text className="text-gray-500">
                  {quiniela.description || 'Sin descripción'}
                </Text>
              </View>
            </View>
          </View>
          
          <View className="flex-row items-center mt-3">
            <Badge 
              label={quiniela.is_private ? 'Privada' : 'Pública'} 
              variant={quiniela.is_private ? 'primary' : 'success'} 
            />
            <View className="ml-3">
              <Badge 
                label={`${players.length}/${quiniela.max_players} jugadores`} 
                variant="default" 
              />
            </View>
          </View>
        </Card>

        {/* Invite Section (for owner) */}
        {isOwner && (
          <Card className="mb-4">
            <Text className="font-semibold text-gray-900 mb-3">
              Invitar Jugadores
            </Text>
            
            <View className="flex-row items-center justify-between mb-3 bg-gray-50 p-3 rounded-lg">
              <Text className="text-gray-600">Código:</Text>
              <Text className="font-mono text-lg font-bold text-primary-600">
                {quiniela.invite_code}
              </Text>
            </View>
            
            <View className="flex-row justify-between">
              <Button
                title="Copiar Código"
                onPress={handleCopyCode}
                variant="outline"
                size="sm"
              />
              <Button
                title="Copiar Enlace"
                onPress={handleCopyLink}
                variant="outline"
                size="sm"
              />
              <Button
                title="Compartir"
                onPress={handleShare}
                variant="primary"
                size="sm"
              />
            </View>
          </Card>
        )}

        {/* Players List */}
        <Card className="mb-4">
          <Text className="font-semibold text-gray-900 mb-3">
            Participantes ({players.length})
          </Text>
          
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
                    <Text className="text-primary-600 font-medium">
                      {index + 1}
                    </Text>
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
                
                {player.role === 'owner' && (
                  <Badge label="Creador" variant="primary" size="sm" />
                )}
              </View>
            ))
          ) : (
            <Text className="text-gray-500 text-center py-4">
              No hay participantes aún
            </Text>
          )}
        </Card>

        {/* Action Buttons */}
        <View className="flex-row justify-between mb-4">
          <Button
            title="Jugar Quiniela"
            onPress={() => router.push(`/quiniela/${id}/predict`)}
            fullWidth
            icon={<Text>⚽</Text>}
          />
        </View>

        <View className="flex-row justify-between mb-4">
          <Button
            title="Ver Ranking"
            onPress={() => router.push(`/quiniela/${id}/ranking`)}
            variant="outline"
            icon={<Text>🏆</Text>}
          />
          <Button
            title="Invitar"
            onPress={() => setShowInviteModal(true)}
            variant="outline"
            icon={<Text>👥</Text>}
          />
        </View>
      </View>

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invitar Jugadores"
      >
        <View className="space-y-4">
          <View className="bg-gray-50 p-4 rounded-lg">
            <Text className="text-sm text-gray-600 mb-2">
              Comparte este código con tus amigos:
            </Text>
            <Text className="text-2xl font-bold text-primary-600 text-center font-mono">
              {quiniela.invite_code}
            </Text>
          </View>
          
          <Button
            title="Copiar Código"
            onPress={handleCopyCode}
            fullWidth
          />
          
          <Button
            title="Copiar Enlace"
            onPress={handleCopyLink}
            variant="outline"
            fullWidth
          />
          
          <Button
            title="Compartir por WhatsApp"
            onPress={() => {
              const link = generateShareLink(quiniela.invite_code);
              const message = encodeURIComponent(
                `¡Únete a mi quiniela "${quiniela.name}" en Telodije!\n\nUsa el código: ${quiniela.invite_code}\nO haz clic en el enlace:\n${link}`
              );
              // Open WhatsApp with message
              window.open(`https://wa.me/?text=${message}`, '_blank');
            }}
            variant="outline"
            fullWidth
          />
        </View>
      </Modal>
    </ScrollView>
  );
}
