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
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, CreditCard as Edit2, Trash2, X, Calendar, Megaphone, Bell, Send } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Notification, NotificationType, PushActionType } from '@/types/notification';
import { Deal } from '@/types/deal';
import { Button } from '@/components/Button';
import { DateTimePicker } from '@/components/DateTimePicker';
import { useNotifications } from '@/contexts/NotificationContext';

export default function AdminNotifications() {
  const router = useRouter();
  const { refreshUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sendingPushId, setSendingPushId] = useState<string | null>(null);

  const TAB_OPTIONS = [
    { value: 'index', label: 'Deals' },
    { value: 'notifications', label: 'Notifications' },
    { value: 'orders', label: 'Orders' },
    { value: 'location', label: 'Location' },
    { value: 'profile', label: 'Profile' },
  ];

  const [formData, setFormData] = useState({
    type: 'announcement' as NotificationType,
    title: '',
    message: '',
    preview: '',
    published_at: new Date(),
    expires_at: null as Date | null,
    push_action_type: 'tab' as PushActionType,
    push_action_target: 'notifications',
  });

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      const errorMessage = error?.message || 'Failed to load notifications';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchDeals = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (error: any) {
      console.error('Error fetching deals:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchDeals();
  }, [fetchNotifications, fetchDeals]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
    fetchDeals();
  }, [fetchNotifications, fetchDeals]);

  const openCreateModal = () => {
    setEditingNotification(null);
    setFormError(null);
    setFormData({
      type: 'announcement',
      title: '',
      message: '',
      preview: '',
      published_at: new Date(),
      expires_at: null,
      push_action_type: 'tab',
      push_action_target: 'notifications',
    });
    setModalVisible(true);
  };

  const openEditModal = (notification: Notification) => {
    setEditingNotification(notification);
    setFormData({
      type: notification.type,
      title: notification.title,
      message: notification.message,
      preview: notification.preview,
      published_at: new Date(notification.published_at),
      expires_at: notification.expires_at ? new Date(notification.expires_at) : null,
      push_action_type: notification.push_action_type || 'tab',
      push_action_target: notification.push_action_target || 'notifications',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError('Please enter a title');
      return;
    }

    if (!formData.preview.trim()) {
      setFormError('Please enter a preview text');
      return;
    }

    if (!formData.message.trim()) {
      setFormError('Please enter a full message');
      return;
    }

    setSaving(true);
    try {
      const notificationData = {
        type: formData.type,
        title: formData.title.trim(),
        message: formData.message.trim(),
        preview: formData.preview.trim(),
        published_at: formData.published_at.toISOString(),
        expires_at: formData.expires_at ? formData.expires_at.toISOString() : null,
        push_action_type: formData.push_action_type,
        push_action_target: formData.push_action_target.trim(),
        updated_at: new Date().toISOString(),
      };

      if (editingNotification) {
        const { error } = await supabase
          .from('notifications')
          .update(notificationData)
          .eq('id', editingNotification.id);

        if (error) throw error;

        setModalVisible(false);
        await fetchNotifications();
        await refreshUnreadCount();
        Alert.alert('Success', 'Notification updated successfully');
      } else {
        const { error } = await supabase
          .from('notifications')
          .insert([notificationData]);

        if (error) throw error;

        setModalVisible(false);
        await refreshUnreadCount();
        Alert.alert('Success', 'Notification created and is now visible to all users');
        router.push('/(tabs)/notifications');
      }
    } catch (error: any) {
      console.error('Error saving notification:', error);
      setFormError(error?.message || 'Failed to save notification');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (notificationId: string) => {
    const confirmed = confirm('Are you sure you want to delete this notification? This cannot be undone.');

    if (!confirmed) return;

    setLoading(true);
    try {
      console.log('Deleting notification:', notificationId);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      console.log('Notification deleted successfully');
      await refreshUnreadCount();
      router.push('/(tabs)/notifications');
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      setError(error?.message || 'Failed to delete notification');
      setLoading(false);
    }
  };

  const handleSendPush = async (notification: Notification) => {
    const confirmed = confirm(`Send push notification "${notification.title}" to all devices?`);
    if (!confirmed) return;

    setSendingPushId(notification.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: notification.title,
          body: notification.preview,
          data: {
            push_action_type: notification.push_action_type,
            push_action_target: notification.push_action_target,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send push notification');
      }

      Alert.alert('Push Sent', `Sent to ${result.sent} of ${result.total} devices`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to send push notification');
    } finally {
      setSendingPushId(null);
    }
  };

  const getActionLabel = (notification: Notification) => {
    switch (notification.push_action_type) {
      case 'deal':
        return 'Deal page';
      case 'url':
        return notification.push_action_target;
      case 'tab': {
        const tab = TAB_OPTIONS.find((t) => t.value === notification.push_action_target);
        return tab ? `${tab.label} tab` : notification.push_action_target;
      }
      default:
        return 'Notifications tab';
    }
  };

  const getIcon = (type: NotificationType) => {
    const size = 20;
    const color = '#2563EB';

    switch (type) {
      case 'event':
        return <Calendar size={size} color={color} />;
      case 'announcement':
        return <Megaphone size={size} color={color} />;
      default:
        return <Bell size={size} color={color} />;
    }
  };

  const getStatusText = (notification: Notification) => {
    const now = new Date();
    const published = new Date(notification.published_at);
    const expires = notification.expires_at ? new Date(notification.expires_at) : null;

    if (published > now) return { text: 'SCHEDULED', color: '#FBBF24' };
    if (expires && expires < now) return { text: 'EXPIRED', color: Colors.textSecondary };
    return { text: 'ACTIVE', color: '#4ADE80' };
  };

  if (loading && !error) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.subtitle}>Manage app notifications for events and announcements</Text>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
            <TouchableOpacity onPress={fetchNotifications} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Notifications Yet</Text>
            <Text style={styles.emptyText}>Create your first notification to inform users about events and drops</Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification) => {
              const status = getStatusText(notification);
              return (
                <View key={notification.id} style={styles.notificationCard}>
                  <View style={styles.notificationHeader}>
                    <View style={styles.notificationInfo}>
                      <View style={styles.titleRow}>
                        {getIcon(notification.type)}
                        <Text style={styles.notificationTitle} numberOfLines={1}>
                          {notification.title}
                        </Text>
                      </View>
                      <View style={styles.statusBadge}>
                        <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.notificationDetails}>
                    <Text style={styles.notificationPreview} numberOfLines={2}>
                      {notification.preview}
                    </Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Type:</Text>
                      <Text style={styles.detailValue}>{notification.type}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Published:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(notification.published_at).toLocaleDateString()}
                      </Text>
                    </View>
                    {notification.expires_at && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Expires:</Text>
                        <Text style={styles.detailValue}>
                          {new Date(notification.expires_at).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Push opens:</Text>
                      <Text style={styles.detailValue} numberOfLines={1}>
                        {getActionLabel(notification)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.notificationActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.pushButton]}
                      onPress={() => handleSendPush(notification)}
                      disabled={sendingPushId === notification.id}
                    >
                      <Send size={16} color={Colors.white} />
                      <Text style={styles.actionButtonText}>
                        {sendingPushId === notification.id ? 'Sending...' : 'Push'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => openEditModal(notification)}
                    >
                      <Edit2 size={16} color={Colors.white} />
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDelete(notification.id)}
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
        <Button title="Create Notification" onPress={openCreateModal} fullWidth />
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingNotification ? 'Edit' : 'Create'} Notification</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <X size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              {formError && (
                <View style={styles.formErrorBanner}>
                  <Text style={styles.formErrorText}>{formError}</Text>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Type</Text>
                <View style={styles.typeButtons}>
                  {(['announcement', 'event', 'general'] as NotificationType[]).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeButton, formData.type === type && styles.typeButtonActive]}
                      onPress={() => setFormData({ ...formData, type })}
                    >
                      <Text style={[styles.typeButtonText, formData.type === type && styles.typeButtonTextActive]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={formData.title}
                  onChangeText={(title) => setFormData({ ...formData, title })}
                  placeholder="Notification title"
                  placeholderTextColor="#999999"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Preview Text</Text>
                <TextInput
                  style={styles.input}
                  value={formData.preview}
                  onChangeText={(preview) => setFormData({ ...formData, preview })}
                  placeholder="Short preview for the list"
                  placeholderTextColor="#999999"
                  maxLength={100}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Message</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.message}
                  onChangeText={(message) => setFormData({ ...formData, message })}
                  placeholder="Full notification message"
                  placeholderTextColor="#999999"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Publish Date</Text>
                <DateTimePicker
                  value={formData.published_at}
                  onChange={(date) => setFormData({ ...formData, published_at: date })}
                  mode="datetime"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Expiration Date (Optional)</Text>
                <DateTimePicker
                  value={formData.expires_at || new Date()}
                  onChange={(date) => setFormData({ ...formData, expires_at: date })}
                  mode="datetime"
                  nullable
                  onClear={() => setFormData({ ...formData, expires_at: null })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Push Tap Destination</Text>
                <View style={styles.typeButtons}>
                  {([
                    { value: 'tab', label: 'App Tab' },
                    { value: 'deal', label: 'Deal' },
                    { value: 'url', label: 'Web URL' },
                  ] as { value: PushActionType; label: string }[]).map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.typeButton, formData.push_action_type === opt.value && styles.typeButtonActive]}
                      onPress={() => {
                        const defaultTarget = opt.value === 'tab' ? 'notifications' : '';
                        setFormData({ ...formData, push_action_type: opt.value, push_action_target: defaultTarget });
                      }}
                    >
                      <Text style={[styles.typeButtonText, formData.push_action_type === opt.value && styles.typeButtonTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {formData.push_action_type === 'tab' && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Which Tab?</Text>
                  <View style={styles.tabOptionsGrid}>
                    {TAB_OPTIONS.map((tab) => (
                      <TouchableOpacity
                        key={tab.value}
                        style={[styles.tabOption, formData.push_action_target === tab.value && styles.tabOptionActive]}
                        onPress={() => setFormData({ ...formData, push_action_target: tab.value })}
                      >
                        <Text style={[styles.tabOptionText, formData.push_action_target === tab.value && styles.tabOptionTextActive]}>
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {formData.push_action_type === 'deal' && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Select Deal</Text>
                  {deals.length === 0 ? (
                    <View style={styles.emptyDealsContainer}>
                      <Text style={styles.emptyDealsText}>No deals available</Text>
                    </View>
                  ) : (
                    <ScrollView style={styles.dealsSelector} showsVerticalScrollIndicator={false}>
                      {deals.map((deal) => (
                        <TouchableOpacity
                          key={deal.id}
                          style={[
                            styles.dealOption,
                            formData.push_action_target === deal.id && styles.dealOptionActive,
                          ]}
                          onPress={() => setFormData({ ...formData, push_action_target: deal.id })}
                        >
                          <View style={styles.dealOptionContent}>
                            <Text
                              style={[
                                styles.dealOptionTitle,
                                formData.push_action_target === deal.id && styles.dealOptionTitleActive,
                              ]}
                              numberOfLines={1}
                            >
                              {deal.title}
                            </Text>
                            <Text
                              style={[
                                styles.dealOptionPrice,
                                formData.push_action_target === deal.id && styles.dealOptionPriceActive,
                              ]}
                            >
                              ${deal.sale_price.toFixed(2)}
                            </Text>
                          </View>
                          {formData.push_action_target === deal.id && (
                            <View style={styles.dealSelectedIndicator} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}

              {formData.push_action_type === 'url' && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>URL</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.push_action_target}
                    onChangeText={(val) => setFormData({ ...formData, push_action_target: val })}
                    placeholder="https://www.6skates.com/products/..."
                    placeholderTextColor="#999999"
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                </View>
              )}

              <View style={styles.modalActions}>
                <View style={styles.actionButtonContainer}>
                  <Button
                    title="Cancel"
                    onPress={() => setModalVisible(false)}
                    variant="secondary"
                    fullWidth
                    disabled={saving}
                  />
                </View>
                <View style={styles.actionButtonContainer}>
                  <Button
                    title={saving ? 'Saving...' : (editingNotification ? 'Update' : 'Create')}
                    onPress={handleSave}
                    fullWidth
                    disabled={saving}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  notificationsList: {
    gap: Spacing.md,
  },
  notificationCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  notificationHeader: {
    marginBottom: Spacing.md,
  },
  notificationInfo: {
    gap: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  notificationTitle: {
    ...Typography.heading,
    color: '#000000',
    fontSize: 18,
    flex: 1,
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
  },
  notificationDetails: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  notificationPreview: {
    ...Typography.body,
    color: '#333333',
    marginBottom: Spacing.sm,
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
  },
  notificationActions: {
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
  pushButton: {
    backgroundColor: '#2563EB',
  },
  editButton: {
    backgroundColor: '#2563EB',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    ...Typography.hero,
    color: '#000000',
  },
  closeButton: {
    padding: Spacing.sm,
  },
  modalForm: {
    padding: Spacing.lg,
  },
  formErrorBanner: {
    backgroundColor: '#EF4444',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  formErrorText: {
    ...Typography.body,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.bodyBold,
    color: '#000000',
    marginBottom: Spacing.sm,
  },
  input: {
    ...Typography.body,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: '#000000',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  typeButtonText: {
    ...Typography.bodyBold,
    color: '#000000',
    textTransform: 'capitalize',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  actionButtonContainer: {
    flex: 1,
  },
  tabOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tabOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tabOptionActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  tabOptionText: {
    ...Typography.bodyBold,
    color: '#000000',
    fontSize: 14,
  },
  tabOptionTextActive: {
    color: '#FFFFFF',
  },
  dealsSelector: {
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: BorderRadius.md,
    backgroundColor: '#F5F5F5',
  },
  dealOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  dealOptionActive: {
    backgroundColor: '#2563EB',
  },
  dealOptionContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  dealOptionTitle: {
    ...Typography.bodyBold,
    color: '#000000',
    fontSize: 15,
    marginBottom: 4,
  },
  dealOptionTitleActive: {
    color: '#FFFFFF',
  },
  dealOptionPrice: {
    ...Typography.body,
    color: '#666666',
    fontSize: 13,
  },
  dealOptionPriceActive: {
    color: '#FFFFFF',
  },
  dealSelectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  emptyDealsContainer: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: BorderRadius.md,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  emptyDealsText: {
    ...Typography.body,
    color: '#666666',
  },
});
