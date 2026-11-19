import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { useApp } from '../context/AppContext';
import { useTheme } from '../theme/ThemeContext';
import { useTranslation } from '../i18n/useTranslation';

import { SplashScreen } from '../screens/SplashScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { OtpScreen } from '../screens/OtpScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { GoalSummaryScreen } from '../screens/GoalSummaryScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { FoodScreen } from '../screens/FoodScreen';
import { ExerciseScreen } from '../screens/ExerciseScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { AnalyzingScreen } from '../screens/AnalyzingScreen';
import { ReviewMealScreen } from '../screens/ReviewMealScreen';
import { ManualSearchScreen } from '../screens/ManualSearchScreen';
import { WaterScreen } from '../screens/WaterScreen';
import { WeightScreen } from '../screens/WeightScreen';
import { MicronutrientsScreen } from '../screens/MicronutrientsScreen';
import { ProfileSettingsScreen } from '../screens/ProfileSettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ navigation }: any) {
  const colors = useTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 66,
          paddingBottom: 8,
          paddingTop: 6,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('home'),
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Food"
        component={FoodScreen}
        options={{
          tabBarLabel: t('food'),
          tabBarIcon: ({ color, size }) => <Ionicons name="restaurant-outline" size={size} color={color} />,
        }}
      />
      {/* Central Raised Camera Button (Blueprint Section 7.4) */}
      <Tab.Screen
        name="QuickCam"
        component={FoodScreen}
        options={{
          tabBarLabel: '',
          tabBarButton: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Camera')}
              accessibilityLabel="Snap meal photo"
              style={{
                top: -18,
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                elevation: 5,
              }}
            >
              <Ionicons name="camera" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen
        name="Exercise"
        component={ExerciseScreen}
        options={{
          tabBarLabel: t('exercise'),
          tabBarIcon: ({ color, size }) => <Ionicons name="fitness-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: t('history'),
          tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarLabel: t('reports'),
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { hydrated, session } = useApp();
  const colors = useTheme();
  const [showSplash, setShowSplash] = useState(true);

  if (!hydrated || showSplash) {
    return <SplashScreen onDone={() => setShowSplash(false)} />;
  }

  const navTheme = colors.isDark ? DarkTheme : DefaultTheme;

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={colors.isDark ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session.loggedIn ? (
          <>
            {!session.seenWelcome && <Stack.Screen name="Welcome" component={WelcomeScreen} />}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Otp" component={OtpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : !session.onboardingComplete ? (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="GoalSummary" component={GoalSummaryScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="GoalSummary" component={GoalSummaryScreen} />
            <Stack.Screen name="Camera" component={CameraScreen} />
            <Stack.Screen name="Analyzing" component={AnalyzingScreen} />
            <Stack.Screen name="ReviewMeal" component={ReviewMealScreen} />
            <Stack.Screen name="ManualSearch" component={ManualSearchScreen} />
            <Stack.Screen name="WaterDetail" component={WaterScreen} />
            <Stack.Screen name="WeightDetail" component={WeightScreen} />
            <Stack.Screen name="Micronutrients" component={MicronutrientsScreen} />
            <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
