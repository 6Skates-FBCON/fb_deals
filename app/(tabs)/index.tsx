import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { DealCard } from '@/components/DealCard';
import { getDealStatus } from '@/utils/dealUtils';
import { EnrichedDeal } from '@/types/deal';
import { enrichDealsWithShopifyData } from '@/utils/dealEnrichment';

export default function HomeScreen() {
  const router = useRouter();
  const [featuredDeal, setFeaturedDeal] = useState<EnrichedDeal | null>(null);
  const [activeDeals, setActiveDeals] = useState<EnrichedDeal[]>([]);
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

      const activeDealsData = enrichedDeals.filter((deal) => {
        const status = getDealStatus(deal);
        return status === 'active';
      });

      if (activeDealsData.length > 0) {
        setFeaturedDeal(activeDealsData[0]);
        setActiveDeals(activeDealsData);
      } else {
        setFeaturedDeal(null);
        setActiveDeals([]);
      }
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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.white} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/FBDeals Logo 2.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {featuredDeal ? (
        <>
          <View style={styles.section}>
            <DealCard deal={featuredDeal} onPress={() => handleDealPress(featuredDeal.id)} variant="spotlight" />
          </View>

          {/* UP NEXT card #1 */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.comingSoonCard} activeOpacity={0.9} disabled>
              <View style={styles.comingSoonHeader}>
                <Text style={styles.comingSoonHeaderText}>UP NEXT</Text>
              </View>
              <View style={styles.cardInner}>
                <View style={styles.imageWrapper}>
                  <Image
                    source={{
                      uri: 'https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg',
                    }}
                    style={styles.squareImage}
                    resizeMode="cover"
                    blurRadius={10}
                  />
                </View>

                <View style={styles.textContent}>
                  <View style={[styles.badge, styles.comingSoonBadge]}>
                    <Text style={styles.comingSoonText}>UP NEXT</Text>
                  </View>

                  <Text style={styles.title} numberOfLines={2}>
                    Next Amazing Deal
                  </Text>

                  <View style={styles.priceBlock}>
                    <View style={styles.blurredPrice}>
                      <Text style={styles.salePrice}>$XX.XX</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* UP NEXT card #2 */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.comingSoonCard} activeOpacity={0.9} disabled>
              <View style={styles.comingSoonHeader}>
                <Text style={styles.comingSoonHeaderText}>UP NEXT</Text>
              </View>
              <View style={styles.cardInner}>
                <View style={styles.imageWrapper}>
                  <Image
                    source={{
                      uri: 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg',
                    }}
                    style={styles.squareImage}
                    resizeMode="cover"
                    blurRadius={10}
                  />
                </View>

                <View style={styles.textContent}>
                  <View style={[styles.badge, styles.comingSoonBadge]}>
                    <Text style={styles.comingSoonText}>UP NEXT</Text>
                  </View>

                  <Text style={styles.title} numberOfLines={2}>
                    Another Great Deal
                  </Text>

                  <View style={styles.priceBlock}>
                    <View style={styles.blurredPrice}>
                      <Text style={styles.salePrice}>$XX.XX</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Active Deals</Text>
          <Text style={styles.emptyText}>Check back soon for new flash deals!</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.darkBg,
  },
  header: {
    marginBottom: Spacing.xs,
    paddingTop: Spacing.xs,
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 80,
    marginBottom: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  comingSoonCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    opacity: 0.7,
  },
  comingSoonHeader: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  comingSoonHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 1,
  },
  cardInner: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  imageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  squareImage: {
    width: '100%',
    height: '100%',
  },
  textContent: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
    alignSelf: 'flex-start',
  },
  comingSoonBadge: {
    backgroundColor: Colors.charcoal,
  },
  comingSoonText: {
    ...Typography.smallBold,
    color: Colors.white,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    lineHeight: 20,
  },
  priceBlock: {
    gap: 4,
  },
  blurredPrice: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  salePrice: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyTitle: {
    ...Typography.heading,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
