import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import WelcomeScreen from '../screens/Auth/WelcomeScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import OtpVerificationScreen from '../screens/Auth/OtpVerificationScreen';
import OnboardingScreen from '../screens/Auth/OnboardingScreen';

// Tab screens
import DashboardScreen from '../screens/Main/DashboardScreen';
import MyHealthScreen from '../screens/Main/MyHealthScreen';
import ReportTimelineScreen from '../screens/Main/ReportTimelineScreen';
import DailyActivityScreen from '../screens/Main/DailyActivityScreen';
import MoreScreen from '../screens/Main/MoreScreen';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  OtpVerification: { verificationId: string; phoneNumber: string };
  Onboarding: { userId: string };
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigation configuration
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 64,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        }
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🏠</Text>
        }}
      />
      <Tab.Screen 
        name="MyHealth" 
        component={MyHealthScreen} 
        options={{
          tabBarLabel: 'My Health',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>❤️</Text>
        }}
      />
      <Tab.Screen 
        name="ReportTimeline" 
        component={ReportTimelineScreen} 
        options={{
          tabBarLabel: 'Timeline',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📅</Text>
        }}
      />
      <Tab.Screen 
        name="DailyActivity" 
        component={DailyActivityScreen} 
        options={{
          tabBarLabel: 'Activity',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🏃</Text>
        }}
      />
      <Tab.Screen 
        name="More" 
        component={MoreScreen} 
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⚙️</Text>
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#fff' }
        }}
      >
        {/* Auth Stack */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        
        {/* Main Tab Stack */}
        <Stack.Screen name="Main" component={MainTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
