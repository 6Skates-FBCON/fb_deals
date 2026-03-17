import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CreditCard as Edit2, Trash2, X, Check } from 'lucide-react-native';
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
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDeals = useCallback(async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (error: any) {
      console.error('Error fetching deals:', error);
      const errorMessage = error?.message || 'Failed to load deals';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();

    const channel = supabase
      .channel('admin-deals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deals',
        },
        (payload) => {
          console.log('Deal change detected:', payload);
          fetchDeals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDeals]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDeals();
  }, [fetchDeals]);

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('deals').delete().eq('id', confirmDeleteId);
      if (error) throw new Error(error.message || 'Failed to delete deal');
      setConfirmDeleteId(null);
      fetchDeals();
    } catch (err: any) {
      console.error('Error deleting deal:', err);
      setError(err?.message || 'Failed to delete deal. You may not have permission.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading && !error) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading deals...</Text>
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

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
            <TouchableOpacity onPress={fetchDeals} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

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
                    {confirmDeleteId === deal.id ? (
                      <>
                        <View style={styles.confirmPrompt}>
                          <Text style={styles.confirmText}>Delete this deal?</Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.cancelButton]}
                          onPress={() => setConfirmDeleteId(null)}
                          disabled={deleting}
                        >
                          <X size={16} color={Colors.white} />
                          <Text style={styles.actionButtonText}>No</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.deleteButton]}
                          onPress={handleDeleteConfirm}
                          disabled={deleting}
                        >
                          {deleting ? (
                            <ActivityIndicator size="small" color={Colors.white} />
                          ) : (
                            <>
                              <Check size={16} color={Colors.white} />
                              <Text style={styles.actionButtonText}>Yes</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.editButton]}
                          onPress={() => router.push(`/admin/edit-deal/${deal.id}`)}
                        >
                          <Edit2 size={16} color={Colors.white} />
                          <Text style={styles.actionButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.deleteButton]}
                          onPress={() => setConfirmDeleteId(deal.id)}
                        >
                          <Trash2 size={16} color={Colors.white} />
                          <Text style={styles.actionButtonText}>Delete</Text>
                        </TouchableOpacity>
                      </>
                    )}
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
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: '#666666',
    marginTop: Spacing.md,
  },
  errorBanner: {
    backgroundColor: '#EF4444',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorBannerText: {
    ...Typography.body,
    color: '#FFFFFF',
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  retryButtonText: {
    ...Typography.bodyBold,
    color: '#EF4444',
    fontSize: 12,
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
    color: '#666666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyTitle: {
    ...Typography.heading,
    color: '#000000',
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    color: '#666666',
    textAlign: 'center',
  },
  dealsList: {
    gap: Spacing.md,
  },
  dealCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    color: '#000000',
    fontSize: 18,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  statusText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  status_active: {
    color: '#16A34A',
  },
  status_sold_out: {
    color: '#DC2626',
  },
  status_coming_soon: {
    color: '#D97706',
  },
  status_expired: {
    color: '#666666',
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
    color: '#666666',
    fontSize: 14,
  },
  detailValue: {
    ...Typography.bodyBold,
    color: '#000000',
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
    backgroundColor: '#2563EB',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  cancelButton: {
    backgroundColor: '#9CA3AF',
  },
  confirmPrompt: {
    flex: 1,
    justifyContent: 'center',
  },
  confirmText: {
    ...Typography.body,
    color: '#000000',
    fontSize: 13,
  },
  actionButtonText: {
    ...Typography.bodyBold,
    color: '#FFFFFF',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
});
