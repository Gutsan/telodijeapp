import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Button, Badge, Loading, EmptyState } from '../../components/ui';
import { syncService } from '../../services/sync.service';
import { matchService } from '../../services/match.service';

export default function AdminMatchesScreen() {
  const [matches, setMatches] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState('');
  const [activeTab, setActiveTab] = useState<'matches' | 'tournaments' | 'logs'>('matches');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [matchesData, tournamentsData, logsData] = await Promise.all([
      matchService.getUpcoming(50),
      syncService.getActiveTournaments(),
      syncService.getSyncLogs(10),
    ]);
    setMatches(matchesData);
    setTournaments(tournamentsData);
    setSyncLogs(logsData);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult('');
    try {
      const result = await syncService.syncMatches();
      setSyncResult(`✅ ${result.created} creados, ${result.updated} actualizados, ${result.errors} errores`);
      await loadData();
    } catch (error) {
      setSyncResult('❌ Error durante la sincronización');
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleTournament = async (id: number, currentActive: boolean) => {
    await syncService.toggleTournament(id, !currentActive);
    await loadData();
  };

  if (loading && !refreshing) {
    return <Loading fullScreen text="Cargando panel admin..." />;
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="p-4">
        {/* Header */}
        <Card className="mb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-bold text-gray-900">Gestión de Partidos</Text>
              <Text className="text-gray-500">{matches.length} partidos programados</Text>
            </View>
            <Badge label="Admin" variant="primary" />
          </View>
        </Card>

        {/* Sync Button */}
        <Card className="mb-4">
          <Text className="font-semibold text-gray-900 mb-2">🔄 Sincronizar con SofaScore</Text>
          <Text className="text-sm text-gray-500 mb-3">
            Descarga partidos de los torneos activos para los próximos 7 días.
          </Text>
          <Button title={syncing ? 'Sincronizando...' : '⚡ Sincronizar Ahora'} onPress={handleSync} loading={syncing} fullWidth />
          {syncResult ? (
            <View className="mt-3 bg-gray-50 p-3 rounded-lg">
              <Text className="text-sm text-gray-700">{syncResult}</Text>
            </View>
          ) : null}
        </Card>

        {/* Tabs */}
        <View className="flex-row mb-4 bg-gray-100 rounded-lg p-1">
          {(['matches', 'tournaments', 'logs'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              className={`flex-1 py-2 rounded-md ${activeTab === tab ? 'bg-white shadow-sm' : ''}`}
              onPress={() => setActiveTab(tab)}
            >
              <Text className={`text-center font-medium text-sm ${activeTab === tab ? 'text-primary-600' : 'text-gray-500'}`}>
                {tab === 'matches' ? 'Partidos' : tab === 'tournaments' ? 'Torneos' : 'Logs'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* TAB: Matches */}
        {activeTab === 'matches' && (
          matches.length > 0 ? (
            matches.map((match) => (
              <Card key={match.id} className="mb-2">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500">{match.league || 'Sin liga'}</Text>
                    <Text className="font-medium text-gray-900 text-sm">{match.home_team} vs {match.away_team}</Text>
                    <Text className="text-xs text-gray-400">
                      {new Date(match.match_date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  {match.status === 'scheduled' ? (
                    <Badge label="Programado" variant="success" size="sm" />
                  ) : match.status === 'live' ? (
                    <Badge label="En Vivo" variant="error" size="sm" />
                  ) : (
                    <Text className="text-sm font-bold text-primary-600">{match.home_score}-{match.away_score}</Text>
                  )}
                </View>
              </Card>
            ))
          ) : (
            <EmptyState icon="⚽" title="No hay partidos" description="Sincroniza desde SofaScore" />
          )
        )}

        {/* TAB: Tournaments */}
        {activeTab === 'tournaments' && (
          tournaments.length > 0 ? (
            tournaments.map((t) => (
              <Card key={t.id} className="mb-2">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">{t.name}</Text>
                    <Text className="text-xs text-gray-500">{t.category_name} • Prioridad: {t.priority}</Text>
                    {t.last_synced_at && (
                      <Text className="text-xs text-gray-400">Último sync: {new Date(t.last_synced_at).toLocaleString('es-ES')}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleToggleTournament(t.id, t.is_active)}
                    className={`px-3 py-1.5 rounded-full ${t.is_active ? 'bg-green-100' : 'bg-gray-100'}`}
                  >
                    <Text className={`text-xs font-medium ${t.is_active ? 'text-green-700' : 'text-gray-500'}`}>
                      {t.is_active ? 'Activo' : 'Inactivo'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          ) : (
            <EmptyState icon="🏆" title="Sin torneos" description="No hay torneos configurados" />
          )
        )}

        {/* TAB: Logs */}
        {activeTab === 'logs' && (
          syncLogs.length > 0 ? (
            syncLogs.map((log) => (
              <Card key={log.id} className="mb-2">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="font-medium text-gray-900 text-sm">{log.sync_type === 'matches' ? 'Partidos' : log.sync_type}</Text>
                  <Badge
                    label={log.status === 'success' ? 'Éxito' : log.status === 'error' ? 'Error' : 'Ejecutando'}
                    variant={log.status === 'success' ? 'success' : log.status === 'error' ? 'error' : 'warning'}
                    size="sm"
                  />
                </View>
                <Text className="text-xs text-gray-500">{new Date(log.started_at).toLocaleString('es-ES')}</Text>
                <Text className="text-xs text-gray-400 mt-1">
                  Procesados: {log.records_processed} | Creados: {log.records_created} | Actualizados: {log.records_updated}
                </Text>
                {log.error_message && <Text className="text-xs text-red-500 mt-1">{log.error_message}</Text>}
              </Card>
            ))
          ) : (
            <EmptyState icon="📋" title="Sin logs" description="Los logs de sincronización aparecerán aquí" />
          )
        )}
      </View>
    </ScrollView>
  );
}
