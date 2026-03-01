import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { RADIUS } from '../utils/constants';
import { useAppTheme } from '../context/ThemeContext';

export function LaunchSplash() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          speed: 12,
          bounciness: 10,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoOpacity, logoScale, subtitleOpacity]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoWrap,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Text style={styles.logoText}>AF</Text>
      </Animated.View>
      <Text style={styles.title}>ApplyFlow</Text>
      <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
        Track. Learn. Grow.
      </Animated.Text>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 24,
    },
    logoWrap: {
      width: 92,
      height: 92,
      borderRadius: RADIUS.lg,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 14,
      elevation: 8,
    },
    logoText: {
      color: colors.surface,
      fontSize: 36,
      fontWeight: '800',
      letterSpacing: 1,
    },
    title: {
      marginTop: 20,
      color: colors.primary,
      fontSize: 34,
      fontWeight: '800',
    },
    subtitle: {
      marginTop: 8,
      color: colors.secondary,
      fontSize: 14,
      fontWeight: '600',
    },
  });
}
