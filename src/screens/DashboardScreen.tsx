import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import { MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';
import { JobCard } from '../components/JobCard';
import { SummaryCard } from '../components/SummaryCard';
import { WeeklyGoalCard } from '../components/WeeklyGoalCard';
import { InsightCard } from '../components/InsightCard';
import { ReflectionModal } from '../components/ReflectionModal';
import { ReadOnlyJobModal } from '../components/ReadOnlyJobModal';
import { SPACING, AppColors } from '../utils/constants';
import { useJobsContext } from '../context/JobsContext';
import { useAppTheme } from '../context/ThemeContext';
import { Job } from '../types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Dashboard'>,
  NativeStackScreenProps<RootStackParamList>
>;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function computeStats(jobs: Job[]) {
  const total = jobs.length;
  const interviews = jobs.filter((job) =>
    ['HR Interview', 'Technical Interview', 'Final Round'].includes(job.status),
  ).length;
  const offers = jobs.filter((job) => job.status === 'Offer').length;
  const rejections = jobs.filter((job) => job.status === 'Rejected').length;
  const interviewRate = total > 0 ? Math.round((interviews / total) * 100) : 0;
  const offerRate = total > 0 ? Math.round((offers / total) * 100) : 0;
  return { total, interviews, offers, rejections, interviewRate, offerRate };
}

export function DashboardScreen({ navigation, route }: Props) {
  const { colors, mode, toggleTheme } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    jobs,
    loading,
    refreshJobs,
    weeklyGoal,
    setWeeklyGoal,
    clearWeeklyGoal,
    weeklyProgress,
    insights,
    getJobById,
    updateReflection,
  } = useJobsContext();

  const stats = useMemo(() => computeStats(jobs), [jobs]);
  const recentJobs = useMemo(
    () => [...jobs].sort((a, b) => b.dateApplied.localeCompare(a.dateApplied)).slice(0, 12),
    [jobs],
  );

  const screenWidth = Dimensions.get('window').width;
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [reflectionJobId, setReflectionJobId] = useState<string | null>(null);
  const [readOnlyJob, setReadOnlyJob] = useState<Job | null>(null);
  const congratsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [jobs, insightsOpen]);

  useEffect(() => {
    const result = route.params?.result;
    const jobId = route.params?.jobId;
    if (!result) return;

    navigation.setParams({ result: undefined, jobId: undefined });

    if (result === 'offer') {
      setShowConfetti(true);
      setShowCongrats(true);
      Animated.sequence([
        Animated.timing(congratsOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.delay(1800),
        Animated.timing(congratsOpacity, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        setShowConfetti(false);
        setShowCongrats(false);
      }, 2600);
      return () => clearTimeout(timer);
    }

    if (result === 'rejected' && jobId) {
      const targetJob = getJobById(jobId);
      if (targetJob?.status === 'Rejected') {
        setReflectionJobId(jobId);
        setReflectionOpen(true);
      }
    }
  }, [route.params, navigation, congratsOpacity, getJobById]);

  return (
    <View style={styles.container}>
      {(showConfetti || showCongrats) && (
        <View style={styles.animationContainer} pointerEvents="none">
          {showConfetti ? (
            <>
              <ConfettiCannon count={130} origin={{ x: -20, y: 0 }} fadeOut fallSpeed={2800} />
              <ConfettiCannon
                count={130}
                origin={{ x: screenWidth + 20, y: 0 }}
                fadeOut
                fallSpeed={2800}
              />
            </>
          ) : null}
          {showCongrats ? (
            <Animated.View style={[styles.congratsOverlay, { opacity: congratsOpacity }]}>
              <Text style={styles.congratsText}>Congratulations!</Text>
            </Animated.View>
          ) : null}
        </View>
      )}

      <FlatList
        data={recentJobs}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshJobs}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.title}>ApplyFlow</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.themeButton} onPress={toggleTheme} activeOpacity={0.85}>
                  <Ionicons
                    name={mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
                    size={16}
                    color={colors.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => navigation.navigate('AddJob')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.addButtonText}>+ Add Job</Text>
                </TouchableOpacity>
              </View>
            </View>

            <WeeklyGoalCard
              completed={weeklyProgress.completed}
              target={weeklyProgress.target}
              percentage={weeklyProgress.percentage}
              hasGoal={Boolean(weeklyGoal)}
              onSaveGoal={setWeeklyGoal}
              onClearGoal={clearWeeklyGoal}
            />

            <View style={styles.statsRow}>
              <SummaryCard label="Total" value={stats.total} />
              <SummaryCard label="Interviews" value={stats.interviews} />
              <SummaryCard label="Offers" value={stats.offers} />
            </View>
            <View style={styles.statsRow}>
              <SummaryCard label="Rejections" value={stats.rejections} />
              <SummaryCard label="Interview %" value={`${stats.interviewRate}%`} />
              <SummaryCard label="Offer %" value={`${stats.offerRate}%`} />
            </View>

            <View style={styles.insightsSection}>
              <TouchableOpacity
                style={styles.insightsHeader}
                onPress={() => setInsightsOpen((prev) => !prev)}
                activeOpacity={0.85}
              >
                <Text style={styles.sectionTitle}>Insights</Text>
                <Text style={styles.insightsToggle}>{insightsOpen ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
              {insightsOpen ? (
                <>
                  <InsightCard label="Interview Rate" value={`${insights.interviewRate}%`} />
                  <InsightCard label="Offer Rate" value={`${insights.offerRate}%`} />
                  <InsightCard label="Most Applied Job Type" value={insights.mostAppliedJobType} />
                  <InsightCard
                    label="Most Successful Job Type"
                    value={insights.mostSuccessfulJobType}
                    hint="Highest interview progression rate"
                  />
                  <InsightCard
                    label="Avg. Days to Final Outcome"
                    value={`${insights.averageDaysToFinalStatus} days`}
                  />
                </>
              ) : null}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Applications</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Applications')}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        renderItem={({ item }) => {
          const isLocked = item.status === 'Offer' || item.status === 'Rejected';
          return (
            <View style={styles.cardWrap}>
              <JobCard
                job={item}
                locked={isLocked}
                onPress={() =>
                  isLocked ? setReadOnlyJob(item) : navigation.navigate('JobDetails', { jobId: item.id })
                }
              />
            </View>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No applications yet</Text>
              <Text style={styles.emptySubtext}>
                Tap "Add Job" to create your first application.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={recentJobs.length === 0 ? styles.listEmpty : styles.listContent}
      />

      <ReflectionModal
        visible={reflectionOpen}
        initialValue={reflectionJobId ? getJobById(reflectionJobId)?.reflection : ''}
        onSave={async (reflection) => {
          if (!reflectionJobId) return;
          await updateReflection(reflectionJobId, reflection);
        }}
        onClose={() => {
          setReflectionOpen(false);
          setReflectionJobId(null);
        }}
      />
      <ReadOnlyJobModal
        visible={Boolean(readOnlyJob)}
        job={readOnlyJob}
        onClose={() => setReadOnlyJob(null)}
      />
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
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
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    themeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING.sm,
    },
    title: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.primary,
    },
    addButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: SPACING.md,
      paddingVertical: 10,
      borderRadius: 12,
      shadowColor: colors.tabShadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.22,
      shadowRadius: 8,
      elevation: 3,
    },
    addButtonText: {
      color: colors.surface,
      fontSize: 14,
      fontWeight: '700',
    },
    statsRow: {
      flexDirection: 'row',
      marginHorizontal: SPACING.sm,
      marginTop: SPACING.md,
    },
    insightsSection: {
      marginTop: SPACING.lg,
      marginHorizontal: SPACING.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: SPACING.sm,
    },
    insightsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.sm,
    },
    insightsToggle: {
      fontSize: 13,
      color: colors.accent,
      fontWeight: '600',
    },
    sectionHeader: {
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.xl,
      paddingBottom: SPACING.sm,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
    },
    viewAll: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: '700',
      backgroundColor: colors.accentSoft,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 6,
      borderRadius: 999,
    },
    cardWrap: {
      paddingHorizontal: SPACING.md,
    },
    listContent: {
      paddingBottom: SPACING.xl,
    },
    listEmpty: {
      flexGrow: 1,
      paddingBottom: SPACING.xl,
    },
    empty: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: SPACING.xl * 2,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.secondary,
    },
    emptySubtext: {
      marginTop: SPACING.xs,
      fontSize: 14,
      color: colors.muted,
    },
    animationContainer: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    congratsOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
    },
    congratsText: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.surface,
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
    },
  });
}
