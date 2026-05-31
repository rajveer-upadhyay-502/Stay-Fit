import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { auth } from '../../../firebaseConfig';
import { API_BASE_URL } from '../../config';

export default function DailyActivityScreen() {
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState(6000);
  const [distance, setDistance] = useState(4.2);
  const [stepLength, setStepLength] = useState(72);
  const [flights, setFlights] = useState(8);
  const [asymmetry, setAsymmetry] = useState(2.4);
  const [mongoUserId, setMongoUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRes = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid: user.uid }),
      });
      const userData = await userRes.json();
      setMongoUserId(userData.user._id);

      const res = await fetch(`${API_BASE_URL}/api/activities/${userData.user._id}`);
      const activities = await res.json();
      
      if (res.ok && activities.length > 0) {
        const act = activities[0];
        setSteps(act.steps);
        setDistance(act.distance);
        setStepLength(act.stepLength);
        setFlights(act.flights);
        setAsymmetry(act.asymmetry);
      }
    } catch (e) {
      console.error('Failed to load activity:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveActivity = async (newSteps: number, newDist: number) => {
    if (!mongoUserId) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: mongoUserId,
          steps: newSteps,
          distance: parseFloat(newDist.toFixed(2)),
          stepLength,
          flights,
          asymmetry,
          date: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to update activity');
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const adjustSteps = (amount: number) => {
    const nextSteps = Math.max(0, steps + amount);
    // Rough calculation: 1 step ~ 0.7 meters
    const nextDistance = (nextSteps * 0.7) / 1000;
    
    setSteps(nextSteps);
    setDistance(nextDistance);
    
    handleSaveActivity(nextSteps, nextDistance);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Syncing pedometer logs...</Text>
      </SafeAreaView>
    );
  }

  const stepsGoal = 8000;
  const progressPercent = Math.min((steps / stepsGoal) * 100, 100);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Daily Activity</Text>
        <Text style={styles.subtitle}>Real-time pedometer and vital metrics</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Steps Progress Ring (Interactive visual) */}
        <View style={styles.radialProgressCard}>
          <View style={styles.radialHeader}>
            <Text style={styles.radialLabel}>Steps Progress</Text>
            {saving && <ActivityIndicator size="small" color="#10B981" />}
          </View>
          <Text style={styles.stepsValueText}>{steps.toLocaleString()}</Text>
          <Text style={styles.stepsTargetText}>of {stepsGoal.toLocaleString()} steps</Text>

          {/* Graphical Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>

          {/* Stepper Controls */}
          <View style={styles.adjustRow}>
            <TouchableOpacity style={styles.adjustButton} onPress={() => adjustSteps(-1000)}>
              <Text style={styles.adjustButtonText}>- 1k Steps</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.adjustButton, styles.adjustButtonAdd]} onPress={() => adjustSteps(1000)}>
              <Text style={[styles.adjustButtonText, styles.adjustButtonTextAdd]}>+ 1k Steps</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Secondary Metrics Grid */}
        <View style={styles.metricsGrid}>
          {/* Distance Box */}
          <View style={styles.metricBox}>
            <Text style={styles.metricIcon}>📍</Text>
            <Text style={styles.metricLabel}>Distance</Text>
            <Text style={styles.metricValue}>{distance.toFixed(2)} km</Text>
            <Text style={styles.metricSub}>Goal: 5.6 km</Text>
          </View>

          {/* Step Length Box */}
          <View style={styles.metricBox}>
            <Text style={styles.metricIcon}>📏</Text>
            <Text style={styles.metricLabel}>Step Length</Text>
            <Text style={styles.metricValue}>{stepLength} cm</Text>
            <Text style={styles.metricSub}>Optimal range: 70-76</Text>
          </View>

          {/* Flights Climbed Box */}
          <View style={styles.metricBox}>
            <Text style={styles.metricIcon}>🪜</Text>
            <Text style={styles.metricLabel}>Flights Climbed</Text>
            <Text style={styles.metricValue}>{flights} floors</Text>
            <Text style={styles.metricSub}>Goal: 10 floors</Text>
          </View>

          {/* Walking Asymmetry Box */}
          <View style={styles.metricBox}>
            <Text style={styles.metricIcon}>⚖️</Text>
            <Text style={styles.metricLabel}>Walking Asymmetry</Text>
            <Text style={[styles.metricValue, { color: asymmetry > 5 ? '#EF4444' : '#10B981' }]}>
              {asymmetry}%
            </Text>
            <Text style={styles.metricSub}>Target: Under 3.0%</Text>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  radialProgressCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  radialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  radialLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepsValueText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#1E293B',
  },
  stepsTargetText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 20,
  },
  progressBarContainer: {
    width: '100%',
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    marginBottom: 24,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 5,
  },
  adjustRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  adjustButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  adjustButtonAdd: {
    backgroundColor: '#E6FBF3',
    borderColor: '#10B981',
  },
  adjustButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  adjustButtonTextAdd: {
    color: '#047857',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    width: '100%',
  },
  metricBox: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  metricIcon: {
    fontSize: 22,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginVertical: 4,
  },
  metricSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
