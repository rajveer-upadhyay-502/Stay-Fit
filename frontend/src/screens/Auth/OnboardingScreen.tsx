import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';

export default function OnboardingScreen({ route, navigation }: any) {
  const userId = route.params?.userId; // Passed down from OTP screen
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male'); // Default
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [conditions, setConditions] = useState('');

  const nextStep = () => {
    if (step === 1 && (!name || !age)) {
      Alert.alert('Incomplete', 'Please fill in your Name and Age.');
      return;
    }
    if (step === 2 && (!height || !weight || !bloodGroup)) {
      Alert.alert('Incomplete', 'Please fill in Height, Weight, and Blood Group.');
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleComplete = async () => {
    if (!userId) {
       Alert.alert('Error', 'User ID is missing, please try authenticating again.');
       return;
    }

    setLoading(true);
    try {
      const conditionList = conditions.split(',').map(c => c.trim()).filter(c => c.length > 0);
      
      const payload = {
        userId,
        name,
        age: Number(age),
        gender,
        height: Number(height),
        weight: Number(weight),
        bloodGroup,
        preExistingConditions: conditionList,
        isPrimary: true
      };

      const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create profile.');
      }

      // Update localStorage session state on completion
      if (Platform.OS === 'web') {
        localStorage.setItem('last_user_has_profile', 'true');
      }

      // Proceed to the Main application dashboard
      navigation.replace('Main');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Let's get to know you</Text>
            <Text style={styles.stepSubtitle}>Basic Information</Text>
            
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="John Doe" />
            
            <Text style={styles.label}>Age</Text>
            <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="25" keyboardType="number-pad" />
            
            <Text style={styles.label}>Gender</Text>
            <View style={styles.row}>
              {['Male', 'Female', 'Other'].map((g) => (
                <TouchableOpacity 
                  key={g} 
                  style={[styles.chip, gender === g && styles.chipActive]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Physical Attributes</Text>
            <Text style={styles.stepSubtitle}>To help track your vitals better</Text>
            
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput style={styles.input} value={height} onChangeText={setHeight} placeholder="175" keyboardType="number-pad" />
            
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput style={styles.input} value={weight} onChangeText={setWeight} placeholder="70" keyboardType="number-pad" />
            
            <Text style={styles.label}>Blood Group</Text>
            <TextInput style={styles.input} value={bloodGroup} onChangeText={setBloodGroup} placeholder="O+" autoCapitalize="characters" />
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Medical History</Text>
            <Text style={styles.stepSubtitle}>Any pre-existing conditions?</Text>
            
            <Text style={styles.label}>Conditions (comma separated)</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              value={conditions} 
              onChangeText={setConditions} 
              placeholder="e.g. Asthma, Diabetes" 
              multiline
            />
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Welcome onboard</Text>
            <View style={styles.progressContainer}>
              {[1, 2, 3].map((num) => (
                <View key={num} style={[styles.progressDot, step >= num && styles.progressDotActive]} />
              ))}
            </View>
          </View>

          {renderStep()}

        </ScrollView>
        <View style={styles.footer}>
            {step > 1 && (
              <TouchableOpacity style={styles.secondaryButton} onPress={prevStep}>
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            {step < 3 ? (
              <TouchableOpacity style={[styles.primaryButton, step === 1 ? { flex: 1 } : {} ]} onPress={nextStep}>
                <Text style={styles.primaryButtonText}>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.primaryButton} onPress={handleComplete} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Complete Setup</Text>}
              </TouchableOpacity>
            )}
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    height: 6,
    flex: 1,
    backgroundColor: '#E4E7EB',
    borderRadius: 3,
  },
  progressDotActive: {
    backgroundColor: '#0056D2',
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0056D2',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E4E7EB',
  },
  textArea: {
    height: 100,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4E7EB',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#0056D2',
    borderColor: '#0056D2',
  },
  chipText: {
    color: '#666',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E4E7EB',
    backgroundColor: '#fff',
    gap: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#0056D2',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0056D2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#fff',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E7EB',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});
