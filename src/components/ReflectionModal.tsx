import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { AppColors, RADIUS, SPACING } from '../utils/constants';

interface ReflectionModalProps {
  visible: boolean;
  initialValue?: string;
  onSave: (reflection: string) => Promise<void>;
  onClose: () => void;
}

export function ReflectionModal({ visible, initialValue, onSave, onClose }: ReflectionModalProps) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [value, setValue] = useState(initialValue ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setValue(initialValue ?? '');
      setSaving(false);
    }
  }, [initialValue, visible]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(value);
    setSaving(false);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card}>
          <Text style={styles.title}>Reflect & Grow</Text>
          <Text style={styles.message}>What did you learn from this application?</Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            multiline
            placeholder="Write a short reflection..."
            placeholderTextColor={colors.muted}
            style={styles.input}
            textAlignVertical="top"
          />
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} disabled={saving}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveButton}>
              <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  message: {
    marginTop: SPACING.xs,
    color: colors.secondary,
    fontSize: 14,
  },
  input: {
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: RADIUS.md,
    minHeight: 110,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: colors.primary,
    fontSize: 15,
  },
  actions: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipText: {
    color: colors.secondary,
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  saveText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 14,
  },
});
