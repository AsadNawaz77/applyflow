import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SPACING, RADIUS, AppColors } from '../utils/constants';
import { useAppTheme } from '../context/ThemeContext';

interface SummaryCardProps {
  label: string;
  value: string | number;
}

export function SummaryCard({ label, value }: SummaryCardProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.sm,
      marginHorizontal: SPACING.xs,
      alignItems: 'center',
      shadowColor: colors.tabShadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.22,
      shadowRadius: 9,
      elevation: 4,
    },
    value: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.primary,
    },
    label: {
      fontSize: 11,
      color: colors.secondary,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      fontWeight: '700',
      marginTop: SPACING.xs,
    },
  });
}
