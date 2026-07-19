import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Card, Button, Badge } from '../ui';
import { supabase } from '../../lib/supabase';

interface JoinRequest {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  user?: {
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  };
}

interface JoinRequestsCardProps {
  quinielaId: string;
  onRequestHandled?: () => void;
}

export function JoinRequestsCard({ quinielaId, onRequestHandled }: JoinRequestsCardProps) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, [quinielaId]);

  const loadRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('join_requests')
      .select('*, user:users(full_name, avatar_url, email)')
      .eq('quiniela_id', quinielaId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    setRequests(data || []);
    setLoading(false);
  };

  const handleApprove = async (request: JoinRequest) => {
    setProcessingId(request.id);
    try {
      // 1. Update request
      await supabase
        .from('join_requests')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', request.id);

      // 2. Add as player
      await supabase
        .from('quiniela_players')
        .insert({ quiniela_id: quinielaId, user_id: request.user_id, role: 'player' });

      // 3. Remove from list
      setRequests(prev => prev.filter(r => r.id !== request.id));
      onRequestHandled?.();
    } catch (error) {
      console.error('Error approving:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: JoinRequest) => {
    setProcessingId(request.id);
    try {
      await supabase
        .from('join_requests')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('id', request.id);

      setRequests(prev => prev.filter(r => r.id !== request.id));
    } catch (error) {
      console.error('Error rejecting:', error);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading || requests.length === 0) return null;

  return (
    <Card className="mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-semibold text-gray-900">
          Solicitudes Pendientes
        </Text>
        <Badge label={`${requests.length}`} variant="warning" size="sm" />
      </View>

      {requests.map((request, index) => (
        <View
          key={request.id}
          className={`flex-row items-center justify-between py-3 ${
            index < requests.length - 1 ? 'border-b border-gray-100' : ''
          }`}
        >
          <View className="flex-1">
            <Text className="font-medium text-gray-900">
              {request.user?.full_name || request.user?.email?.split('@')[0] || 'Jugador'}
            </Text>
            <Text className="text-xs text-gray-500">
              Solicitó unirse {new Date(request.created_at).toLocaleDateString('es-ES')}
            </Text>
          </View>

          <View className="flex-row gap-2">
            <Button
              title="Rechazar"
              onPress={() => handleReject(request)}
              variant="outline"
              size="sm"
              disabled={processingId === request.id}
            />
            <Button
              title="Aceptar"
              onPress={() => handleApprove(request)}
              size="sm"
              disabled={processingId === request.id}
              loading={processingId === request.id}
            />
          </View>
        </View>
      ))}
    </Card>
  );
}
