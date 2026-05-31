import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { RecaptchaVerifier, signInWithPhoneNumber, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';
import { API_BASE_URL } from '../../config';

// Custom Cross-Platform Heart Logo Component
const LogoIcon = ({ size = 48 }: { size?: number }) => {
  const innerSize = size * 0.8;
  return (
    <View style={[styles.logoContainer, { width: size, height: size }]}>
      <View style={[styles.logoHouseBase, { width: innerSize * 0.7, height: innerSize * 0.7, borderRadius: innerSize * 0.15 }]} />
      <View style={[styles.logoHouseRoof, {
        borderLeftWidth: innerSize * 0.45,
        borderRightWidth: innerSize * 0.45,
        borderBottomWidth: innerSize * 0.4,
        bottom: innerSize * 0.55
      }]} />
      <Text style={[styles.logoHeartText, { fontSize: innerSize * 0.45, bottom: innerSize * 0.1 }]}>❤️</Text>
    </View>
  );
};

export default function LoginScreen({ navigation }: any) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

  // Auto-login returning users
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoading(true);
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              firebaseUid: user.uid,
              phoneNumber: user.phoneNumber || undefined,
              email: user.email || undefined,
            }),
          });

          const data = await response.json();
          if (response.ok) {
            if (data.hasProfile) {
              navigation.replace('Main');
            } else {
              navigation.replace('Onboarding', { userId: data.user._id });
            }
          }
        } catch (error) {
          console.error('Auto-login check failed:', error);
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Set up recaptcha for web
  useEffect(() => {
    try {
      if (!recaptchaVerifier.current && Platform.OS === 'web') {
        recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
      }
    } catch (e: any) {
      console.warn('RecaptchaVerifier failed to initialize without DOM context', e);
    }
  }, []);

  const handleLogin = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Invalid Input', 'Please enter a valid 10-digit phone number.');
      return;
    }

    let formattedPhoneNumber = phoneNumber.replace(/[^0-9+]/g, '');
    if (!formattedPhoneNumber.startsWith('+')) {
      formattedPhoneNumber = `+91${formattedPhoneNumber}`;
    }

    setLoading(true);
    try {
      let appVerifier = recaptchaVerifier.current;
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier as any);
      
      navigation.navigate('OtpVerification', { 
        verificationId: confirmationResult.verificationId, 
        phoneNumber: formattedPhoneNumber 
      });
    } catch (error: any) {
      console.error(error);
      Alert.alert('Authentication Error', error.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      let firebaseUser;

      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        firebaseUser = userCredential.user;
      } else {
        // Expo Go Mobile: Simulate Google login to prevent native module crashes.
        // `@react-native-google-signin/google-signin` requires pre-compiling native binaries
        // which are not supported inside the standard Expo Go client app.
        Alert.alert(
          'Google Sign-In (Expo Go)',
          'To use real Google Sign-In on a mobile device, you need a custom Expo Development Build.\n\nFor testing inside Expo Go, we will simulate a login with your Google Account.',
          [
            {
              text: 'Continue as urajveer7@gmail.com',
              onPress: async () => {
                setLoading(true);
                try {
                  const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      firebaseUid: 'google_expo_go_mock_uid_urajveer7',
                      email: 'urajveer7@gmail.com',
                    }),
                  });
                  const data = await response.json();
                  if (!response.ok) throw new Error(data.error || 'Failed to verify on backend');

                  if (data.hasProfile) {
                    navigation.replace('Main');
                  } else {
                    navigation.replace('Onboarding', { userId: data.user._id });
                  }
                } catch (e: any) {
                  Alert.alert('Login Error', e.message);
                } finally {
                  setLoading(false);
                }
              }
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
        setLoading(false);
        return;
      }

      // Verify/Register user on our backend (Web Flow)
      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email,
          phoneNumber: firebaseUser.phoneNumber || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify on backend');
      }

      if (data.hasProfile) {
        navigation.replace('Main');
      } else {
        navigation.replace('Onboarding', { userId: data.user._id });
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/operation-not-allowed' || error.message?.includes('operation-not-allowed')) {
        Alert.alert(
          'Google Sign-In Disabled',
          'Google Sign-In is not enabled in your Firebase project.\n\nTo enable it:\n1. Go to the Firebase Console.\n2. Open "Authentication" -> "Sign-in method" tab.\n3. Click "Add new provider" and select "Google".\n4. Turn on the "Enable" switch, configure your project support email, and click Save.'
        );
      } else {
        Alert.alert('Google Login Failed', error.message || 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
      >
        <View style={styles.header}>
          <LogoIcon size={56} />
          <Text style={styles.title}>Enter your{'\n'}mobile number</Text>
          <Text style={styles.subtitle}>We will send you a code</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Custom phone input showing +91 prefix exactly like mockup */}
          <View style={styles.phoneInputRow}>
            <Text style={styles.countryCodeText}>+91</Text>
            <View style={styles.verticalDivider} />
            <TextInput
              style={styles.input}
              placeholder="00000 00000"
              keyboardType="phone-pad"
              maxLength={10}
              value={phoneNumber}
              onChangeText={(txt) => setPhoneNumber(txt.replace(/[^0-9]/g, ''))}
              placeholderTextColor="#CBD5E1"
            />
          </View>
          
          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.primaryButtonText}>CONTINUE</Text>
                <View style={styles.arrowCircle}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* Invisible container for recaptcha specifically targeting web builds */}
          <View id="recaptcha-container"></View>

          <View style={styles.dividerContainer}>
             <View style={styles.divider} />
             <Text style={styles.dividerText}>OR</Text>
             <View style={styles.divider} />
          </View>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleGoogleLogin} disabled={loading}>
            <View style={styles.googleButtonContent}>
              <Text style={styles.googleIconText}>G</Text>
              <Text style={styles.secondaryButtonText}>Continue with Google</Text>
            </View>
          </TouchableOpacity>
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
  header: {
    alignItems: 'flex-start',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E293B',
    lineHeight: 38,
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 60,
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  countryCodeText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginRight: 12,
  },
  verticalDivider: {
    width: 1.5,
    height: 24,
    backgroundColor: '#CBD5E1',
    marginRight: 16,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 1.5,
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FAFAFA',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  googleIconText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#EA4335',
  },
  secondaryButtonText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },

  // Logo styles
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoHouseBase: {
    backgroundColor: '#2563EB',
    position: 'absolute',
  },
  logoHouseRoof: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#1D4ED8',
  },
  logoHeartText: {
    position: 'absolute',
  },
});
