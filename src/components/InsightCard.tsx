import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { AppColors, RADIUS, SPACING } from '../utils/constants';

interface InsightCardProps {
  label: string;
  value: string;
  hint?: string;
}

export function InsightCard({ label, value, hint }: InsightCardProps) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: colors.tabShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  hint: {
    color: colors.secondary,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
});
