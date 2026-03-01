import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { JobsProvider } from './src/context/JobsContext';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { LaunchSplash } from './src/components/LaunchSplash';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';

function AppContent() {
  const { mode, colors } = useAppTheme();
  const navigationTheme = mode === 'dark' ? DarkTheme : DefaultTheme;
  const mergedTheme = {
    ...navigationTheme,
    colors: {
      ...navigationTheme.colors,
      background: colors.background,
      card: colors.surface,
      text: colors.primary,
      border: colors.border,
      primary: colors.accent,
    },
  };

  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1700);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      {showSplash ? (
        <>
          <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
          <LaunchSplash />
        </>
      ) : (
        <JobsProvider>
          <NavigationContainer theme={mergedTheme}>
            <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
            <AppNavigator />
          </NavigationContainer>
        </JobsProvider>
      )}
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
