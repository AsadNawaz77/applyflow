import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Job } from '../types';
import { formatDate } from '../utils/dateUtils';
import { isTodayOrPast } from '../utils/dateUtils';
import { SPACING, RADIUS, AppColors } from '../utils/constants';
import { useAppTheme } from '../context/ThemeContext';

interface JobCardProps {
  job: Job;
  onPress?: () => void;
  disabled?: boolean;
  locked?: boolean;
}

export function JobCard({ job, onPress, disabled = false, locked = false }: JobCardProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const statusColors: Record<string, string> = {
    Applied: colors.secondary,
    'HR Interview': colors.accent,
    'Technical Interview': colors.accent,
    'Final Round': colors.accent,
    Offer: colors.success,
    Rejected: colors.error,
  };
  const needsFollowUp =
    job.followUpDate && isTodayOrPast(job.followUpDate) && job.status !== 'Rejected';
  const statusColor = statusColors[job.status] || colors.secondary;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        needsFollowUp && styles.cardHighlight,
        (disabled || locked) && styles.cardDisabled,
      ]}
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      <View style={styles.header}>
        <Text style={styles.company} numberOfLines={1}>
          {job.companyName}
        </Text>
        <View style={[styles.badge, { backgroundColor: statusColor }]}>
          <Text style={styles.badgeText}>{job.status}</Text>
        </View>
      </View>
      <Text style={styles.role} numberOfLines={1}>
        {job.role}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.date}>{formatDate(job.dateApplied)}</Text>
        {(disabled || locked) && (
          <View style={styles.lockBadge}>
            <Text style={styles.lockText}>Locked</Text>
          </View>
        )}
        {needsFollowUp && (
          <View style={styles.followUpBadge}>
            <Text style={styles.followUpText}>Follow Up Needed</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING.md,
      marginBottom: SPACING.md,
      shadowColor: colors.tabShadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.24,
      shadowRadius: 10,
      elevation: 4,
    },
    cardHighlight: {
      borderLeftWidth: 4,
      borderLeftColor: colors.warning,
    },
    cardDisabled: {
      opacity: 0.82,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.xs,
    },
    company: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.primary,
      flex: 1,
    },
    badge: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: 3,
      borderRadius: RADIUS.sm,
      marginLeft: SPACING.sm,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.2,
      color: colors.surface,
    },
    role: {
      fontSize: 14,
      color: colors.secondary,
      marginBottom: SPACING.sm,
      fontWeight: '500',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: SPACING.sm,
    },
    date: {
      fontSize: 12,
      color: colors.muted,
    },
    followUpBadge: {
      backgroundColor: colors.warning,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
      borderRadius: RADIUS.sm,
    },
    lockBadge: {
      backgroundColor: colors.border,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
      borderRadius: RADIUS.sm,
    },
    lockText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.secondary,
    },
    followUpText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.surface,
    },
  });
}
