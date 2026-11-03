import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { RootStackParamList, TabParamList } from '../types';

import { HomeScreen } from '../screens/HomeScreen';
import { ExplorerScreen } from '../screens/ExplorerScreen';
import { SystemsScreen } from '../screens/SystemsScreen';
import { LearningScreen } from '../screens/LearningScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { OrganDetailsScreen } from '../screens/OrganDetailsScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.cardBorder,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ExplorerTab"
        component={ExplorerScreen}
        options={{
          tabBarLabel: '3D Explorer',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cube-scan" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SystemsTab"
        component={SystemsScreen}
        options={{
          tabBarLabel: 'Systems',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="human-male-height" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="LearnTab"
        component={LearningScreen}
        options={{
          tabBarLabel: 'Learn',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="QuizTab"
        component={QuizScreen}
        options={{
          tabBarLabel: 'Quiz',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="trophy-outline" size={size} color={color} />
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
    </Stack.Navigator>
  );
}
