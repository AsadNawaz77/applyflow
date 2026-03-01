import React, { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, TextStyle } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { Job } from '../types';
import { AppColors, RADIUS, SPACING } from '../utils/constants';
import { formatDate } from '../utils/dateUtils';

interface ReadOnlyJobModalProps {
  visible: boolean;
  job: Job | null;
  onClose: () => void;
}

function Row({
  label,
  value,
  labelStyle,
  valueStyle,
}: {
  label: string;
  value: string;
  labelStyle: TextStyle;
  valueStyle: TextStyle;
}) {
  return (
    <View>
      <Text style={[stylesStatic.label, labelStyle]}>{label}</Text>
      <Text style={[stylesStatic.value, valueStyle]}>{value || '-'}</Text>
    </View>
  );
}

export function ReadOnlyJobModal({ visible, job, onClose }: ReadOnlyJobModalProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  if (!job) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Application Details</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator
            nestedScrollEnabled
            bounces={false}
          >
            <Row
              label="Company"
              value={job.companyName}
              labelStyle={styles.rowLabel}
              valueStyle={styles.rowValue}
            />
            <Row
              label="Role"
              value={job.role}
              labelStyle={styles.rowLabel}
              valueStyle={styles.rowValue}
            />
            <Row
              label="Status"
              value={job.status}
              labelStyle={styles.rowLabel}
              valueStyle={styles.rowValue}
            />
            <Row
              label="Job Type"
              value={job.jobType}
              labelStyle={styles.rowLabel}
              valueStyle={styles.rowValue}
            />
            <Row
              label="Location"
              value={job.location}
              labelStyle={styles.rowLabel}
              valueStyle={styles.rowValue}
            />
            <Row
              label="Date Applied"
              value={formatDate(job.dateApplied)}
              labelStyle={styles.rowLabel}
              valueStyle={styles.rowValue}
            />
            <Row
              label="Follow-Up Date"
              value={job.followUpDate ? formatDate(job.followUpDate) : '-'}
              labelStyle={styles.rowLabel}
              valueStyle={styles.rowValue}
            />
            <Row
              label="Salary Offered"
              value={typeof job.salaryOffered === 'number' ? String(job.salaryOffered) : '-'}
              labelStyle={styles.rowLabel}
              valueStyle={styles.rowValue}
            />
            <Row
              label="Recruiter Contact"
              value={job.recruiterContact ?? '-'}
              labelStyle={styles.rowLabel}
              valueStyle={styles.rowValue}
            />
            <Row
              label="Resume Version"
              value={job.resumeVersion ?? '-'}
              labelStyle={styles.rowLabel}
              valueStyle={styles.rowValue}
            />
            <Row
              label="Notes"
              value={job.notes ?? '-'}
              labelStyle={styles.rowLabel}
              valueStyle={styles.rowValue}
            />
            <Row
              label="Reflection / Learning"
              value={job.reflection ?? '-'}
              labelStyle={styles.rowLabel}
              valueStyle={styles.rowValue}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const stylesStatic = StyleSheet.create({
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
    fontWeight: '700',
  },
  value: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
});

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.md,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    card: {
      width: '100%',
      maxWidth: 420,
      maxHeight: '80%',
      backgroundColor: colors.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING.md,
      shadowColor: colors.tabShadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.sm,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
    },
    closeText: {
      color: colors.accent,
      fontWeight: '700',
      fontSize: 14,
    },
    body: {
      paddingBottom: SPACING.sm,
    },
    scroll: {
      flexGrow: 0,
    },
    rowLabel: {
      color: colors.muted,
    },
    rowValue: {
      color: colors.primary,
    },
  });
}
