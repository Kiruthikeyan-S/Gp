import './src/utils/expoGlPatch';
import { useEffect } from 'react';
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
    // Preload high-detail 3D models immediately in background with zero delay
    const timer = setTimeout(() => {
      preloadAllRealGlbModels().catch(() => {});
    }, 50);
    return () => clearTimeout(timer);
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
