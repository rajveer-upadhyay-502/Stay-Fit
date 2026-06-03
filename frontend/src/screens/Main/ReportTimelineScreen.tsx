import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Platform, Modal, Alert } from 'react-native';
import { auth } from '../../../firebaseConfig';
import { API_BASE_URL } from '../../config';
import { useUser } from '../../context/UserContext';

export default function ReportTimelineScreen() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeUploadMode, setActiveUploadMode] = useState<'scan' | 'upload' | 'connect' | 'manual' | null>(null);

  // Manual Form States
  const [manualTitle, setManualTitle] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploading, setUploading] = useState(false);
  const { mongoUserId, token } = useUser();

  useEffect(() => {
    if (mongoUserId) {
      fetchReports();
    }
  }, [mongoUserId]);

  const fetchReports = async () => {
    if (!mongoUserId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports/${mongoUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const reportsList = await res.json();
      if (res.ok) {
        setReports(reportsList);
      }
    } catch (e) {
      console.error('Error fetching reports:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReport = async (title: string, type: 'Scan' | 'Upload' | 'Connect' | 'Manual', extraData?: any) => {
    if (!mongoUserId) return;

    if (!title || title.trim() === '') {
      Alert.alert('Validation Error', 'Please enter a report title.');
      return;
    }

    if (type === 'Manual') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(manualDate)) {
        Alert.alert('Invalid Date Format', 'Please enter the date in YYYY-MM-DD format.');
        return;
      }
      const parsedDate = new Date(manualDate);
      if (isNaN(parsedDate.getTime())) {
        Alert.alert('Invalid Date', 'Please enter a valid calendar date.');
        return;
      }
    }

    setUploading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: mongoUserId,
          title,
          type,
          date: type === 'Manual' ? manualDate : new Date().toISOString().split('T')[0],
          parsedData: extraData,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to save report');
      }

      Alert.alert('Report Saved', `Successfully recorded report "${title}"!`);
      
      // Reset States
      setModalVisible(false);
      setActiveUploadMode(null);
      setManualTitle('');
      
      // Refresh timeline
      fetchReports();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add report.');
    } finally {
      setUploading(false);
    }
  };

  const handleSimulation = (type: 'Scan' | 'Upload' | 'Connect') => {
    setUploading(true);
    setTimeout(() => {
      let mockTitle = '';
      let mockData = {};
      if (type === 'Scan') {
        mockTitle = 'Optical Scan Result: CBC Panel';
        mockData = {
          'White Blood Cells': '6.4 x10^3/uL',
          'Red Blood Cells': '4.8 x10^6/uL',
          'Platelets': '240,000 /uL',
        };
      } else if (type === 'Upload') {
        mockTitle = 'Uploaded File: Thyroid Report';
        mockData = {
          'T3 Total': '1.2 ng/mL',
          'T4 Free': '1.1 ng/dL',
          'TSH': '2.4 uIU/mL',
        };
      } else {
        mockTitle = 'Synced Account: HealthKit Vitals';
        mockData = {
          'Avg Heart Rate': '68 bpm',
          'Active Energy': '420 kcal',
          'Sleep Duration': '7h 15m',
        };
      }
      handleAddReport(mockTitle, type, mockData);
    }, 1500); // simulate delay
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Report Timeline</Text>
          <Text style={styles.subtitle}>Your medical folder history</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+ ADD</Text>
        </TouchableOpacity>
      </View>

      {/* Reports Timeline Scrollview */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : reports.length > 0 ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {reports.map((report, idx) => (
            <View key={report._id} style={styles.timelineItem}>
              {/* Timeline Connector Line and Bullet */}
              <View style={styles.timelineLeftColumn}>
                <View style={styles.timelineDot} />
                {idx < reports.length - 1 && <View style={styles.timelineLine} />}
              </View>

              {/* Report Detail Card */}
              <View style={styles.reportCard}>
                <View style={styles.reportHeaderRow}>
                  <Text style={styles.reportTitle}>{report.title}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: report.type === 'Manual' ? '#E0F2FE' : '#F3E5F5' }]}>
                    <Text style={[styles.typeBadgeText, { color: report.type === 'Manual' ? '#0369A1' : '#7B1FA2' }]}>
                      {report.type}
                    </Text>
                  </View>
                </View>
                <Text style={styles.reportDate}>
                  📅 {new Date(report.date).toLocaleDateString()}
                </Text>

                {/* Parsed metrics details */}
                <View style={styles.parsedMetricsContainer}>
                  {Object.entries(report.parsedData || {}).map(([key, val]: any) => (
                    <View key={key} style={styles.metricRow}>
                      <Text style={styles.metricKey}>{key}</Text>
                      <Text style={styles.metricVal}>{val}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📂</Text>
          <Text style={styles.emptyTitle}>No Medical Reports</Text>
          <Text style={styles.emptySubtitle}>
            Keep track of your health records by scanning, uploading, or syncing them.
          </Text>
          <TouchableOpacity style={styles.primaryActionBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.primaryActionBtnText}>Upload First Report</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Report Action Sheet / Popup Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Report</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); setActiveUploadMode(null); }}>
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            {activeUploadMode === null ? (
              // Upload options grid
              <View style={styles.optionsGrid}>
                <TouchableOpacity style={styles.optionBox} onPress={() => handleSimulation('Scan')}>
                  <Text style={styles.optionIcon}>📸</Text>
                  <Text style={styles.optionTitle}>By Scan</Text>
                  <Text style={styles.optionDesc}>Camera OCR extract</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionBox} onPress={() => handleSimulation('Upload')}>
                  <Text style={styles.optionIcon}>📁</Text>
                  <Text style={styles.optionTitle}>By Upload</Text>
                  <Text style={styles.optionDesc}>PDF or image upload</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionBox} onPress={() => handleSimulation('Connect')}>
                  <Text style={styles.optionIcon}>🔗</Text>
                  <Text style={styles.optionTitle}>By Connect</Text>
                  <Text style={styles.optionDesc}>Sync Apple/Fit accounts</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionBox} onPress={() => setActiveUploadMode('manual')}>
                  <Text style={styles.optionIcon}>✏️</Text>
                  <Text style={styles.optionTitle}>By Manual</Text>
                  <Text style={styles.optionDesc}>Type vital details</Text>
                </TouchableOpacity>
              </View>
            ) : uploading ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.uploadingText}>Processing Document and extracting vitals...</Text>
              </View>
            ) : (
              // Manual Form Input
              <View style={styles.manualForm}>
                <Text style={styles.formLabel}>Report / Vital Name</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Heart Rate Log, Fasting Blood Sugar"
                  value={manualTitle}
                  onChangeText={setManualTitle}
                />
                
                <Text style={styles.formLabel}>Date of measurement</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="YYYY-MM-DD"
                  value={manualDate}
                  onChangeText={setManualDate}
                />

                <TouchableOpacity 
                  style={styles.submitFormBtn} 
                  onPress={() => handleAddReport(manualTitle, 'Manual')}
                >
                  <Text style={styles.submitFormBtnText}>Save Entry</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Simulating uploading loader overlay for simulated options */}
            {activeUploadMode === null && uploading && (
              <View style={styles.simulatedOverlay}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.simulatedOverlayText}>Extracting health indicators...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeftColumn: {
    alignItems: 'center',
    width: 32,
    marginRight: 8,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#EFF6FF',
    zIndex: 2,
    marginTop: 18,
  },
  timelineLine: {
    position: 'absolute',
    top: 28,
    bottom: -28,
    width: 2,
    backgroundColor: '#E2E8F0',
    zIndex: 1,
  },
  reportCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  reportHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    flex: 1,
  },
  typeBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  reportDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 12,
  },
  parsedMetricsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
  },
  metricKey: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  metricVal: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryActionBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  primaryActionBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Modal Action Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 340,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  closeModalText: {
    fontSize: 20,
    color: '#64748B',
    fontWeight: '600',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  optionBox: {
    width: '47%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  optionDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  uploadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  uploadingText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  manualForm: {
    width: '100%',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  formInput: {
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1E293B',
    marginBottom: 20,
  },
  submitFormBtn: {
    backgroundColor: '#2563EB',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitFormBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  simulatedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  simulatedOverlayText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 16,
    fontWeight: '600',
  },
});
