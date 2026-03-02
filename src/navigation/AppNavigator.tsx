import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

function tabLabel(routeName: keyof MainTabParamList) {
  if (routeName === 'DataTools') return 'Tools';
  return routeName;
}

function CustomFloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const itemCount = state.routes.length;
  const itemWidth = width > 0 ? width / itemCount : 0;
  const indicatorSize = 36;
  const indicatorOffset = itemWidth > 0 ? (itemWidth - indicatorSize) / 2 : 0;
  const targetX = indicatorOffset + state.index * itemWidth;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: targetX,
      useNativeDriver: true,
      speed: 18,
      bounciness: 9,
    }).start();
  }, [targetX, translateX]);

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.outerWrap, { bottom: Math.max(22, insets.bottom + 8) }]}
    >
      <View style={styles.innerWrap} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {itemWidth > 0 ? (
          <Animated.View
            style={[
              styles.activeIndicator,
              { width: indicatorSize, height: indicatorSize, transform: [{ translateX }] },
            ]}
          />
        ) : null}

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const color = focused ? colors.accent : colors.muted;
          const label = tabLabel(route.name as keyof MainTabParamList);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButton}
            >
              <View style={styles.iconSlot}>
                <Ionicons
                  name={tabIconName(route.name as keyof MainTabParamList, focused)}
                  size={20}
                  color={color}
                />
              </View>
              <Text style={[styles.tabLabel, { color }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MainTabs() {
  const { colors } = useAppTheme();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomFloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Applications" component={ApplicationsScreen} />
      <Tab.Screen name="Deadlines" component={DeadlinesScreen} />
      <Tab.Screen name="DataTools" component={DataToolsScreen} />
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

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    outerWrap: {
      position: 'absolute',
      left: 14,
      right: 14,
    },
    innerWrap: {
      flexDirection: 'row',
      backgroundColor: colors.tabBackground,
      borderRadius: 22,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.tabShadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.34,
      shadowRadius: 16,
      elevation: 18,
      overflow: 'hidden',
    },
    tabButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      paddingVertical: 2,
      zIndex: 2,
    },
    iconSlot: {
      height: 24,
      width: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabLabel: {
      fontSize: 11,
      fontWeight: '600',
    },
    activeIndicator: {
      position: 'absolute',
      top: 6,
      borderRadius: 999,
      backgroundColor: colors.accentSoft,
      zIndex: 1,
    },
  });
