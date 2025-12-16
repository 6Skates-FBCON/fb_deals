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
import { Plus, Edit2, Trash2, X, Calendar, Megaphone, Bell } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Notification, NotificationType } from '@/types/notification';
import { Button } from '@/components/Button';
import { DateTimePicker } from '@/components/DateTimePicker';

export default function AdminNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);

  const [formData, setFormData] = useState({
    type: 'announcement' as NotificationType,
    title: '',
    message: '',
    preview: '',
    published_at: new Date(),
    expires_at: null as Date | null,
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

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const openCreateModal = () => {
    setEditingNotification(null);
    setFormData({
      type: 'announcement',
      title: '',
      message: '',
      preview: '',
      published_at: new Date(),
      expires_at: null,
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
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.message.trim() || !formData.preview.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const notificationData = {
        type: formData.type,
        title: formData.title.trim(),
        message: formData.message.trim(),
        preview: formData.preview.trim(),
        published_at: formData.published_at.toISOString(),
        expires_at: formData.expires_at ? formData.expires_at.toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      if (editingNotification) {
        const { error } = await supabase
          .from('notifications')
          .update(notificationData)
          .eq('id', editingNotification.id);

        if (error) throw error;
        Alert.alert('Success', 'Notification updated successfully');
      } else {
        const { error } = await supabase
          .from('notifications')
          .insert([notificationData]);

        if (error) throw error;
        Alert.alert('Success', 'Notification created successfully');
      }

      setModalVisible(false);
      fetchNotifications();
    } catch (error: any) {
      console.error('Error saving notification:', error);
      Alert.alert('Error', error?.message || 'Failed to save notification');
    }
  };

  const handleDelete = async (notificationId: string) => {
    Alert.alert('Delete Notification', 'Are you sure you want to delete this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('notifications')
              .delete()
              .eq('id', notificationId);

            if (error) throw error;
            Alert.alert('Success', 'Notification deleted successfully');
            fetchNotifications();
          } catch (error: any) {
            console.error('Error deleting notification:', error);
            Alert.alert('Error', error?.message || 'Failed to delete notification');
          }
        },
      },
    ]);
  };

  const getIcon = (type: NotificationType) => {
    const size = 20;
    const color = Colors.primary;

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
                  </View>

                  <View style={styles.notificationActions}>
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
                <X size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
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
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Preview Text</Text>
                <TextInput
                  style={styles.input}
                  value={formData.preview}
                  onChangeText={(preview) => setFormData({ ...formData, preview })}
                  placeholder="Short preview for the list"
                  placeholderTextColor={Colors.textSecondary}
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
                  placeholderTextColor={Colors.textSecondary}
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

              <View style={styles.modalActions}>
                <View style={styles.actionButtonContainer}>
                  <Button title="Cancel" onPress={() => setModalVisible(false)} variant="secondary" fullWidth />
                </View>
                <View style={styles.actionButtonContainer}>
                  <Button title={editingNotification ? 'Update' : 'Create'} onPress={handleSave} fullWidth />
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
    backgroundColor: Colors.darkBg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.darkBg,
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
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
    color: Colors.white,
    flex: 1,
  },
  retryButton: {
    backgroundColor: Colors.white,
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
  notificationsList: {
    gap: Spacing.md,
  },
  notificationCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    color: Colors.white,
    fontSize: 18,
    flex: 1,
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
  },
  notificationDetails: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  notificationPreview: {
    ...Typography.body,
    color: Colors.white,
    marginBottom: Spacing.sm,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.darkBg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    ...Typography.hero,
    color: Colors.white,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  modalForm: {
    padding: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.bodyBold,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  input: {
    ...Typography.body,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.white,
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
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeButtonText: {
    ...Typography.bodyBold,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  typeButtonTextActive: {
    color: Colors.white,
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
});
