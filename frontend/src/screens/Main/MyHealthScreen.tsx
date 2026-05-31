import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { auth } from '../../../firebaseConfig';

export default function MyHealthScreen() {
  const [activeTab, setActiveTab] = useState<'trajectory' | 'forecast'>('trajectory');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
      
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
    } finally {
      setLoading(false);
    }
  };

  const calculateBMI = () => {
    if (!profile?.height || !profile?.weight) return 0;
    const heightInMeters = profile.height / 100;
    return parseFloat((profile.weight / (heightInMeters * heightInMeters)).toFixed(1));
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: '#3B82F6' };
    if (bmi < 25) return { category: 'Healthy Weight', color: '#10B981' };
    if (bmi < 30) return { category: 'Overweight', color: '#F59E0B' };
    return { category: 'Obese', color: '#EF4444' };
  };

  const bmi = calculateBMI();
  const bmiDetails = getBMICategory(bmi);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0056D2" />
        <Text style={styles.loadingText}>Loading health logs...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Health</Text>
        <Text style={styles.subtitle}>Preventive analysis and predictions</Text>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'trajectory' && styles.tabActive]}
          onPress={() => setActiveTab('trajectory')}
        >
          <Text style={[styles.tabText, activeTab === 'trajectory' && styles.tabTextActive]}>
            Overall Trajectory
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'forecast' && styles.tabActive]}
          onPress={() => setActiveTab('forecast')}
        >
          <Text style={[styles.tabText, activeTab === 'forecast' && styles.tabTextActive]}>
            Forecast
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'trajectory' ? (
          // Overall Trajectory Sub-tab
          <View style={styles.section}>
            {/* 1. Concern Areas Card */}
            <View style={styles.card}>
              <Text style={styles.cardHeader}>⚠️ Concern Areas</Text>
              
              {/* BMI indicator */}
              <View style={styles.concernRow}>
                <View style={[styles.statusDot, { backgroundColor: bmiDetails.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.concernTitle}>Body Mass Index (BMI)</Text>
                  <Text style={styles.concernDesc}>
                    Your BMI is {bmi} ({bmiDetails.category}). Healthy range is 18.5–24.9.
                  </Text>
                </View>
              </View>

              {/* Conditions indicator */}
              {profile?.preExistingConditions?.length > 0 ? (
                profile.preExistingConditions.map((cond: string, idx: number) => (
                  <View key={idx} style={[styles.concernRow, { marginTop: 12 }]}>
                    <View style={[styles.statusDot, { backgroundColor: '#EF4444' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.concernTitle}>Condition: {cond}</Text>
                      <Text style={styles.concernDesc}>
                        Routine glucose and physical activity checks are highly advised.
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={[styles.concernRow, { marginTop: 12 }]}>
                  <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.concernTitle}>Pre-existing Conditions</Text>
                    <Text style={styles.concernDesc}>No pre-existing conditions registered.</Text>
                  </View>
                </View>
              )}
            </View>

            {/* 2. Risk Assessment Card */}
            <View style={styles.card}>
              <Text style={styles.cardHeader}>📊 Health Risk Scores</Text>
              
              {/* Risk meter 1 */}
              <View style={styles.riskMeterContainer}>
                <View style={styles.riskHeaderRow}>
                  <Text style={styles.riskName}>Cardiovascular Health</Text>
                  <Text style={[styles.riskValue, { color: '#10B981' }]}>Low Risk (12%)</Text>
                </View>
                <View style={styles.meterTrack}>
                  <View style={[styles.meterFill, { width: '12%', backgroundColor: '#10B981' }]} />
                </View>
              </View>

              {/* Risk meter 2 */}
              <View style={[styles.riskMeterContainer, { marginTop: 16 }]}>
                <View style={styles.riskHeaderRow}>
                  <Text style={styles.riskName}>Metabolic Trajectory</Text>
                  <Text style={[styles.riskValue, { color: '#F59E0B' }]}>Moderate Risk (45%)</Text>
                </View>
                <View style={styles.meterTrack}>
                  <View style={[styles.meterFill, { width: '45%', backgroundColor: '#F59E0B' }]} />
                </View>
              </View>
            </View>

            {/* 3. Recommendations Card */}
            <View style={styles.card}>
              <Text style={styles.cardHeader}>💡 Personalized Recommendations</Text>
              
              <View style={styles.recItem}>
                <Text style={styles.recNumber}>1</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recTitle}>Aerobic Activity Plan</Text>
                  <Text style={styles.recDesc}>
                    Complete 30 minutes of brisk walking or swimming 5 days a week to lower metabolic risk scores.
                  </Text>
                </View>
              </View>

              <View style={[styles.recItem, { marginTop: 16 }]}>
                <Text style={styles.recNumber}>2</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recTitle}>Dietary Sodium Regulation</Text>
                  <Text style={styles.recDesc}>
                    Keep daily sodium consumption below 2,000 mg. Introduce potassium-dense veggies like spinach and avocados.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          // Forecast Sub-tab
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardHeader}>🔮 Preventive Vital Projection</Text>
              <Text style={styles.forecastSubtitle}>
                6-Month estimated wellness trends based on your profile and current activity.
              </Text>

              {/* Graphical representation of projected weight / metrics */}
              <View style={styles.chartContainer}>
                <View style={styles.chartBarGroup}>
                  <View style={[styles.chartBar, { height: 120, backgroundColor: '#3B82F6' }]} />
                  <Text style={styles.chartBarLabel}>Now</Text>
                  <Text style={styles.chartBarVal}>{profile?.weight || '70'}kg</Text>
                </View>
                <View style={styles.chartBarGroup}>
                  <View style={[styles.chartBar, { height: 105, backgroundColor: '#60A5FA' }]} />
                  <Text style={styles.chartBarLabel}>Month 2</Text>
                  <Text style={styles.chartBarVal}>{profile ? Math.max(50, profile.weight - 2) : '68'}kg</Text>
                </View>
                <View style={styles.chartBarGroup}>
                  <View style={[styles.chartBar, { height: 90, backgroundColor: '#93C5FD' }]} />
                  <Text style={styles.chartBarLabel}>Month 4</Text>
                  <Text style={styles.chartBarVal}>{profile ? Math.max(50, profile.weight - 4) : '66'}kg</Text>
                </View>
                <View style={styles.chartBarGroup}>
                  <View style={[styles.chartBar, { height: 85, backgroundColor: '#10B981' }]} />
                  <Text style={styles.chartBarLabel}>Month 6</Text>
                  <Text style={styles.chartBarVal}>{profile ? Math.max(50, profile.weight - 5) : '65'}kg</Text>
                </View>
              </View>

              <View style={styles.forecastBanner}>
                <Text style={styles.forecastBannerText}>
                  🎯 By matching daily steps target, you are on track to decrease your BMI score by 1.4 points in 6 months!
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFF',
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginHorizontal: 24,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#2563EB',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  section: {
    width: '100%',
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
  cardHeader: {
    fontSize: 16,
    fontWeight: '850',
    color: '#1E293B',
    marginBottom: 16,
  },
  concernRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  concernTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  concernDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 2,
  },
  riskMeterContainer: {
    width: '100%',
  },
  riskHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  riskName: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '700',
  },
  riskValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  meterTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    width: '100%',
  },
  meterFill: {
    height: '100%',
    borderRadius: 4,
  },
  recItem: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  recNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '800',
    fontSize: 14,
  },
  recTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  recDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 2,
  },
  forecastSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 18,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 180,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 16,
  },
  chartBarGroup: {
    alignItems: 'center',
    width: 60,
  },
  chartBar: {
    width: 24,
    borderRadius: 6,
  },
  chartBarLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
    fontWeight: '600',
  },
  chartBarVal: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '700',
    marginTop: 2,
  },
  forecastBanner: {
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  forecastBannerText: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '700',
    lineHeight: 18,
  },
});
