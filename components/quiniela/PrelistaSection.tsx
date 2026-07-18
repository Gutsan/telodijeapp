/**
 * components/quiniela/PrelistaSection.tsx
 * 
 * Sección completa que muestra la Pre-lista de partidos.
 * Integra el hook usePrelista con la UI (PrelistaCard).
 * 
 * Características:
 * - Carga automática de partidos rankeados
 * - Estados de carga, error y vacío
 * - Pull-to-refresh
 * - Header con título y subtítulo
 * - Lista scrollable de PrelistaCards
 * 
 * @module components/quiniela/PrelistaSection
 * @version 1.0.0
 * 
 * @example
 * ```tsx
 * import { PrelistaSection } from '../components/quiniela';
 * 
 * function HomeScreen() {
 *   return (
 *     <PrelistaSection
 *       onMatchPress={(matchId) => router.push(`/match/${matchId}`)}
 *     />
 *   );
 * }
 * ```
 */

import React from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { PrelistaCard } from './PrelistaCard';
import { EmptyState, Loading } from '../ui';
import { usePrelista } from '../../hooks/usePrelista';
import { PRELISTA_UI } from '../../constants/prelista';
import type { MatchWithRelevance } from '../../types';

// ──────────────────────────────────────────────────────────────────
//  PROPIEDADES
// ──────────────────────────────────────────────────────────────────

interface PrelistaSectionProps {
  /** Callback al presionar un partido */
  onMatchPress?: (matchId: string) => void;

  /** Si se muestran los inputs de predicción en cada card */
  showInputs?: boolean;

  /** Título personalizado de la sección */
  title?: string;

  /** Subtítulo personalizado */
  subtitle?: string;

  /** Si se muestra el header completo */
  showHeader?: boolean;

  /** Estilo del contenedor */
  className?: string;
}

// ──────────────────────────────────────────────────────────────────
//  COMPONENTE
// ──────────────────────────────────────────────────────────────────

/**
 * Sección de la Pre-lista de partidos.
 * 
 * Renderiza:
 * 1. Header con título y subtítulo
 * 2. Lista de partidos rankeados por relevancia
 * 3. Estados de carga, error y vacío
 */
export function PrelistaSection({
  onMatchPress,
  showInputs = false,
  title = PRELISTA_UI.sectionTitle,
  subtitle = PRELISTA_UI.sectionSubtitle,
  showHeader = true,
  className = '',
}: PrelistaSectionProps) {
  // Hook de pre-lista
  const {
    matches,
    loading,
    error,
    refresh,
    hasMatches,
    matchCount,
    meta,
  } = usePrelista();

  // ──────────────────────────────────────────────────────────────
  //  ESTADO DE CARGA
  // ──────────────────────────────────────────────────────────────

  if (loading && matches.length === 0) {
    return (
      <View className={`py-8 ${className}`}>
        <Loading />
        <Text className="text-center text-gray-500 mt-4">
          {PRELISTA_UI.loadingText}
        </Text>
      </View>
    );
  }

  // ──────────────────────────────────────────────────────────────
  //  ESTADO DE ERROR
  // ──────────────────────────────────────────────────────────────

  if (error && matches.length === 0) {
    return (
      <View className={`py-8 ${className}`}>
        <EmptyState
          icon="⚠️"
          title="Error al cargar partidos"
          description={error}
          action={
            <Text
              className="text-primary-600 font-medium"
              onPress={refresh}
            >
              Reintentar
            </Text>
          }
        />
      </View>
    );
  }

  // ──────────────────────────────────────────────────────────────
  //  ESTADO VACÍO
  // ──────────────────────────────────────────────────────────────

  if (!hasMatches) {
    return (
      <View className={`py-8 ${className}`}>
        <EmptyState
          icon="⚽"
          title={PRELISTA_UI.emptyState}
          description="Vuelve a consultar más tarde para ver nuevos partidos disponibles."
        />
      </View>
    );
  }

  // ──────────────────────────────────────────────────────────────
  //  RENDERIZADO PRINCIPAL
  // ──────────────────────────────────────────────────────────────

  /**
   * Renderiza cada item de la lista.
   */
  const renderItem = ({ item }: { item: MatchWithRelevance }) => (
    <PrelistaCard
      match={item}
      onPress={onMatchPress ? () => onMatchPress(item.id) : undefined}
      showInputs={showInputs}
    />
  );

  /**
   * Key extractor para FlatList.
   */
  const keyExtractor = (item: MatchWithRelevance) => item.id;

  return (
    <View className={className}>
      {/* Header */}
      {showHeader && (
        <View className="mb-4">
          <Text className="text-lg font-bold text-gray-900">
            {title}
          </Text>
          <Text className="text-sm text-gray-500">
            {subtitle}
          </Text>
          {meta && (
            <Text className="text-xs text-gray-400 mt-1">
              {matchCount} de {meta.totalFound} partidos disponibles
            </Text>
          )}
        </View>
      )}

      {/* Lista de partidos */}
      <FlatList
        data={matches}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        scrollEnabled={false} // Deshabilitado para integrar en scroll padre
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            colors={['#10B981']} // Verde primario
            tintColor="#10B981"
          />
        }
        ListFooterComponent={
          matches.length >= 10 ? (
            <View className="py-4 items-center">
              <Text className="text-xs text-gray-400">
                Mostrando los 10 partidos más relevantes
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────
//  EXPORTACIONES NOMBRADAS
// ──────────────────────────────────────────────────────────────────

export default PrelistaSection;
