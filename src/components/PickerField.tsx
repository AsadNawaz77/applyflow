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

interface PickerFieldProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  allowCustom?: boolean;
}

export function PickerField({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
  allowCustom,
}: PickerFieldProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [show, setShow] = useState(false);
  const [customText, setCustomText] = useState('');

  const displayValue = value || (allowCustom && customText ? customText : null);

  const handleSelect = (option: string) => {
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
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    value === item && styles.optionSelected,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      value === item && styles.optionTextSelected,
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
      paddingBottom: 34,
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
    optionText: {
      fontSize: 16,
      color: colors.primary,
    },
    optionTextSelected: {
      fontWeight: '600',
      color: colors.accent,
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
