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
import { QuizScreen } from '../screens/QuizScreen';
import { OrganDetailsScreen } from '../screens/OrganDetailsScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function BottomTabs() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          height: 58 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 8,
          elevation: 8,
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
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ExplorerTab"
        component={ExplorerScreen}
        options={{
          tabBarLabel: '3D Atlas',
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
        name="LearnTab"
        component={LearningScreen}
        options={{
          tabBarLabel: 'Learn',
          tabBarIcon: ({ color }) => (
            <Ionicons name="book-outline" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="QuizTab"
        component={QuizScreen}
        options={{
          tabBarLabel: 'Quiz',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="trophy-outline"
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
    </Stack.Navigator>
  );
}
