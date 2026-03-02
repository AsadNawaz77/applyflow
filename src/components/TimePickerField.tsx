import React, { useMemo, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppTheme } from '../context/ThemeContext';
import { AppColors, RADIUS, SPACING } from '../utils/constants';

interface TimePickerFieldProps {
  label: string;
  value?: string;
  onChange: (timeHHMM: string) => void;
}

function toDateFromHHMM(value?: string) {
  const date = new Date();
  if (!value) return date;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return date;
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date;
}

function toHHMM(date: Date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function TimePickerField({ label, value, onChange }: TimePickerFieldProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(toDateFromHHMM(value));

  const open = () => {
    setTempDate(toDateFromHHMM(value));
    setShow(true);
  };

  const onPickerChange = (_: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (!selectedDate) return;
    if (Platform.OS === 'android') {
      onChange(toHHMM(selectedDate));
      return;
    }
    setTempDate(selectedDate);
  };

  const close = () => setShow(false);
  const saveIOS = () => {
    onChange(toHHMM(tempDate));
    close();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.touchable} onPress={open} activeOpacity={0.75}>
        <Text style={styles.value}>{value ?? 'Select time'}</Text>
      </TouchableOpacity>

      {show &&
        (Platform.OS === 'ios' ? (
          <Modal transparent animationType="slide">
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={close}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={close}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={saveIOS}>
                    <Text style={styles.doneText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker value={tempDate} mode="time" display="spinner" onChange={onPickerChange} />
              </View>
            </TouchableOpacity>
          </Modal>
        ) : (
          <DateTimePicker value={tempDate} mode="time" display="default" onChange={onPickerChange} />
        ))}
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
    value: {
      color: colors.primary,
      fontSize: 15,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: RADIUS.lg,
      borderTopRightRadius: RADIUS.lg,
      borderTopWidth: 1,
      borderColor: colors.border,
      paddingBottom: 34,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    cancelText: {
      fontSize: 16,
      color: colors.muted,
    },
    doneText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.accent,
    },
  });
}
