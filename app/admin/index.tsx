import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Edit2, Trash2 } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Deal } from '@/types/deal';
import { getDealStatus, formatPrice } from '@/utils/dealUtils';
import { Button } from '@/components/Button';

export default function AdminDashboard() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDeals = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
      Alert.alert('Error', 'Failed to load deals');
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

  const handleDelete = async (dealId: string) => {
    Alert.alert('Delete Deal', 'Are you sure you want to delete this deal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('deals').delete().eq('id', dealId);

            if (error) throw error;

            Alert.alert('Success', 'Deal deleted successfully');
            fetchDeals();
          } catch (error) {
            console.error('Error deleting deal:', error);
            Alert.alert('Error', 'Failed to delete deal');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.subtitle}>Manage your flash deals</Text>
        </View>

        {deals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Deals Yet</Text>
            <Text style={styles.emptyText}>Create your first flash deal to get started</Text>
          </View>
        ) : (
          <View style={styles.dealsList}>
            {deals.map((deal) => {
              const status = getDealStatus(deal);
              return (
                <View key={deal.id} style={styles.dealCard}>
                  <View style={styles.dealHeader}>
                    <View style={styles.dealInfo}>
                      <Text style={styles.dealTitle} numberOfLines={1}>
                        {deal.title}
                      </Text>
                      <View style={styles.statusBadge}>
                        <Text style={[styles.statusText, styles[`status_${status}`]]}>
                          {status.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.dealDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Price:</Text>
                      <Text style={styles.detailValue}>
                        {formatPrice(deal.sale_price)} (was {formatPrice(deal.regular_price)})
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Stock:</Text>
                      <Text style={styles.detailValue}>
                        {deal.quantity_remaining} / {deal.quantity_total}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Shopify Handle:</Text>
                      <Text style={styles.detailValue} numberOfLines={1}>
                        {deal.shopify_handle || 'Not set'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.dealActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => router.push(`/admin/edit-deal/${deal.id}`)}
                    >
                      <Edit2 size={16} color={Colors.white} />
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDelete(deal.id)}
                    >
                      <Trash2 size={16} color={Colors.white} />
                      <Text style={styles.actionButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Add New Deal"
          onPress={() => router.push('/admin/add-deal')}
          fullWidth
        />
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
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
  dealsList: {
    gap: Spacing.md,
  },
  dealCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  dealInfo: {
    flex: 1,
    gap: Spacing.sm,
  },
  dealTitle: {
    ...Typography.heading,
    color: Colors.white,
    fontSize: 18,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: Colors.charcoal,
  },
  statusText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  status_active: {
    color: '#4ADE80',
  },
  status_sold_out: {
    color: '#F87171',
  },
  status_coming_soon: {
    color: '#FBBF24',
  },
  status_expired: {
    color: Colors.textSecondary,
  },
  dealDetails: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  detailValue: {
    ...Typography.bodyBold,
    color: Colors.white,
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  dealActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  editButton: {
    backgroundColor: Colors.primary,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    ...Typography.bodyBold,
    color: Colors.white,
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.cardBg,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
});
