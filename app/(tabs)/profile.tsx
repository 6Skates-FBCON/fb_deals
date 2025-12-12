import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { User, Mail, LogOut, Lock, ChevronRight, Calendar, Settings } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAdmin, signOut } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
      router.replace('/auth/login');
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      Alert.alert('Success', 'Password changed successfully');
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <User size={48} color={Colors.primary} strokeWidth={2} />
        </View>
        <Text style={styles.title}>My Profile</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Mail size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email || 'Not available'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Calendar size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Account Created</Text>
              <Text style={styles.infoValue}>
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Not available'}
              </Text>
            </View>
          </View>

          {isAdmin && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <Settings size={20} color={Colors.primary} strokeWidth={2} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Account Type</Text>
                  <Text style={[styles.infoValue, styles.adminBadge]}>
                    Administrator
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>

      {isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/admin')}
          >
            <View style={styles.iconContainer}>
              <Settings size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Deal Management</Text>
              <Text style={styles.actionSubtitle}>Add and manage flash deals</Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>

        {!showChangePassword ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowChangePassword(true)}
          >
            <View style={styles.iconContainer}>
              <Lock size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionText}>Change Password</Text>
              <Text style={styles.actionSubtext}>Update your password</Text>
            </View>
            <ChevronRight size={20} color={Colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        ) : (
          <View style={styles.changePasswordCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Enter new password"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Confirm new password"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setShowChangePassword(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={loading}
        >
          <LogOut size={20} color={Colors.white} strokeWidth={2} />
          <Text style={styles.signOutText}>{loading ? 'Signing Out...' : 'Sign Out'}</Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: Spacing.xl,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  title: {
    ...Typography.title,
    color: Colors.white,
    fontSize: 28,
    fontWeight: '700',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.heading,
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  infoCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...Typography.caption,
    color: Colors.white,
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    ...Typography.body,
    color: Colors.white,
    fontSize: 16,
  },
  adminBadge: {
    color: Colors.primary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    ...Typography.bodyBold,
    color: Colors.white,
    fontSize: 16,
    marginBottom: 4,
  },
  actionSubtitle: {
    ...Typography.caption,
    color: Colors.white,
    fontSize: 13,
  },
  actionText: {
    ...Typography.bodyBold,
    color: Colors.white,
    fontSize: 16,
    marginBottom: 4,
  },
  actionSubtext: {
    ...Typography.caption,
    color: Colors.white,
    fontSize: 13,
  },
  changePasswordCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.caption,
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.darkBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.white,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  button: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.darkBg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    ...Typography.bodyBold,
    color: Colors.white,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    ...Typography.bodyBold,
    color: Colors.white,
    fontSize: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  signOutText: {
    ...Typography.bodyBold,
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
});
