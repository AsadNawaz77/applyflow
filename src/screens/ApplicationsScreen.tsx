import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { JobCard } from '../components/JobCard';
import { ReadOnlyJobModal } from '../components/ReadOnlyJobModal';
import { useJobsContext } from '../context/JobsContext';
import { useAppTheme } from '../context/ThemeContext';
import { MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';
import { Job, JobStatus, JOB_STATUSES, JOB_TYPES } from '../types';
import { AppColors, RADIUS, SPACING } from '../utils/constants';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Applications'>,
  NativeStackScreenProps<RootStackParamList>
>;

type SortOption = 'recent' | 'oldest' | 'company';

type AppSection = {
  title: string;
  data: Job[];
};

function monthLabel(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function ApplicationsScreen({ navigation }: Props) {
  const { jobs, loading, refreshJobs } = useJobsContext();
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | JobStatus>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | (typeof JOB_TYPES)[number]>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [monthFilter, setMonthFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [readOnlyJob, setReadOnlyJob] = useState<Job | null>(null);

  const years = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((job) => {
      const d = new Date(job.dateApplied);
      if (!Number.isNaN(d.getTime())) set.add(String(d.getFullYear()));
    });
    return ['All', ...Array.from(set).sort((a, b) => Number(b) - Number(a))];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    let list = [...jobs];
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery) {
      list = list.filter(
        (job) =>
          job.companyName.toLowerCase().includes(normalizedQuery) ||
          job.role.toLowerCase().includes(normalizedQuery),
      );
    }
    if (statusFilter !== 'All') list = list.filter((job) => job.status === statusFilter);
    if (typeFilter !== 'All') list = list.filter((job) => job.jobType === typeFilter);
    if (yearFilter !== 'All') {
      list = list.filter((job) => {
        const date = new Date(job.dateApplied);
        return !Number.isNaN(date.getTime()) && String(date.getFullYear()) === yearFilter;
      });
    }
    if (monthFilter !== 'All') {
      list = list.filter((job) => {
        const date = new Date(job.dateApplied);
        return !Number.isNaN(date.getTime()) && String(date.getMonth() + 1) === monthFilter;
      });
    }

    if (sortBy === 'recent') {
      list.sort((a, b) => b.dateApplied.localeCompare(a.dateApplied));
    } else if (sortBy === 'oldest') {
      list.sort((a, b) => a.dateApplied.localeCompare(b.dateApplied));
    } else {
      list.sort((a, b) => a.companyName.localeCompare(b.companyName));
    }
    return list;
  }, [jobs, monthFilter, query, sortBy, statusFilter, typeFilter, yearFilter]);

  const sections = useMemo<AppSection[]>(() => {
    const grouped = new Map<string, Job[]>();
    filteredJobs.forEach((job) => {
      const label = monthLabel(job.dateApplied);
      const list = grouped.get(label) ?? [];
      list.push(job);
      grouped.set(label, list);
    });
    return Array.from(grouped.entries()).map(([title, data]) => ({ title, data }));
  }, [filteredJobs]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Applications</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddJob')}
          activeOpacity={0.85}
        >
          <Text style={styles.addButtonText}>+ Add Job</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterCard}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search company or role..."
          placeholderTextColor={colors.muted}
        />
        <View style={styles.filterRow}>
          {years.map((year) => (
            <TouchableOpacity
              key={year}
              style={[styles.chip, yearFilter === year && styles.chipActive]}
              onPress={() => setYearFilter(year)}
            >
              <Text style={[styles.chipText, yearFilter === year && styles.chipTextActive]}>
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.filterRow}>
          {['All', ...Array.from({ length: 12 }, (_, i) => String(i + 1))].map((month) => (
            <TouchableOpacity
              key={month}
              style={[styles.chip, monthFilter === month && styles.chipActive]}
              onPress={() => setMonthFilter(month)}
            >
              <Text style={[styles.chipText, monthFilter === month && styles.chipTextActive]}>
                {month === 'All' ? 'All Months' : month}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.filterRow}>
          {(['recent', 'oldest', 'company'] as SortOption[]).map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.chip, sortBy === option && styles.chipActive]}
              onPress={() => setSortBy(option)}
            >
              <Text style={[styles.chipText, sortBy === option && styles.chipTextActive]}>
                {option === 'recent' ? 'Recent' : option === 'oldest' ? 'Oldest' : 'A-Z'}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.chip, statusFilter === 'All' && styles.chipActive]}
            onPress={() => setStatusFilter('All')}
          >
            <Text style={[styles.chipText, statusFilter === 'All' && styles.chipTextActive]}>
              All Status
            </Text>
          </TouchableOpacity>
          {JOB_STATUSES.map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.chip, statusFilter === status && styles.chipActive]}
              onPress={() => setStatusFilter(status)}
            >
              <Text style={[styles.chipText, statusFilter === status && styles.chipTextActive]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.chip, typeFilter === 'All' && styles.chipActive]}
            onPress={() => setTypeFilter('All')}
          >
            <Text style={[styles.chipText, typeFilter === 'All' && styles.chipTextActive]}>
              All Types
            </Text>
          </TouchableOpacity>
          {JOB_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.chip, typeFilter === type && styles.chipActive]}
              onPress={() => setTypeFilter(type)}
            >
              <Text style={[styles.chipText, typeFilter === type && styles.chipTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCount}>{section.data.length}</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const isLocked = item.status === 'Offer' || item.status === 'Rejected';
          return (
            <JobCard
              job={item}
              locked={isLocked}
              onPress={() =>
                isLocked ? setReadOnlyJob(item) : navigation.navigate('JobDetails', { jobId: item.id })
              }
            />
          );
        }}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshJobs}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No applications match this filter</Text>
          </View>
        }
        contentContainerStyle={sections.length === 0 ? styles.emptyContainer : styles.listContainer}
      />
      <ReadOnlyJobModal
        visible={Boolean(readOnlyJob)}
        job={readOnlyJob}
        onClose={() => setReadOnlyJob(null)}
      />
    </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.primary,
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    shadowColor: colors.tabShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  addButtonText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 14,
  },
  filterCard: {
    marginHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: SPACING.sm,
    backgroundColor: colors.surface,
    marginBottom: SPACING.sm,
    shadowColor: colors.tabShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    color: colors.primary,
    marginBottom: SPACING.sm,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  chipText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.accent,
  },
  sectionHeader: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCount: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  listContainer: {
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '700',
  },
});
