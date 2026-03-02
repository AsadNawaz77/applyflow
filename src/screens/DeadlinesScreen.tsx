import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';
import { useJobsContext } from '../context/JobsContext';
import { useAppTheme } from '../context/ThemeContext';
import { AppColors, RADIUS, SPACING } from '../utils/constants';
import { formatDate } from '../utils/dateUtils';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Deadlines'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function DeadlinesScreen({ navigation }: Props) {
  const { deadlines } = useJobsContext();
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Deadlines</Text>
      </View>

      <FlatList
        data={deadlines}
        keyExtractor={(item) => item.id}
        contentContainerStyle={deadlines.length === 0 ? styles.emptyList : styles.list}
        renderItem={({ item }) => {
          const isLocked = item.status === 'Offer' || item.status === 'Rejected';
          return (
            <TouchableOpacity
              style={[styles.card, item.overdue && styles.cardOverdue, isLocked && styles.cardDisabled]}
              onPress={isLocked ? undefined : () => navigation.navigate('JobDetails', { jobId: item.id })}
              activeOpacity={isLocked ? 1 : 0.85}
              disabled={isLocked}
            >
              <Text style={styles.company}>{item.companyName}</Text>
              <Text style={styles.role}>{item.role}</Text>
              <View style={styles.row}>
                <Text style={styles.dateLabel}>Follow-up: {formatDate(item.followUpDate)}</Text>
                <Text style={[styles.badge, item.overdue ? styles.overdue : styles.upcoming]}>
                  {item.overdue ? 'Overdue' : 'Upcoming'}
                </Text>
              </View>
              {isLocked ? <Text style={styles.lockedText}>Locked</Text> : null}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No follow-up deadlines yet</Text>
            <Text style={styles.emptySubtext}>
              Add follow-up dates in applications to manage them here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
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
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  title: {
    color: colors.primary,
    fontSize: 30,
    fontWeight: '800',
  },
  list: {
    padding: SPACING.md,
  },
  emptyList: {
    flexGrow: 1,
    padding: SPACING.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: colors.tabShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  cardOverdue: {
    borderColor: colors.warning,
  },
  cardDisabled: {
    opacity: 0.82,
  },
  company: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  role: {
    marginTop: SPACING.xs,
    color: colors.secondary,
    fontSize: 14,
  },
  row: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateLabel: {
    color: colors.primary,
    fontSize: 13,
  },
  badge: {
    fontSize: 12,
    fontWeight: '700',
  },
  overdue: {
    color: colors.error,
  },
  upcoming: {
    color: colors.success,
  },
  lockedText: {
    marginTop: SPACING.xs,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    color: colors.secondary,
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtext: {
    marginTop: SPACING.xs,
    textAlign: 'center',
    color: colors.muted,
    fontSize: 14,
  },
});
