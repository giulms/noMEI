/**
 * @file src/screens/HomeScreen.tsx
 * @description Dashboard Principal — busca + filtro por UF
 */

import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
   ActivityIndicator,
   ScrollView,
   StyleSheet,
   Text,
   TouchableOpacity,
   View,
} from 'react-native';
import { Header, BidCard, EmptyState, ErrorState, Input } from '../components';
import { colors, spacing, textPresets } from '../theme';
import { useLicitacoes } from '../hooks';
import { useProfile } from '../context/ProfileContext';
import type { MainTabScreenProps } from '../types';

const BRAZIL_UFS = [
   'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
   'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
   'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

type Props = MainTabScreenProps<"Inicio">;

export function HomeScreen({ navigation }: Props): React.JSX.Element {
   const { selectedCategories, selectedLabels } = useProfile();

   const [busca, setBusca] = useState('');
   const [debouncedBusca, setDebouncedBusca] = useState('');
   const [selectedUf, setSelectedUf] = useState<string | null>(null);

   useEffect(() => {
      const timer = setTimeout(() => setDebouncedBusca(busca.trim()), 400);
      return () => clearTimeout(timer);
   }, [busca]);

   const { items, loading, error } = useLicitacoes({
      limit: 100,
      busca: debouncedBusca || undefined,
      uf: selectedUf ?? undefined,
   });

   const recommendedItems = useMemo(() => {
      const hasPreferences = selectedCategories.length > 0 || selectedLabels.length > 0;
      if (!hasPreferences) return items;

      const labelsLower = selectedLabels.map((l) => l.toLowerCase());

      const scored = items.flatMap((bid) => {
         const categoryMatch = selectedCategories.includes(bid.category);
         const titleLower = bid.title.toLowerCase();
         const textMatch = labelsLower.some((label) => titleLower.includes(label));

         if (categoryMatch) return [{ ...bid, compatibility: 100 }];
         if (textMatch) return [{ ...bid, compatibility: 50 }];
         return [];
      });

      // Ordena: 100% primeiro, depois 50%
      return scored.sort((a, b) => b.compatibility - a.compatibility);
   }, [items, selectedCategories, selectedLabels]);

   return (
      <SafeAreaView style={styles.safeArea}>
         <Header
            variant="default"
            notificationCount={3}
            onNotificationPress={() => navigation.navigate('Alertas')}
         />
         <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            <Text style={styles.greeting}>Olá, João! 👋</Text>
            <Text style={styles.subtitle}>Bem-vindo ao seu painel de licitações.</Text>

            {/* Busca + Filtro por UF */}
            <Input
               leftIcon="search-outline"
               placeholder="Buscar licitações..."
               value={busca}
               onChangeText={setBusca}
               clearable
               returnKeyType="search"
            />

            <ScrollView
               horizontal
               showsHorizontalScrollIndicator={false}
               contentContainerStyle={styles.ufRow}
               style={styles.ufScroll}
            >
               <TouchableOpacity
                  style={[styles.ufChip, selectedUf === null && styles.ufChipActive]}
                  onPress={() => setSelectedUf(null)}
               >
                  <Text style={[styles.ufChipText, selectedUf === null && styles.ufChipTextActive]}>
                     Todos
                  </Text>
               </TouchableOpacity>
               {BRAZIL_UFS.map((uf) => (
                  <TouchableOpacity
                     key={uf}
                     style={[styles.ufChip, selectedUf === uf && styles.ufChipActive]}
                     onPress={() => setSelectedUf((prev) => (prev === uf ? null : uf))}
                  >
                     <Text style={[styles.ufChipText, selectedUf === uf && styles.ufChipTextActive]}>
                        {uf}
                     </Text>
                  </TouchableOpacity>
               ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>Recomendadas para você</Text>

            {loading && (
               <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            )}

            {error && !loading && (
               <ErrorState
                  title="Erro ao carregar licitações"
                  description={error}
               />
            )}

            {!loading && !error && recommendedItems.map(bid => (
               <BidCard
                  key={bid.id}
                  title={bid.title}
                  agency={bid.agency}
                  value={bid.value}
                  status={bid.status}
                  deadline={bid.deadline}
                  compatibility={bid.compatibility}
                  onPress={() =>
                     navigation.navigate('DetalhesLicitacao', {
                        bidId: bid.id,
                        bidTitle: bid.title,
                     })
                  }
               />
            ))}

            {!loading && !error && recommendedItems.length === 0 && (
               <EmptyState
                  icon="search-outline"
                  title="Sem recomendações no momento"
                  description="Complete seu perfil para receber oportunidades alinhadas ao seu CNAE."
                  actionLabel="Completar perfil"
                  onAction={() => navigation.navigate('Perfil')}
               />
            )}
         </ScrollView>
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   safeArea: {
      flex: 1,
      backgroundColor: colors.background,
   },
   scroll: {
      flex: 1,
   },
   content: {
      padding: spacing[4],
      paddingBottom: spacing[10],
      gap: spacing[3],
   },
   greeting: {
      ...textPresets.h3,
      color: colors.textPrimary,
   },
   subtitle: {
      ...textPresets.bodyMd,
      color: colors.textSecondary,
      marginTop: -spacing[1],
   },
   sectionTitle: {
      ...textPresets.h5,
      color: colors.textPrimary,
      marginTop: spacing[2],
   },
   ufScroll: {
      flexGrow: 0,
      flexShrink: 0,
   },
   ufRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
      paddingVertical: spacing[1],
   },
   ufChip: {
      paddingHorizontal: spacing[3],
      paddingVertical: 6,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
   },
   ufChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
   },
   ufChipText: {
      ...textPresets.bodyMd,
      color: colors.textSecondary,
      fontWeight: '500',
   },
   ufChipTextActive: {
      color: colors.white,
   },
   loader: {
      marginVertical: spacing[6],
   },
});
