import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');

// Custom Cross-Platform Heart Logo Component using Native Views
const LogoIcon = ({ size = 60 }: { size?: number }) => {
  const innerSize = size * 0.8;
  return (
    <View style={[styles.logoContainer, { width: size, height: size }]}>
      {/* House Base */}
      <View style={[styles.logoHouseBase, { width: innerSize * 0.7, height: innerSize * 0.7, borderRadius: innerSize * 0.15 }]} />
      {/* House Roof */}
      <View style={[styles.logoHouseRoof, {
        borderLeftWidth: innerSize * 0.45,
        borderRightWidth: innerSize * 0.45,
        borderBottomWidth: innerSize * 0.4,
        bottom: innerSize * 0.55
      }]} />
      {/* White Heart Symbol */}
      <Text style={[styles.logoHeartText, { fontSize: innerSize * 0.45, bottom: innerSize * 0.1 }]}>❤️</Text>
    </View>
  );
};

export default function WelcomeScreen({ navigation }: any) {
  const [step, setStep] = useState(0); // 0: Splash, 1: Slide 1, 2: Slide 2, 3: Slide 3
  
  useEffect(() => {
    // Show splash screen for 1.5 seconds, then transition to onboarding walkthrough
    const timer = setTimeout(() => {
      setStep(1);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      navigation.replace('Login');
    }
  };

  const handleSkip = () => {
    navigation.replace('Login');
  };

  // Render Splash Screen
  if (step === 0) {
    return (
      <SafeAreaView style={styles.splashContainer}>
        <View style={styles.splashGlowContainer}>
          <View style={styles.splashGlowRingOuter} />
          <View style={styles.splashGlowRingInner} />
          <LogoIcon size={120} />
        </View>
        <Text style={styles.splashTitle}>STAY-FIT</Text>
        <Text style={styles.splashSubtitle}>STAY HOME & STAY UPDATED</Text>
      </SafeAreaView>
    );
  }

  // Slide Data
  const slides = [
    {
      title: 'Say hello\nto better health',
      subtitle: 'Take your first step to a healthier tomorrow.',
      renderIllustration: () => (
        <View style={styles.illustrationContainer}>
          <View style={[styles.glowCircle, { backgroundColor: '#E3F2FD' }]} />
          {/* Abstract Robot Head & Medical Bubbles */}
          <View style={styles.robotHeadContainer}>
            <View style={styles.robotAntenna} />
            <View style={styles.robotHead}>
              <View style={styles.robotEyesRow}>
                <View style={styles.robotEye} />
                <View style={styles.robotEye} />
              </View>
              <View style={styles.robotMouth} />
            </View>
          </View>
          <View style={[styles.medicalBubble, { top: 30, left: 40 }]}>
            <Text style={{ fontSize: 16 }}>🧪</Text>
          </View>
          <View style={[styles.medicalBubble, { top: 70, right: 30 }]}>
            <Text style={{ fontSize: 16 }}>💊</Text>
          </View>
          <View style={[styles.medicalBubble, { bottom: 40, left: 60 }]}>
            <Text style={{ fontSize: 16 }}>🩸</Text>
          </View>
        </View>
      ),
    },
    {
      title: 'Start a stress free\nWellness journey',
      subtitle: 'Get accumulated data of your reports for better forecast of your health',
      renderIllustration: () => (
        <View style={styles.illustrationContainer}>
          <View style={[styles.glowCircle, { backgroundColor: '#EDE7F6' }]} />
          {/* Abstract Chat & Phone Illustration */}
          <View style={styles.phoneFrame}>
            <View style={styles.chatMessageLeft}>
              <View style={styles.chatLineShort} />
              <View style={styles.chatLineLong} />
            </View>
            <View style={styles.chatMessageRight}>
              <View style={[styles.chatLineShort, { backgroundColor: '#E0E0E0' }]} />
            </View>
            <View style={[styles.chatMessageLeft, { marginTop: 10 }]}>
              <View style={styles.chatLineLong} />
            </View>
          </View>
          <View style={[styles.medicalBubble, { top: 20, right: 40 }]}>
            <Text style={{ fontSize: 16 }}>✨</Text>
          </View>
        </View>
      ),
    },
    {
      title: 'Single place to track\nall your activity',
      subtitle: 'Keep record of everything at one place. Medical test, doctor prescription and daily activity',
      renderIllustration: () => (
        <View style={styles.illustrationContainer}>
          <View style={[styles.glowCircle, { backgroundColor: '#E8F5E9' }]} />
          {/* Abstract Fitness Rings & Bars */}
          <View style={styles.activityGraphContainer}>
            <View style={styles.activityRingOuter} />
            <View style={styles.activityRingInner} />
            <View style={styles.graphBarsRow}>
              <View style={[styles.graphBar, { height: 40 }]} />
              <View style={[styles.graphBar, { height: 70, backgroundColor: '#0056D2' }]} />
              <View style={[styles.graphBar, { height: 55 }]} />
            </View>
          </View>
          <View style={[styles.medicalBubble, { bottom: 30, right: 50 }]}>
            <Text style={{ fontSize: 16 }}>🏃</Text>
          </View>
        </View>
      ),
    },
  ];

  const currentSlide = slides[step - 1];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar with SKIP button */}
      <View style={styles.topBar}>
        {step < 3 ? (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>SKIP</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>

      {/* Illustration Area */}
      <View style={styles.slideIllustrationArea}>
        {currentSlide.renderIllustration()}
      </View>

      {/* Text Content Area */}
      <View style={styles.contentArea}>
        <Text style={styles.slideTitle}>{currentSlide.title}</Text>
        <Text style={styles.slideSubtitle}>{currentSlide.subtitle}</Text>
      </View>

      {/* Footer Navigation Area */}
      <View style={styles.footerArea}>
        {/* Step Indicator Dots */}
        <View style={styles.dotsRow}>
          {[1, 2, 3].map((num) => (
            <View
              key={num}
              style={[
                styles.dot,
                step === num ? styles.dotActive : null
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        {step < 3 ? (
          <TouchableOpacity style={styles.nextIconButton} onPress={handleNext}>
            <Text style={styles.nextIconButtonText}>→</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.getStartedButton} onPress={handleNext}>
            <Text style={styles.getStartedButtonText}>GET STARTED</Text>
            <Text style={styles.getStartedArrow}>→</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Splash Screen Styles
  splashContainer: {
    flex: 1,
    backgroundColor: '#FAFAFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashGlowContainer: {
    width: 260,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  splashGlowRingOuter: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#E8EAF6',
    opacity: 0.4,
  },
  splashGlowRingInner: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: '#C5CAE9',
    opacity: 0.3,
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1A237E',
    letterSpacing: 2,
    marginTop: 10,
  },
  splashSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7986CB',
    letterSpacing: 1.5,
    marginTop: 6,
  },

  // Onboarding Slideshow Styles
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  skipText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  slideIllustrationArea: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  slideTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1E293B',
    lineHeight: 38,
    marginBottom: 16,
  },
  slideSubtitle: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
    fontWeight: '500',
  },
  footerArea: {
    height: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#FF7A5C', // Reddish-Coral Active dot as in mockup
  },
  nextIconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextIconButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  getStartedButton: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 28,
    alignItems: 'center',
    gap: 12,
  },
  getStartedButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1,
  },
  getStartedArrow: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Abstract Illustrations Styles
  illustrationContainer: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.6,
  },
  medicalBubble: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  // Slide 1 Robot
  robotHeadContainer: {
    alignItems: 'center',
  },
  robotAntenna: {
    width: 4,
    height: 12,
    backgroundColor: '#0056D2',
    borderRadius: 2,
  },
  robotHead: {
    width: 70,
    height: 60,
    backgroundColor: '#2563EB',
    borderRadius: 20,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#DBEAFE',
  },
  robotEyesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  robotEye: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#93C5FD',
  },
  robotMouth: {
    width: 26,
    height: 4,
    backgroundColor: '#93C5FD',
    borderRadius: 2,
  },
  // Slide 2 Phone / Chat
  phoneFrame: {
    width: 100,
    height: 150,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#3B82F6',
    padding: 8,
    justifyContent: 'center',
  },
  chatMessageLeft: {
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    padding: 6,
    width: '75%',
    gap: 4,
  },
  chatMessageRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 6,
    width: '60%',
    marginTop: 8,
  },
  chatLineShort: {
    height: 4,
    backgroundColor: '#2563EB',
    borderRadius: 2,
    width: '40%',
  },
  chatLineLong: {
    height: 4,
    backgroundColor: '#60A5FA',
    borderRadius: 2,
    width: '85%',
  },
  // Slide 3 Activity Tracker
  activityGraphContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityRingOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 8,
    borderColor: '#C8E6C9',
  },
  activityRingInner: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 8,
    borderColor: '#E8F5E9',
  },
  graphBarsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-end',
    marginTop: 20,
    position: 'absolute',
  },
  graphBar: {
    width: 8,
    backgroundColor: '#A5D6A7',
    borderRadius: 4,
  },

  // Cross-Platform Logo Icon Styles
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
