import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { SPACING, RADIUS, AppColors } from '../utils/constants';
import { useAppTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PickerFieldProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  allowCustom?: boolean;
  disabledOptions?: string[];
}

export function PickerField({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
  allowCustom,
  disabledOptions = [],
}: PickerFieldProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets.bottom), [colors, insets.bottom]);
  const [show, setShow] = useState(false);
  const [customText, setCustomText] = useState('');

  const displayValue = value || (allowCustom && customText ? customText : null);

  const handleSelect = (option: string) => {
    if (disabledOptions.includes(option)) return;
    onChange(option);
    setShow(false);
  };

  const allOptions = allowCustom ? [...options, 'Custom'] : options;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.touchable}
        onPress={() => setShow(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.text, !displayValue && styles.placeholder]}>
          {displayValue || placeholder}
        </Text>
      </TouchableOpacity>
      <Modal visible={show} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShow(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{label}</Text>
            <FlatList
              data={allOptions}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    value === item && styles.optionSelected,
                    disabledOptions.includes(item) && styles.optionDisabled,
                  ]}
                  onPress={() => handleSelect(item)}
                  disabled={disabledOptions.includes(item)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      value === item && styles.optionTextSelected,
                      disabledOptions.includes(item) && styles.optionTextDisabled,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            {allowCustom && (
              <TouchableOpacity
                style={styles.customHint}
                onPress={() => setShow(false)}
              >
                <Text style={styles.customHintText}>
                  Type custom location in the form
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function createStyles(colors: AppColors, bottomInset: number) {
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
    touchable: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: 12,
      minHeight: 50,
      justifyContent: 'center',
    },
    text: {
      fontSize: 15,
      color: colors.primary,
    },
    placeholder: {
      color: colors.muted,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: RADIUS.lg,
      borderTopRightRadius: RADIUS.lg,
      maxHeight: '60%',
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.border,
      paddingBottom: Math.max(34, bottomInset + 16),
    },
    listContent: {
      paddingBottom: SPACING.sm,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
      padding: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    option: {
      padding: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    optionSelected: {
      backgroundColor: colors.accentSoft,
    },
    optionDisabled: {
      opacity: 0.45,
    },
    optionText: {
      fontSize: 16,
      color: colors.primary,
    },
    optionTextSelected: {
      fontWeight: '600',
      color: colors.accent,
    },
    optionTextDisabled: {
      color: colors.muted,
    },
    customHint: {
      padding: SPACING.md,
    },
    customHintText: {
      fontSize: 12,
      color: colors.muted,
    },
  });
}
