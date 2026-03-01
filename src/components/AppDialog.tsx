import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { AppColors, RADIUS, SPACING } from '../utils/constants';

export type AppDialogAction = {
  label: string;
  onPress?: () => void;
  tone?: 'primary' | 'secondary' | 'danger';
};

interface AppDialogProps {
  visible: boolean;
  title: string;
  message: string;
  actions?: AppDialogAction[];
  onClose: () => void;
}

export function AppDialog({ visible, title, message, actions, onClose }: AppDialogProps) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  const resolvedActions: AppDialogAction[] =
    actions && actions.length > 0
      ? actions
      : [
          {
            label: 'OK',
            tone: 'primary',
          },
        ];

  const handlePress = (action: AppDialogAction) => {
    onClose();
    action.onPress?.();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            {resolvedActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={[
                  styles.button,
                  action.tone === 'secondary' && styles.buttonSecondary,
                  action.tone === 'danger' && styles.buttonDanger,
                ]}
                onPress={() => handlePress(action)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.buttonText,
                    action.tone === 'secondary' && styles.buttonTextSecondary,
                    action.tone === 'danger' && styles.buttonTextDanger,
                  ]}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
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
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: SPACING.md,
    shadowColor: colors.tabShadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 7,
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
    lineHeight: 20,
  },
  actions: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginLeft: SPACING.sm,
    marginTop: SPACING.xs,
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDanger: {
    backgroundColor: colors.accentSoft,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  buttonTextSecondary: {
    color: colors.secondary,
  },
  buttonTextDanger: {
    color: colors.error,
  },
});
