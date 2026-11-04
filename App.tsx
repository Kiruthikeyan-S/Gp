import './src/utils/expoGlPatch';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAnatomyStore } from './src/state/useAnatomyStore';
import { preloadAllRealGlbModels } from './src/models/realGlbLoader';

export default function App() {
  const loadPersistedData = useAnatomyStore((state) => state.loadPersistedData);

  useEffect(() => {
    loadPersistedData();
    preloadAllRealGlbModels();
  }, [loadPersistedData]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
