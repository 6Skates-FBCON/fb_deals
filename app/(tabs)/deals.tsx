import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { DealCard } from '@/components/DealCard';
import { getDealStatus } from '@/utils/dealUtils';
import { Deal, EnrichedDeal } from '@/types/deal';
import { enrichDealsWithShopifyData } from '@/utils/dealEnrichment';

export default function DealsScreen() {
  const router = useRouter();
  const [activeDeals, setActiveDeals] = useState<EnrichedDeal[]>([]);
  const [comingSoonDeals, setComingSoonDeals] = useState<EnrichedDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDeals = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;

      const enrichedDeals = await enrichDealsWithShopifyData(data || []);

      const active: EnrichedDeal[] = [];
      const comingSoon: EnrichedDeal[] = [];

      enrichedDeals.forEach((deal) => {
        const status = getDealStatus(deal);
        if (status === 'active' || status === 'sold_out') {
          active.push(deal);
        } else if (status === 'coming_soon') {
          comingSoon.push(deal);
        }
      });

      setActiveDeals(active);
      setComingSoonDeals(comingSoon);
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDeals();
  }, [fetchDeals]);

  const handleDealPress = (dealId: string) => {
    router.push(`/deal/${dealId}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>All Deals</Text>
      </View>

      {activeDeals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Now</Text>
          {activeDeals.map((deal) => (
            <View key={deal.id} style={styles.dealItem}>
              <DealCard deal={deal} onPress={() => handleDealPress(deal.id)} />
            </View>
          ))}
        </View>
      )}

      {comingSoonDeals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coming Soon</Text>
          {comingSoonDeals.map((deal) => (
            <View key={deal.id} style={styles.dealItem}>
              <DealCard deal={deal} onPress={() => handleDealPress(deal.id)} />
            </View>
          ))}
        </View>
      )}

      {activeDeals.length === 0 && comingSoonDeals.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Deals Available</Text>
          <Text style={styles.emptyText}>Check back soon for new flash deals!</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  header: {
    marginBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  title: {
    ...Typography.hero,
    color: Colors.black,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.heading,
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  dealItem: {
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyTitle: {
    ...Typography.heading,
    color: Colors.black,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.midGrey,
    textAlign: 'center',
  },
});
