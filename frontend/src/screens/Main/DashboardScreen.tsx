import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';

export default function DashboardScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [recentReport, setRecentReport] = useState<any>(null);
  const [activity, setActivity] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
      
      // 1. Fetch backend User details to get MongoDB ID
      const userResponse = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid: user.uid }),
      });
      const userData = await userResponse.json();
      if (!userResponse.ok) throw new Error('User fetch failed');

      const mongoUserId = userData.user._id;

      // 2. Fetch User Profile
      const profileResponse = await fetch(`${API_BASE_URL}/api/profiles/${mongoUserId}`);
      const profiles = await profileResponse.json();
      if (profileResponse.ok && profiles.length > 0) {
        setProfile(profiles[0]);
      }

      // 3. Fetch Recent Report
      const reportResponse = await fetch(`${API_BASE_URL}/api/reports/${mongoUserId}`);
      const reports = await reportResponse.json();
      if (reportResponse.ok && reports.length > 0) {
        setRecentReport(reports[0]);
      }

      // 4. Fetch Recent Activity
      const activityResponse = await fetch(`${API_BASE_URL}/api/activities/${mongoUserId}`);
      const activities = await activityResponse.json();
      if (activityResponse.ok && activities.length > 0) {
        setActivity(activities[0]);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (e) {
      Alert.alert('Error', 'Logout failed');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Analyzing health status...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header Card */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>{profile?.name || 'Healthy User'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBadge} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Health Index Ring */}
        <View style={styles.vitalsOverviewCard}>
          <View style={styles.vitalsOverviewLeft}>
            <Text style={styles.cardHeader}>Overall Health Index</Text>
            <Text style={styles.indexScore}>84%</Text>
            <Text style={styles.indexStatus}>Vitals Stable & Optimal</Text>
          </View>
          <View style={styles.circularIndicatorContainer}>
            <View style={styles.radialRing} />
            <Text style={styles.radialText}>Good</Text>
          </View>
        </View>

        {/* 1. Upcoming Health Checkup */}
        <View style={styles.checkupCard}>
          <View style={styles.checkupIconBg}>
            <Text style={{ fontSize: 22 }}>📅</Text>
          </View>
          <View style={styles.checkupDetails}>
            <Text style={styles.checkupTitle}>Upcoming Health Checkup</Text>
            <Text style={styles.checkupDate}>June 12, 2026 at 10:30 AM</Text>
            <Text style={styles.checkupDoctor}>Dr. Anjali Sen • General Checkup</Text>
          </View>
        </View>

        {/* 2. Last Report Summary Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Last Report Summary</Text>
          {recentReport ? (
            <View style={styles.reportRow}>
              <View style={styles.reportIcon}>
                <Text style={{ fontSize: 20 }}>📊</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reportTitle}>{recentReport.title}</Text>
                <Text style={styles.reportDate}>
                  Uploaded on {new Date(recentReport.date).toLocaleDateString()}
                </Text>
                <View style={styles.metadataTagsRow}>
                  {Object.entries(recentReport.parsedData || {}).slice(0, 3).map(([key, val]: any) => (
                    <View key={key} style={styles.metaTag}>
                      <Text style={styles.metaTagText}>{key}: {val.split(' ')[0]}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No medical reports uploaded yet.</Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => navigation.navigate('ReportTimeline')}
              >
                <Text style={styles.emptyButtonText}>Upload Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 3. Daily Activity Preview */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>Daily Activity Preview</Text>
            <TouchableOpacity onPress={() => navigation.navigate('DailyActivity')}>
              <Text style={styles.viewMoreText}>Details</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activityStatsRow}>
            <View style={styles.activityStatBox}>
              <Text style={styles.activityStatLabel}>Steps</Text>
              <Text style={styles.activityStatValue}>{activity?.steps || '0'} / 8,000</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${Math.min(((activity?.steps || 0) / 8000) * 100, 100)}%` }]} />
              </View>
            </View>
            <View style={styles.activityStatBox}>
              <Text style={styles.activityStatLabel}>Distance</Text>
              <Text style={styles.activityStatValue}>{activity?.distance || '0'} km</Text>
              <Text style={styles.activityStatSub}>Goal: 5.0 km</Text>
            </View>
          </View>
        </View>

        {/* 4. My Family (Quick Actions) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>My Family Log</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.familyScrollView}>
            {/* Primary Profile */}
            <View style={styles.familyAvatarContainer}>
              <View style={[styles.familyAvatar, { backgroundColor: '#3B82F6' }]}>
                <Text style={styles.familyAvatarInitial}>{profile?.name ? profile.name[0] : 'U'}</Text>
              </View>
              <Text style={styles.familyNameText}>You</Text>
            </View>
            {/* Add Member Button */}
            <TouchableOpacity 
              style={styles.familyAvatarContainer}
              onPress={() => navigation.navigate('More')}
            >
              <View style={[styles.familyAvatar, { backgroundColor: '#F1F5F9', borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#94A3B8' }]}>
                <Text style={[styles.familyAvatarInitial, { color: '#64748B' }]}>+</Text>
              </View>
              <Text style={[styles.familyNameText, { color: '#64748B' }]}>Add Member</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 5. Latest Blog Card */}
        <View style={[styles.card, { marginBottom: 32 }]}>
          <Text style={styles.sectionTitle}>Latest Health Articles</Text>
          <View style={styles.blogCard}>
            <View style={styles.blogImagePlaceholder}>
              <Text style={{ fontSize: 24 }}>🥗</Text>
            </View>
            <View style={styles.blogDetails}>
              <Text style={styles.blogTitle}>Preventive Nutrition: Foods that lower heart risks</Text>
              <Text style={styles.blogReadTime}>5 mins read • Wellness</Text>
            </View>
          </View>
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
  scrollContent: {
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  userName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
  },
  logoutBadge: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  vitalsOverviewCard: {
    backgroundColor: '#1E3A8A', // Deep primary blue card
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  vitalsOverviewLeft: {
    flex: 1.2,
  },
  cardHeader: {
    fontSize: 12,
    color: '#BFDBFE',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  indexScore: {
    fontSize: 44,
    fontWeight: '900',
    color: '#fff',
  },
  indexStatus: {
    fontSize: 14,
    color: '#93C5FD',
    fontWeight: '500',
    marginTop: 4,
  },
  circularIndicatorContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#22C55E', // Green optimal border
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  radialRing: {
    position: 'absolute',
  },
  radialText: {
    color: '#22C55E',
    fontWeight: '800',
    fontSize: 14,
  },
  checkupCard: {
    backgroundColor: '#FFE5D9', // Soft orange alert
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFD0B8',
  },
  checkupIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  checkupDetails: {
    flex: 1,
  },
  checkupTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#7C2D12',
  },
  checkupDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C2410C',
    marginTop: 2,
  },
  checkupDoctor: {
    fontSize: 12,
    color: '#9A3412',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
  },
  viewMoreText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  reportDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  metadataTagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  metaTag: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  metaTagText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 12,
  },
  emptyButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  activityStatsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  activityStatBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  activityStatLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  activityStatValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginVertical: 4,
  },
  activityStatSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginTop: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  familyScrollView: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 4,
  },
  familyAvatarContainer: {
    alignItems: 'center',
    gap: 6,
  },
  familyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  familyAvatarInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  familyNameText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  blogCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blogImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  blogDetails: {
    flex: 1,
  },
  blogTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 18,
  },
  blogReadTime: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '700',
    marginTop: 4,
  },
});
