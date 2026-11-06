import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { RootStackParamList, TabParamList } from '../types';

import { HomeScreen } from '../screens/HomeScreen';
import { ExplorerScreen } from '../screens/ExplorerScreen';
import { SystemsScreen } from '../screens/SystemsScreen';
import { LearningScreen } from '../screens/LearningScreen';
import { ChatbotScreen } from '../screens/ChatbotScreen';
import { OrganDetailsScreen } from '../screens/OrganDetailsScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { FlashcardsScreen } from '../screens/FlashcardsScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { CreditsScreen } from '../screens/CreditsScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function BottomTabs() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#0284C7',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          height: 56 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 6,
          elevation: 6,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={21}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ExplorerTab"
        component={ExplorerScreen}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cube-scan" size={23} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SystemsTab"
        component={SystemsScreen}
        options={{
          tabBarLabel: 'Systems',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="human-male-height"
              size={23}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatbotScreen}
        options={{
          tabBarLabel: 'AI Tutor',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'robot' : 'robot-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={BottomTabs} />
      <Stack.Screen name="OrganDetails" component={OrganDetailsScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
      <Stack.Screen name="Flashcards" component={FlashcardsScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Credits" component={CreditsScreen} />
    </Stack.Navigator>
  );
}
