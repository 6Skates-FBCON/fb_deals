import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';
import { CountdownTimer } from '@/components/CountdownTimer';
import { getDealStatus, formatPrice } from '@/utils/dealUtils';
import { Deal, EnrichedDeal } from '@/types/deal';
import { enrichDealWithShopifyData } from '@/utils/dealEnrichment';
import { useAuth } from '@/contexts/AuthContext';

export default function DealDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [deal, setDeal] = useState<EnrichedDeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const fetchDeal = useCallback(async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const enriched = await enrichDealWithShopifyData(data);
        setDeal(enriched);
      }
    } catch (error) {
      console.error('Error fetching deal:', error);
      Alert.alert('Error', 'Failed to load deal details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchDeal();
    }
  }, [fetchDeal, user]);

  const handlePurchase = () => {
    if (!deal) return;
    router.push(`/checkout/${deal.id}`);
  };

  const handleBack = () => {
    router.back();
  };

  if (authLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  if (!deal) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Deal not found</Text>
        <Button title="Go Back" onPress={handleBack} />
      </View>
    );
  }

  const status = getDealStatus(deal);
  const isSoldOut = status === 'sold_out';
  const isExpired = status === 'expired';
  const isComingSoon = status === 'coming_soon';
  const canPurchase = status === 'active' && !isSoldOut;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
        <ArrowLeft size={24} color={Colors.white} />
      </TouchableOpacity>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Image
          source={{ uri: deal.shopifyProduct?.images?.[0]?.url || deal.image_url }}
          style={styles.heroImage}
          resizeMode="cover"
        />

        <View style={styles.content}>
          <Text style={styles.title}>{deal.title}</Text>

          <View style={styles.priceContainer}>
            <Text style={styles.salePrice}>{formatPrice(deal.sale_price)}</Text>
            <Text style={styles.regularPrice}>{formatPrice(deal.regular_price)}</Text>
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>
                Save {Math.round(((deal.regular_price - deal.sale_price) / deal.regular_price) * 100)}%
              </Text>
            </View>
          </View>

          {status === 'active' && (
            <>
              <CountdownTimer endDate={deal.end_date} onExpire={fetchDeal} />

              {deal.quantity_remaining < 10 && (
                <View style={styles.urgencyBanner}>
                  <Text style={styles.urgencyText}>
                    Only {deal.quantity_remaining} left in stock!
                  </Text>
                </View>
              )}
            </>
          )}

          {isSoldOut && (
            <View style={styles.soldOutBanner}>
              <Text style={styles.soldOutText}>SOLD OUT</Text>
            </View>
          )}

          {isExpired && (
            <View style={styles.expiredBanner}>
              <Text style={styles.expiredText}>This deal has ended</Text>
            </View>
          )}

          {isComingSoon && (
            <View style={styles.comingSoonBanner}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          )}

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About This Deal</Text>
            <Text style={styles.description}>
              {deal.shopifyProduct?.description || deal.description || 'Grab this limited-time flash deal before it\'s gone! Perfect for any fingerboard enthusiast.'}
            </Text>
          </View>

          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Deal Details</Text>
            <View style={styles.availabilityContainer}>
              <Text style={styles.detailLabel}>Available:</Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${(deal.quantity_remaining / deal.quantity_total) * 100}%` }
                  ]}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {canPurchase ? (
          <Button
            title="Buy Now"
            onPress={handlePurchase}
            loading={purchasing}
            fullWidth
          />
        ) : isSoldOut ? (
          <Button title="Sold Out" variant="disabled" onPress={() => {}} fullWidth />
        ) : isExpired ? (
          <Button title="Deal Ended" variant="disabled" onPress={() => {}} fullWidth />
        ) : isComingSoon ? (
          <Button title="Coming Soon" variant="disabled" onPress={() => {}} fullWidth />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.darkBg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.darkBg,
    padding: Spacing.lg,
  },
  errorText: {
    ...Typography.heading,
    color: Colors.white,
    marginBottom: Spacing.lg,
  },
  backButton: {
    position: 'absolute',
    top: Spacing.xl + 20,
    left: Spacing.lg,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(28,28,30,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  heroImage: {
    width: '100%',
    height: 320,
    backgroundColor: Colors.cardBg,
  },
  content: {
    padding: Spacing.lg,
  },
  title: {
    ...Typography.hero,
    color: Colors.white,
    marginBottom: Spacing.md,
    fontWeight: '700',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  salePrice: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
  },
  regularPrice: {
    ...Typography.heading,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  savingsBadge: {
    backgroundColor: Colors.secondary,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  savingsText: {
    ...Typography.captionBold,
    color: Colors.white,
  },
  urgencyBanner: {
    backgroundColor: Colors.accent + '20',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  urgencyText: {
    ...Typography.bodyBold,
    color: Colors.accent,
    textAlign: 'center',
  },
  soldOutBanner: {
    backgroundColor: Colors.cardBg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.lg,
  },
  soldOutText: {
    ...Typography.heading,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  expiredBanner: {
    backgroundColor: Colors.cardBg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.lg,
  },
  expiredText: {
    ...Typography.bodyBold,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  comingSoonBanner: {
    backgroundColor: Colors.cardBg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.lg,
  },
  comingSoonText: {
    ...Typography.heading,
    color: Colors.white,
    textAlign: 'center',
  },
  descriptionSection: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.cardBg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  sectionTitle: {
    ...Typography.heading,
    color: Colors.white,
    marginBottom: Spacing.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  description: {
    ...Typography.body,
    color: Colors.white,
    lineHeight: 24,
  },
  detailsSection: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.cardBg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  availabilityContainer: {
    gap: Spacing.sm,
  },
  detailLabel: {
    ...Typography.body,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  progressBarContainer: {
    height: 24,
    backgroundColor: Colors.darkBg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.cardBg,
    padding: Spacing.lg,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.1)',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
