import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
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
import { formatDate } from '../utils/dateUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'JobDetails'>;

export function JobDetailsScreen({ navigation, route }: Props) {
  const { jobId } = route.params;
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const { getJobById, updateJob, deleteJob, addChecklistItem, toggleChecklistItem, removeChecklistItem } =
    useJobsContext();
  const job = getJobById(jobId);

  const [form, setForm] = useState<JobFormData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTask, setNewTask] = useState('');
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

  useEffect(() => {
    if (!job) return;
    setForm({
      companyName: job.companyName,
      role: job.role,
      jobType: job.jobType,
      location: job.location,
      salaryOffered: job.salaryOffered,
      recruiterContact: job.recruiterContact,
      dateApplied: job.dateApplied,
      status: job.status,
      followUpDate: job.followUpDate,
      notes: job.notes,
      resumeVersion: job.resumeVersion,
      reflection: job.reflection,
    });
  }, [job]);

  const update = <K extends keyof JobFormData>(key: K, value: JobFormData[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : null));
    if (errors[key as string]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = (): boolean => {
    if (!form) return false;
    const next: Record<string, string> = {};
    if (!form.companyName.trim()) next.companyName = 'Company name is required';
    if (!form.role.trim()) next.role = 'Role is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!form || !job || !validate()) return;
    try {
      const wasOffer = job.status === 'Offer';
      const willOffer = form.status === 'Offer';
      const wasRejected = job.status === 'Rejected';
      const willReject = form.status === 'Rejected';

      await updateJob(jobId, form);

      if (!wasOffer && willOffer) {
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
      } else if (!wasRejected && willReject) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'MainTabs',
                params: {
                  screen: 'Dashboard',
                  params: { result: 'rejected' as ResultType, jobId },
                },
              },
            ],
          }),
        );
      } else {
        navigation.goBack();
      }
    } catch {
      showDialog('Error', 'Failed to update job application.');
    }
  };

  const handleDelete = () => {
    showDialog('Delete Application', 'Are you sure you want to delete this application?', [
      { label: 'Cancel', tone: 'secondary' },
      {
        label: 'Delete',
        tone: 'danger',
        onPress: async () => {
          try {
            await deleteJob(jobId);
            navigation.replace('MainTabs', { screen: 'Dashboard' });
          } catch {
            showDialog('Error', 'Failed to delete application.');
          }
        },
      },
    ]);
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    await addChecklistItem(jobId, newTask);
    setNewTask('');
  };

  if (!job || !form) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Job Details</Text>
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
        <FormField
          label="Reflection (optional)"
          value={form.reflection ?? ''}
          onChangeText={(value) => update('reflection', value || undefined)}
          placeholder="What did you learn from this application?"
          multiline
        />

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Interview Prep Checklist</Text>
          <View style={styles.taskRow}>
            <TextInput
              value={newTask}
              onChangeText={setNewTask}
              placeholder="Add a prep task"
              placeholderTextColor={colors.muted}
              style={styles.taskInput}
            />
            <TouchableOpacity style={styles.taskAddButton} onPress={handleAddTask}>
              <Text style={styles.taskAddText}>Add</Text>
            </TouchableOpacity>
          </View>
          {(job.checklist ?? []).length === 0 ? (
            <Text style={styles.emptyHint}>No checklist items yet.</Text>
          ) : (
            (job.checklist ?? []).map((item) => (
              <View key={item.id} style={styles.taskItem}>
                <TouchableOpacity onPress={() => toggleChecklistItem(jobId, item.id)}>
                  <Text style={[styles.taskToggle, item.done && styles.taskDone]}>{item.done ? '[x]' : '[ ]'}</Text>
                </TouchableOpacity>
                <Text style={[styles.taskText, item.done && styles.taskDone]}>{item.text}</Text>
                <TouchableOpacity onPress={() => removeChecklistItem(jobId, item.id)}>
                  <Text style={styles.taskRemove}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Application Timeline</Text>
          {(job.history ?? []).length === 0 ? (
            <Text style={styles.emptyHint}>No timeline entries yet.</Text>
          ) : (
            [...(job.history ?? [])]
              .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
              .map((entry) => (
                <View key={entry.id} style={styles.historyItem}>
                  <Text style={styles.historyTitle}>
                    {entry.type === 'created'
                      ? 'Application created'
                      : entry.type === 'status_changed'
                        ? `Status: ${entry.fromStatus} -> ${entry.toStatus}`
                        : 'Reflection updated'}
                  </Text>
                  <Text style={styles.historyTime}>{formatDate(entry.timestamp)}</Text>
                </View>
              ))
          )}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Save Changes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.8}>
          <Text style={styles.deleteButtonText}>Delete Application</Text>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.muted,
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
  deleteButton: {
    backgroundColor: colors.accentSoft,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: colors.error,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  panel: {
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: SPACING.md,
    backgroundColor: colors.surface,
    shadowColor: colors.tabShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: SPACING.sm,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    color: colors.primary,
    marginRight: SPACING.sm,
  },
  taskAddButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  taskAddText: {
    color: colors.surface,
    fontWeight: '700',
  },
  emptyHint: {
    color: colors.muted,
    fontSize: 13,
    marginTop: SPACING.xs,
  },
  taskItem: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskToggle: {
    fontSize: 14,
    color: colors.secondary,
    marginRight: SPACING.sm,
  },
  taskText: {
    flex: 1,
    color: colors.primary,
    fontSize: 14,
  },
  taskDone: {
    textDecorationLine: 'line-through',
    color: colors.muted,
  },
  taskRemove: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
  historyItem: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  historyTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  historyTime: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 12,
  },
});
