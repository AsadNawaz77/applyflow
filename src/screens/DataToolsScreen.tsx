import React, { useMemo, useState } from 'react';
import {
  Clipboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps, useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppDialog, AppDialogAction } from '../components/AppDialog';
import { useJobsContext } from '../context/JobsContext';
import { useAppTheme } from '../context/ThemeContext';
import { MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';
import { Job } from '../types';
import { AppColors, RADIUS, SPACING } from '../utils/constants';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'DataTools'>,
  NativeStackScreenProps<RootStackParamList>
>;

const DOWNLOADS_URI_KEY = '@applyflow_downloads_directory_uri';

function buildCsv(rows: Job[]): string {
  const headers = [
    'id',
    'companyName',
    'role',
    'jobType',
    'location',
    'dateApplied',
    'status',
    'followUpDate',
    'resumeVersion',
    'reflection',
    'createdAt',
    'updatedAt',
  ];
  const escape = (value?: string) => `"${(value ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map((job) =>
    [
      job.id,
      job.companyName,
      job.role,
      job.jobType,
      job.location,
      job.dateApplied,
      job.status,
      job.followUpDate ?? '',
      job.resumeVersion ?? '',
      job.reflection ?? '',
      job.createdAt,
      job.updatedAt,
    ]
      .map((cell) => escape(cell))
      .join(','),
  );
  return [headers.join(','), ...lines].join('\n');
}

function buildTimestamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(
    now.getHours(),
  )}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

export function DataToolsScreen(_: Props) {
  const { jobs, exportJson, exportCsv, importJobsFromJson } = useJobsContext();
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const [importText, setImportText] = useState('');
  const [previewType, setPreviewType] = useState<'json' | 'csv'>('json');
  const [yearText, setYearText] = useState(String(new Date().getFullYear()));
  const [monthText, setMonthText] = useState(String(new Date().getMonth() + 1));
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

  const previewValue = previewType === 'json' ? exportJson : exportCsv;

  const monthOptions = useMemo(
    () => [
      { label: 'All', value: '' },
      ...Array.from({ length: 12 }, (_, index) => {
        const month = index + 1;
        return { label: String(month), value: String(month) };
      }),
    ],
    [],
  );

  const showDialog = (title: string, message: string, actions?: AppDialogAction[]) => {
    setDialog({
      visible: true,
      title,
      message,
      actions,
    });
  };

  const handleCopy = (value: string, label: string) => {
    Clipboard.setString(value);
    showDialog('Copied', `${label} copied to clipboard.`);
  };

  const requestDownloadsDirectoryUri = async (): Promise<string | null> => {
    if (Platform.OS !== 'android') return null;
    const initialUri = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot('Download');
    const permission =
      await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(initialUri);
    if (!permission.granted) return null;
    await AsyncStorage.setItem(DOWNLOADS_URI_KEY, permission.directoryUri);
    return permission.directoryUri;
  };

  const writeCsvToDownloadsAndroid = async (csv: string, fileName: string) => {
    let directoryUri = await AsyncStorage.getItem(DOWNLOADS_URI_KEY);
    if (!directoryUri) {
      directoryUri = await requestDownloadsDirectoryUri();
    }
    if (!directoryUri) {
      throw new Error('Downloads folder permission was not granted.');
    }

    const fileTitle = fileName.replace(/\.csv$/i, '');
    try {
      const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        directoryUri,
        fileTitle,
        'text/csv',
      );
      await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      showDialog('Saved', `${fileName} saved to Downloads.`);
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (
        message.includes('permission') ||
        message.includes('denied') ||
        message.includes('not granted')
      ) {
        await AsyncStorage.removeItem(DOWNLOADS_URI_KEY);
      }
      throw error;
    }
  };

  const writeAndSaveCsv = async (csv: string, fileName: string) => {
    if (Platform.OS === 'android') {
      await writeCsvToDownloadsAndroid(csv, fileName);
      return;
    }

    const baseDir = FileSystem.cacheDirectory;
    if (!baseDir) {
      throw new Error('File system is not available on this device.');
    }
    const uri = `${baseDir}${fileName}`;
    await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      showDialog('Saved', `CSV generated at:\n${uri}`);
      return;
    }
    await Sharing.shareAsync(uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Save CSV',
      UTI: 'public.comma-separated-values-text',
    });
  };

  const handleDownloadAllCsv = async () => {
    if (jobs.length === 0) {
      showDialog('No data', 'There are no applications to export.');
      return;
    }
    try {
      await writeAndSaveCsv(buildCsv(jobs), `applyflow-all-${buildTimestamp()}.csv`);
    } catch (error) {
      showDialog('Error', error instanceof Error ? error.message : 'Failed to generate CSV.');
    }
  };

  const handleDownloadMonthlyCsv = async () => {
    const year = Number(yearText);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      showDialog('Invalid year', 'Enter a valid year between 2000 and 2100.');
      return;
    }

    const month = monthText ? Number(monthText) : NaN;
    if (monthText && (!Number.isInteger(month) || month < 1 || month > 12)) {
      showDialog('Invalid month', 'Month must be between 1 and 12.');
      return;
    }

    const filtered = jobs.filter((job) => {
      const date = new Date(job.dateApplied);
      if (Number.isNaN(date.getTime())) return false;
      if (date.getFullYear() !== year) return false;
      if (!monthText) return true;
      return date.getMonth() + 1 === month;
    });

    if (filtered.length === 0) {
      showDialog('No data', 'No applications found for selected period.');
      return;
    }

    try {
      const monthPart = monthText ? String(month).padStart(2, '0') : 'all-months';
      await writeAndSaveCsv(
        buildCsv(filtered),
        `applyflow-${year}-${monthPart}-${buildTimestamp()}.csv`,
      );
    } catch (error) {
      showDialog('Error', error instanceof Error ? error.message : 'Failed to generate CSV.');
    }
  };

  const handleImport = async () => {
    try {
      await importJobsFromJson(importText);
      showDialog('Success', 'Backup imported successfully.');
      setImportText('');
    } catch (error) {
      showDialog('Error', error instanceof Error ? error.message : 'Import failed.');
    }
  };

  return (
    <>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Backup & Import</Text>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: tabBarHeight + insets.bottom + SPACING.lg },
          ]}
        >
          <Text style={styles.sectionTitle}>Download CSV File</Text>
          <Text style={styles.sectionHint}>
            Export all applications or choose month/year for a period-specific file.
          </Text>

          <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadAllCsv}>
            <Text style={styles.downloadButtonText}>Download CSV (All Time)</Text>
          </TouchableOpacity>

          <View style={styles.periodRow}>
            <TextInput
              value={yearText}
              onChangeText={setYearText}
              keyboardType="number-pad"
              placeholder="Year (e.g. 2026)"
              placeholderTextColor={colors.muted}
              style={styles.periodInput}
              maxLength={4}
            />
          </View>
          <View style={styles.monthRow}>
            {monthOptions.map((option) => (
              <TouchableOpacity
                key={option.label}
                style={[styles.monthChip, monthText === option.value && styles.monthChipActive]}
                onPress={() => setMonthText(option.value)}
              >
                <Text
                  style={[
                    styles.monthChipText,
                    monthText === option.value && styles.monthChipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.downloadAltButton} onPress={handleDownloadMonthlyCsv}>
            <Text style={styles.downloadAltButtonText}>
              Download CSV ({monthText || 'All Months'} / {yearText || 'Year'})
            </Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Export Preview</Text>
          <Text style={styles.sectionHint}>
            Copy this backup text and save it securely. Import it later to restore data.
          </Text>
          <View style={styles.exportRow}>
            <TouchableOpacity
              style={[styles.chip, previewType === 'json' && styles.chipActive]}
              onPress={() => setPreviewType('json')}
            >
              <Text style={[styles.chipText, previewType === 'json' && styles.chipTextActive]}>
                JSON
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, previewType === 'csv' && styles.chipActive]}
              onPress={() => setPreviewType('csv')}
            >
              <Text style={[styles.chipText, previewType === 'csv' && styles.chipTextActive]}>
                CSV
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleCopy(previewValue, previewType.toUpperCase())}
            >
              <View style={styles.copyIconBack} />
              <View style={styles.copyIconFront} />
            </TouchableOpacity>
          </View>
          <TextInput
            value={previewValue}
            editable={false}
            multiline
            style={styles.output}
            textAlignVertical="top"
          />

          <View style={styles.importHeader}>
            <Text style={styles.sectionTitle}>Import (JSON)</Text>
            <TouchableOpacity style={styles.iconButton} onPress={() => handleCopy(importText, 'Import text')}>
              <View style={styles.copyIconBack} />
              <View style={styles.copyIconFront} />
            </TouchableOpacity>
          </View>
          <TextInput
            value={importText}
            onChangeText={setImportText}
            multiline
            placeholder="Paste exported JSON backup array here"
            placeholderTextColor={colors.muted}
            style={styles.input}
            textAlignVertical="top"
          />
          <TouchableOpacity style={styles.importButton} onPress={handleImport}>
            <Text style={styles.importText}>Import Backup</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
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
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  title: {
    color: colors.primary,
    fontSize: 30,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: SPACING.sm,
  },
  sectionHint: {
    color: colors.secondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  downloadButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
    shadowColor: colors.tabShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  downloadButtonText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 14,
  },
  periodRow: {
    marginTop: SPACING.sm,
  },
  periodInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: RADIUS.md,
    backgroundColor: colors.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    color: colors.primary,
    fontSize: 14,
  },
  monthRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  monthChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  monthChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  monthChipText: {
    color: colors.secondary,
    fontWeight: '600',
    fontSize: 12,
  },
  monthChipTextActive: {
    color: colors.accent,
  },
  downloadAltButton: {
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    backgroundColor: colors.surface,
  },
  downloadAltButtonText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  exportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  importHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  chip: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  chipText: {
    color: colors.secondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.accent,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    position: 'relative',
  },
  copyIconBack: {
    position: 'absolute',
    top: 11,
    left: 10,
    width: 9,
    height: 9,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    borderRadius: 1,
  },
  copyIconFront: {
    position: 'absolute',
    top: 8,
    left: 13,
    width: 10,
    height: 10,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 1,
    backgroundColor: colors.surface,
  },
  output: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: RADIUS.md,
    backgroundColor: colors.surface,
    minHeight: 180,
    maxHeight: 280,
    padding: SPACING.sm,
    color: colors.primary,
    fontSize: 12,
    marginBottom: SPACING.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: RADIUS.md,
    backgroundColor: colors.surface,
    minHeight: 160,
    padding: SPACING.sm,
    color: colors.primary,
    fontSize: 13,
    marginTop: SPACING.sm,
  },
  importButton: {
    marginTop: SPACING.md,
    backgroundColor: colors.accent,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
    shadowColor: colors.tabShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  importText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 15,
  },
});
