import React, { useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { SPACING, RADIUS, AppColors } from '../utils/constants';
import { useAppTheme } from '../context/ThemeContext';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  multiline?: boolean;
}

export function FormField({
  label,
  error,
  multiline,
  style,
  ...props
}: FormFieldProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      marginBottom: SPACING.md,
    },
    label: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      color: colors.primary,
      marginBottom: SPACING.sm,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.primary,
      minHeight: 50,
    },
    inputMultiline: {
      minHeight: 100,
      paddingTop: SPACING.sm,
    },
    inputError: {
      borderColor: colors.error,
    },
    error: {
      fontSize: 12,
      color: colors.error,
      marginTop: SPACING.xs,
    },
  });
}
