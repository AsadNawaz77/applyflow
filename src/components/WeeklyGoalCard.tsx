import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { AppColors, RADIUS, SPACING } from '../utils/constants';

interface WeeklyGoalCardProps {
  completed: number;
  target: number;
  percentage: number;
  hasGoal: boolean;
  onSaveGoal: (target: number) => Promise<void>;
  onClearGoal: () => Promise<void>;
}

export function WeeklyGoalCard({
  completed,
  target,
  percentage,
  hasGoal,
  onSaveGoal,
  onClearGoal,
}: WeeklyGoalCardProps) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [modalVisible, setModalVisible] = useState(false);
  const [goalInput, setGoalInput] = useState(hasGoal ? String(target) : '');
  const [error, setError] = useState('');

  const barWidth = useMemo(
    () => `${Math.max(0, Math.min(100, percentage))}%` as `${number}%`,
    [percentage],
  );

  const openModal = () => {
    setGoalInput(hasGoal ? String(target) : '');
    setError('');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setError('');
  };

  const handleSave = async () => {
    const parsed = Number(goalInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter a valid number greater than 0');
      return;
    }
    await onSaveGoal(parsed);
    closeModal();
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Weekly Goal</Text>
        {hasGoal ? (
          <TouchableOpacity onPress={openModal} hitSlop={8}>
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {!hasGoal ? (
        <TouchableOpacity style={styles.setButton} onPress={openModal} activeOpacity={0.85}>
          <Text style={styles.setButtonText}>Set Weekly Goal</Text>
        </TouchableOpacity>
      ) : (
        <>
          <Text style={styles.progressText}>
            {completed} / {target} applications this week
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: barWidth }]} />
          </View>
          <View style={styles.footerRow}>
            <Text style={styles.percentText}>{percentage}% complete</Text>
            <TouchableOpacity onPress={onClearGoal}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={closeModal}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>Set Weekly Goal</Text>
            <TextInput
              value={goalInput}
              onChangeText={setGoalInput}
              keyboardType="number-pad"
              placeholder="e.g. 10"
              placeholderTextColor={colors.muted}
              style={styles.input}
              maxLength={3}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={closeModal}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.tabShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  setButton: {
    backgroundColor: colors.accent,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  setButtonText: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: 15,
  },
  progressText: {
    fontSize: 14,
    color: colors.secondary,
  },
  progressTrack: {
    height: 11,
    borderRadius: RADIUS.full,
    backgroundColor: colors.accentSoft,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  footerRow: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  clearText: {
    color: colors.error,
    fontWeight: '600',
    fontSize: 13,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: colors.primary,
    fontSize: 16,
  },
  errorText: {
    marginTop: SPACING.xs,
    color: colors.error,
    fontSize: 12,
  },
  modalActions: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cancelText: {
    color: colors.secondary,
    fontWeight: '600',
    fontSize: 14,
    marginRight: SPACING.md,
  },
  saveText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
});
