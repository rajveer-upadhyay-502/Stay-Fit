import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';
import { API_BASE_URL } from '../../config';

export default function MoreScreen({ navigation }: any) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const userRes = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid: user.uid }),
      });
      const userData = await userRes.json();
      
      const res = await fetch(`${API_BASE_URL}/api/profiles/${userData.user._id}`);
      const profiles = await res.json();
      if (res.ok && profiles.length > 0) {
        setProfile(profiles[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to log out.');
    }
  };

  const menuItems = [
    { title: 'My Profile', icon: '👤', subtitle: `${profile?.gender || 'Male'}, ${profile?.age || '25'} years`, action: () => Alert.alert('Profile Info', `Name: ${profile?.name}\nAge: ${profile?.age}\nHeight: ${profile?.height}cm\nWeight: ${profile?.weight}kg`) },
    { title: 'Report Vault', icon: '🗄️', subtitle: 'Access physical PDF/scanned archives', action: () => navigation.navigate('ReportTimeline') },
    { title: 'Invite Family', icon: '👨‍👩‍👧‍👦', subtitle: 'Share medical records with relatives', action: () => Alert.alert('Invite Family', 'Feature coming soon! You will be able to link family profiles.') },
    { title: 'Need Help?', icon: '💬', subtitle: '24/7 support line & consultations', action: () => Alert.alert('Support Helpline', 'Contact support at: support@stayfit.com') },
    { title: 'Latest Blogs', icon: '📰', subtitle: 'Read medical and nutrition feeds', action: () => Alert.alert('Stay-Fit Blog', 'Loading wellness feeds...') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>More</Text>
        <Text style={styles.subtitle}>Account settings and health resources</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card Header */}
        <View style={styles.profileSummaryCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile?.name ? profile.name[0] : 'U'}</Text>
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>{profile?.name || 'Healthy User'}</Text>
            <Text style={styles.profileEmail}>
              {auth.currentUser?.email || auth.currentUser?.phoneNumber || 'No verified email/phone'}
            </Text>
          </View>
        </View>

        {/* Dynamic menu list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Application Settings</Text>
          <View style={styles.menuList}>
            {menuItems.map((item, idx) => (
              <TouchableOpacity key={idx} style={styles.menuItem} onPress={item.action}>
                <View style={styles.menuItemIconBg}>
                  <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
                <Text style={styles.arrowRight}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Toggles section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.togglesCard}>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Push Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
                thumbColor={notificationsEnabled ? '#2563EB' : '#F1F5F9'}
              />
            </View>
            <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.toggleLabel}>Weekly Health Report Email</Text>
              <Switch
                value={emailAlertsEnabled}
                onValueChange={setEmailAlertsEnabled}
                trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
                thumbColor={emailAlertsEnabled ? '#2563EB' : '#F1F5F9'}
              />
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>

        {/* Legal Text footer */}
        <View style={styles.legalFooter}>
          <Text style={styles.legalText}>About Us • Privacy Policy • Terms & Conditions</Text>
          <Text style={styles.versionText}>STAY-FIT v1.0.0 • Production Release</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  profileSummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2563EB',
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '850',
    color: '#1E293B',
  },
  profileEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingLeft: 4,
  },
  menuList: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
  },
  menuItemIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  arrowRight: {
    fontSize: 20,
    color: '#94A3B8',
    fontWeight: '500',
  },
  togglesCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
  },
  toggleLabel: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoutButtonText: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: 15,
  },
  legalFooter: {
    alignItems: 'center',
    gap: 6,
  },
  legalText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  versionText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
