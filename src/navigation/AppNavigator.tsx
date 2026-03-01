import React from 'react';
import { NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ApplicationsScreen } from '../screens/ApplicationsScreen';
import { DeadlinesScreen } from '../screens/DeadlinesScreen';
import { DataToolsScreen } from '../screens/DataToolsScreen';
import { AddJobScreen } from '../screens/AddJobScreen';
import { JobDetailsScreen } from '../screens/JobDetailsScreen';
import { useAppTheme } from '../context/ThemeContext';

export type ResultType = 'offer' | 'rejected';

export type MainTabParamList = {
  Dashboard: { result?: ResultType; jobId?: string } | undefined;
  Applications: undefined;
  Deadlines: undefined;
  DataTools: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  AddJob: undefined;
  JobDetails: { jobId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function tabIconName(
  routeName: keyof MainTabParamList,
  focused: boolean,
): keyof typeof Ionicons.glyphMap {
  if (routeName === 'Dashboard') return focused ? 'grid' : 'grid-outline';
  if (routeName === 'Applications') return focused ? 'briefcase' : 'briefcase-outline';
  if (routeName === 'Deadlines') return focused ? 'calendar' : 'calendar-outline';
  return focused ? 'construct' : 'construct-outline';
}

function MainTabs() {
  const { colors } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ color, focused, size }) => (
          <Ionicons name={tabIconName(route.name, focused)} size={size} color={color} />
        ),
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 3,
        },
        tabBarStyle: {
          height: 66,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopColor: colors.border,
          backgroundColor: colors.tabBackground,
          shadowColor: colors.tabShadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarItemStyle: {
          borderRadius: 12,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen
        name="Applications"
        component={ApplicationsScreen}
        options={{ title: 'Applications' }}
      />
      <Tab.Screen name="Deadlines" component={DeadlinesScreen} options={{ title: 'Deadlines' }} />
      <Tab.Screen name="DataTools" component={DataToolsScreen} options={{ title: 'Tools' }} />
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
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="AddJob" component={AddJobScreen} />
      <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
    </Stack.Navigator>
  );
}
