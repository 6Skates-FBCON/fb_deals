import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { ArrowLeft } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';
import { formatPrice } from '@/utils/dealUtils';
import { Deal, EnrichedDeal } from '@/types/deal';
import { enrichDealWithShopifyData } from '@/utils/dealEnrichment';
import { createCheckout } from '@/lib/shopify';

export default function CheckoutScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
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
    fetchDeal();
  }, [fetchDeal]);

  const handlePurchase = async () => {
    if (!deal || !deal.shopifyProduct) {
      Alert.alert('Error', 'Product information not available');
      return;
    }

    if (deal.quantity_remaining <= 0) {
      Alert.alert('Sold Out', 'This deal is no longer available');
      return;
    }

    setPurchasing(true);

    try {
      const checkout = await createCheckout(deal.shopifyProduct.variantId, 1);

      if (!checkout || !checkout.webUrl) {
        throw new Error('Failed to create checkout');
      }

      const supported = await Linking.canOpenURL(checkout.webUrl);

      if (supported) {
        await Linking.openURL(checkout.webUrl);
      } else {
        throw new Error('Cannot open checkout URL');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      Alert.alert('Error', 'Failed to start checkout. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!deal) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Deal not found</Text>
      </View>
    );
  }

  const handleBack = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
        <ArrowLeft size={24} color={Colors.white} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Secure Checkout</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            You'll be redirected to our secure Shopify checkout to complete your purchase. All payment information is processed securely by Shopify.
          </Text>
        </View>

        <View style={styles.dealSummary}>
          <Text style={styles.summaryTitle}>{deal.title}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.label}>Price:</Text>
            <Text style={styles.price}>{formatPrice(deal.sale_price)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalPrice}>{formatPrice(deal.sale_price)}</Text>
        </View>
        <Button
          title="Buy Now"
          onPress={handlePurchase}
          loading={purchasing}
          fullWidth
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A6DFF',
  },
  backButton: {
    position: 'absolute',
    top: Spacing.xl + 20,
    left: Spacing.lg,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A6DFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A6DFF',
    padding: Spacing.lg,
  },
  errorText: {
    ...Typography.heading,
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl + 60,
    paddingBottom: 200,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.xl,
    textAlign: 'left',
  },
  infoBox: {
    backgroundColor: '#1E4FCC',
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
  },
  infoText: {
    fontSize: 16,
    color: Colors.black,
    lineHeight: 24,
  },
  dealSummary: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  summaryTitle: {
    ...Typography.heading,
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...Typography.body,
    color: Colors.white,
  },
  price: {
    ...Typography.title,
    color: Colors.white,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  totalLabel: {
    ...Typography.heading,
    color: Colors.white,
  },
  totalPrice: {
    ...Typography.title,
    color: Colors.white,
  },
});
