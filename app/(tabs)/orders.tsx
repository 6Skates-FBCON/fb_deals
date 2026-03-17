import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { Package, CircleCheck as CheckCircle, Circle as XCircle, ExternalLink } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { supabase, Database } from '@/lib/supabase';
import { formatPrice } from '@/utils/dealUtils';
import { useAuth } from '@/contexts/AuthContext';

type Purchase = Database['public']['Tables']['purchases']['Row'];
type Deal = Database['public']['Tables']['deals']['Row'];

interface OrderWithDeal extends Purchase {
  deal: Deal | null;
}

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (purchasesError) throw purchasesError;

      const ordersWithDeals: OrderWithDeal[] = [];

      for (const purchase of purchasesData || []) {
        const { data: dealData } = await supabase
          .from('deals')
          .select('*')
          .eq('id', purchase.deal_id)
          .maybeSingle();

        ordersWithDeals.push({
          ...purchase,
          deal: dealData,
        });
      }

      setOrders(ordersWithDeals);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'purchases',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New order detected:', payload);
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchOrders]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} color="#4CAF50" />;
      case 'failed':
        return <XCircle size={20} color="#FF4444" />;
      default:
        return <Package size={20} color={Colors.primary} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'failed':
        return '#FF4444';
      default:
        return Colors.primary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
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
        <Text style={styles.title}>Your Orders</Text>
        {orders.length > 0 && <Text style={styles.subtitle}>{orders.length} total</Text>}
      </View>

      {orders.length > 0 ? (
        orders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View style={styles.statusContainer}>
                {getStatusIcon(order.status)}
                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Text>
              </View>
              <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
            </View>

            {order.deal && (
              <View style={styles.orderDetails}>
                <Text style={styles.dealTitle}>{order.deal.title}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.orderPrice}>{formatPrice(order.purchase_price)}</Text>
                  {order.quantity && order.quantity > 1 && (
                    <Text style={styles.quantityText}>x{order.quantity}</Text>
                  )}
                </View>
              </View>
            )}

            <View style={styles.orderInfo}>
              {order.shopify_order_number && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Order #:</Text>
                  <Text style={styles.infoValue}>{order.shopify_order_number}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Customer:</Text>
                <Text style={styles.infoValue}>{order.customer_name}</Text>
              </View>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Package size={48} color={Colors.midGrey} />
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptyText}>When you purchase flash deals, they'll show up here.</Text>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.darkBg,
  },
  header: {
    marginBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  title: {
    ...Typography.hero,
    color: Colors.white,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.midGrey,
    marginTop: 4,
  },
  orderCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrey,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusText: {
    ...Typography.bodyBold,
  },
  orderDate: {
    ...Typography.caption,
    color: Colors.midGrey,
  },
  orderDetails: {
    marginBottom: Spacing.md,
  },
  dealTitle: {
    ...Typography.bodyBold,
    color: Colors.white,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  orderPrice: {
    ...Typography.title,
    color: Colors.primary,
  },
  quantityText: {
    ...Typography.body,
    color: Colors.midGrey,
  },
  orderInfo: {
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  infoLabel: {
    ...Typography.caption,
    color: Colors.midGrey,
  },
  infoValue: {
    ...Typography.caption,
    color: Colors.charcoal,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyTitle: {
    ...Typography.heading,
    color: Colors.white,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.midGrey,
    textAlign: 'center',
  },
});
