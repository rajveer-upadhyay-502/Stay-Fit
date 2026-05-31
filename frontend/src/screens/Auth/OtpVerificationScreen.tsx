import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';
import { API_BASE_URL } from '../../config';

export default function OtpVerificationScreen({ route, navigation }: any) {
  const { verificationId, phoneNumber } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(20); // 20-second timer as in mockup

  useEffect(() => {
    let interval: any = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerifyOtp = async (textCode = code) => {
    if (!textCode || textCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, textCode);
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;
      
      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: firebaseUser.uid,
          phoneNumber: firebaseUser.phoneNumber || phoneNumber,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify user on backend');
      }

      if (data.hasProfile) {
        navigation.replace('Main');
      } else {
        navigation.replace('Onboarding', { userId: data.user._id });
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Verification Failed', error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (timer > 0) return;
    
    // Reset timer
    setTimer(20);
    Alert.alert('OTP Resent', 'A new verification code has been requested.');
    
    // In actual implementation, we would call signInWithPhoneNumber again
  };

  const formatTimer = (secs: number) => {
    return secs < 10 ? `00:0${secs}` : `00:${secs}`;
  };

  const handleTextChange = (txt: string) => {
    const numericCode = txt.replace(/[^0-9]/g, '');
    setCode(numericCode);
    if (numericCode.length === 6) {
      handleVerifyOtp(numericCode);
    }
  };

  // Helper to render individual OTP boxes using overlay style
  const renderOtpBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      const char = code[i] || '';
      const isFocused = code.length === i;
      boxes.push(
        <View 
          key={i} 
          style={[
            styles.otpBox, 
            char ? styles.otpBoxFilled : null,
            isFocused ? styles.otpBoxFocused : null
          ]}
        >
          <Text style={styles.otpBoxText}>{char}</Text>
        </View>
      );
    }
    return boxes;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Enter the code sent{'\n'}to your number</Text>
          <Text style={styles.subtitle}>We sent the code to {phoneNumber}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.editNumberText}>EDIT NUMBER</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          {/* OTP Grid Wrapper */}
          <View style={styles.otpContainer}>
            {renderOtpBoxes()}
            
            {/* Hidden Input field overlaying the visual boxes */}
            <TextInput
              style={styles.hiddenInput}
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={handleTextChange}
              caretHidden
            />
          </View>

          {/* Confirm Button */}
          <TouchableOpacity style={styles.primaryButton} onPress={() => handleVerifyOtp()} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.primaryButtonText}>VERIFY & CONTINUE</Text>
                <View style={styles.arrowCircle}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* Resend Options Footer */}
          <View style={styles.resendRow}>
            <Text style={styles.resendTimerText}>
              Didn't receive the code? Resend in{' '}
              <Text style={{ fontWeight: '700' }}>{formatTimer(timer)}</Text>
            </Text>
            <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
              <Text style={[styles.resendLinkText, timer > 0 ? styles.resendLinkDisabled : null]}>
                RESEND OTP
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 24,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: '#1E293B',
    fontWeight: '800',
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E293B',
    lineHeight: 38,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  editNumberText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  formContainer: {
    width: '100%',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    height: 60,
    marginBottom: 48,
    position: 'relative',
  },
  otpBox: {
    width: '14%',
    height: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFilled: {
    borderColor: '#94A3B8',
  },
  otpBoxFocused: {
    borderColor: '#3B82F6',
    backgroundColor: '#fff',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  otpBoxText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
    zIndex: 99,
    // Web specific text inputs selection properties to ensure it spans full view
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      }
    })
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    bottom: 1,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 4,
  },
  resendTimerText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  resendLinkText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  resendLinkDisabled: {
    color: '#94A3B8',
  },
});
