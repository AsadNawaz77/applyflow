import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { RootStackParamList, ResultType } from '../navigation/AppNavigator';
import { FormField } from '../components/FormField';
import { DatePickerField } from '../components/DatePickerField';
import { PickerField } from '../components/PickerField';
import { AppDialog, AppDialogAction } from '../components/AppDialog';
import { useAppTheme } from '../context/ThemeContext';
import { AppColors, SPACING } from '../utils/constants';
import { useJobsContext } from '../context/JobsContext';
import { JobFormData, JOB_STATUSES, JOB_TYPES, LOCATION_OPTIONS } from '../types';
import { toISODateString } from '../utils/dateUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'AddJob'>;

const initialForm: JobFormData = {
  companyName: '',
  role: '',
  jobType: 'Full-Time',
  location: 'Remote',
  dateApplied: toISODateString(new Date()),
  status: 'Applied',
  resumeVersion: '',
};

export function AddJobScreen({ navigation }: Props) {
  const { addJob } = useJobsContext();
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [form, setForm] = useState<JobFormData>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dialog, setDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    actions?: AppDialogAction[];
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const showDialog = (title: string, message: string, actions?: AppDialogAction[]) => {
    setDialog({
      visible: true,
      title,
      message,
      actions,
    });
  };

  const update = <K extends keyof JobFormData>(key: K, value: JobFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as string]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.companyName.trim()) next.companyName = 'Company name is required';
    if (!form.role.trim()) next.role = 'Role is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const newJobId = await addJob(form);
      if (form.status === 'Offer') {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'MainTabs',
                params: {
                  screen: 'Dashboard',
                  params: { result: 'offer' as ResultType },
                },
              },
            ],
          }),
        );
      } else if (form.status === 'Rejected') {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'MainTabs',
                params: {
                  screen: 'Dashboard',
                  params: { result: 'rejected' as ResultType, jobId: newJobId },
                },
              },
            ],
          }),
        );
      } else {
        navigation.goBack();
      }
    } catch (error) {
      showDialog('Error', 'Failed to save job application.');
      console.log(error);
    }
  };

  const locationValue = LOCATION_OPTIONS.includes(form.location) ? form.location : 'Custom';

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backText}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Job</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <FormField
          label="Company Name *"
          value={form.companyName}
          onChangeText={(value) => update('companyName', value)}
          placeholder="e.g. Acme Inc."
          error={errors.companyName}
          autoCapitalize="words"
        />
        <FormField
          label="Role *"
          value={form.role}
          onChangeText={(value) => update('role', value)}
          placeholder="e.g. Software Engineer"
          error={errors.role}
          autoCapitalize="words"
        />
        <PickerField
          label="Job Type"
          value={form.jobType}
          options={JOB_TYPES}
          onChange={(value) => update('jobType', value as JobFormData['jobType'])}
        />
        <PickerField
          label="Location"
          value={locationValue}
          options={LOCATION_OPTIONS}
          onChange={(value) => update('location', value === 'Custom' ? '' : value)}
          allowCustom
        />
        {locationValue === 'Custom' ? (
          <FormField
            label="Custom Location"
            value={form.location}
            onChangeText={(value) => update('location', value)}
            placeholder="e.g. New York, NY"
          />
        ) : null}
        <FormField
          label="Salary Offered (optional)"
          value={form.salaryOffered?.toString() ?? ''}
          onChangeText={(value) =>
            update('salaryOffered', value ? parseFloat(value) || undefined : undefined)
          }
          placeholder="e.g. 120000"
          keyboardType="numeric"
        />
        <FormField
          label="Recruiter Contact (optional)"
          value={form.recruiterContact ?? ''}
          onChangeText={(value) => update('recruiterContact', value || undefined)}
          placeholder="Email or phone"
        />
        <FormField
          label="Resume Version (optional)"
          value={form.resumeVersion ?? ''}
          onChangeText={(value) => update('resumeVersion', value || undefined)}
          placeholder="e.g. v3, SWE-ATS, PM-tailored"
        />
        <DatePickerField
          label="Date Applied"
          value={form.dateApplied}
          onChange={(value) => update('dateApplied', value)}
        />
        <PickerField
          label="Status"
          value={form.status}
          options={JOB_STATUSES}
          onChange={(value) => update('status', value as JobFormData['status'])}
        />
        <DatePickerField
          label="Follow-Up Date (optional)"
          value={form.followUpDate}
          onChange={(value) => update('followUpDate', value || undefined)}
          placeholder="Select date"
        />
        <FormField
          label="Notes (optional)"
          value={form.notes ?? ''}
          onChangeText={(value) => update('notes', value || undefined)}
          placeholder="Add notes..."
          multiline
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Save Application</Text>
        </TouchableOpacity>
        <View style={{ height: SPACING.xl }} />
      </ScrollView>
      </KeyboardAvoidingView>
      <AppDialog
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        actions={dialog.actions}
        onClose={() => setDialog((prev) => ({ ...prev, visible: false }))}
      />
    </>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backText: {
    fontSize: 16,
    color: colors.accent,
    marginRight: SPACING.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: SPACING.md,
    shadowColor: colors.tabShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 9,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
});
