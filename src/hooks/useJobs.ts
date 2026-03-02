import { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChecklistItem, Job, JobFormData, JobHistoryEvent, JobStatus } from '../types';
import {
  loadJobs,
  saveJobs,
  loadWeeklyGoal,
  saveWeeklyGoal,
  WeeklyGoalState,
} from '../storage/jobStorage';
import { diffDays, getStartOfWeekISO, toISODateString } from '../utils/dateUtils';
import {
  cancelJobNotifications,
  scheduleFollowUpReminder,
  scheduleStageReminders,
} from '../utils/notificationUtils';

const INTERVIEW_STATUSES: JobStatus[] = [
  'HR Interview',
  'Technical Interview',
  'Final Round',
  'Offer',
];

interface ResumeInsight {
  resumeVersion: string;
  interviewRate: number;
  count: number;
}

export interface Insights {
  interviewRate: number;
  offerRate: number;
  mostAppliedJobType: string;
  mostSuccessfulJobType: string;
  averageDaysToFinalStatus: number;
  resumeInsights: ResumeInsight[];
  bestResumeVersion: string;
}

interface WeeklyProgress {
  completed: number;
  target: number;
  percentage: number;
  weekStart: string;
}

export interface DeadlineItem {
  id: string;
  companyName: string;
  role: string;
  followUpDate: string;
  status: JobStatus;
  overdue: boolean;
}

function buildStatusHistoryEvent(fromStatus: JobStatus, toStatus: JobStatus): JobHistoryEvent {
  return {
    id: uuidv4(),
    type: 'status_changed',
    timestamp: new Date().toISOString(),
    fromStatus,
    toStatus,
  };
}

function calculateInsights(jobs: Job[]): Insights {
  const total = jobs.length;
  const interviewed = jobs.filter((job) => INTERVIEW_STATUSES.includes(job.status)).length;
  const offers = jobs.filter((job) => job.status === 'Offer').length;
  const interviewRate = total > 0 ? Math.round((interviewed / total) * 100) : 0;
  const offerRate = total > 0 ? Math.round((offers / total) * 100) : 0;

  const byType = new Map<string, Job[]>();
  jobs.forEach((job) => {
    const list = byType.get(job.jobType) ?? [];
    list.push(job);
    byType.set(job.jobType, list);
  });

  let mostAppliedJobType = 'N/A';
  let maxApplied = 0;
  let mostSuccessfulJobType = 'N/A';
  let bestTypeRate = -1;

  byType.forEach((list, jobType) => {
    if (list.length > maxApplied) {
      maxApplied = list.length;
      mostAppliedJobType = jobType;
    }
    const interviewCount = list.filter((job) => INTERVIEW_STATUSES.includes(job.status)).length;
    const rate = list.length > 0 ? Math.round((interviewCount / list.length) * 100) : 0;
    if (rate > bestTypeRate) {
      bestTypeRate = rate;
      mostSuccessfulJobType = jobType;
    }
  });

  const finalJobs = jobs.filter((job) => job.status === 'Offer' || job.status === 'Rejected');
  const averageDaysToFinalStatus =
    finalJobs.length > 0
      ? Math.round(
          finalJobs.reduce((sum, job) => sum + diffDays(job.dateApplied, job.updatedAt), 0) /
            finalJobs.length,
        )
      : 0;

  const byResume = new Map<string, Job[]>();
  jobs.forEach((job) => {
    const key = (job.resumeVersion ?? '').trim();
    if (!key) return;
    const list = byResume.get(key) ?? [];
    list.push(job);
    byResume.set(key, list);
  });

  const resumeInsights: ResumeInsight[] = [];
  let bestResumeVersion = 'N/A';
  let bestResumeRate = -1;
  byResume.forEach((list, resumeVersion) => {
    const interviewCount = list.filter((job) => INTERVIEW_STATUSES.includes(job.status)).length;
    const interviewRateByResume =
      list.length > 0 ? Math.round((interviewCount / list.length) * 100) : 0;
    resumeInsights.push({
      resumeVersion,
      interviewRate: interviewRateByResume,
      count: list.length,
    });
    if (interviewRateByResume > bestResumeRate) {
      bestResumeRate = interviewRateByResume;
      bestResumeVersion = resumeVersion;
    }
  });

  resumeInsights.sort((a, b) => b.interviewRate - a.interviewRate || b.count - a.count);

  return {
    interviewRate,
    offerRate,
    mostAppliedJobType,
    mostSuccessfulJobType,
    averageDaysToFinalStatus,
    resumeInsights,
    bestResumeVersion,
  };
}

function calculateWeeklyProgress(
  jobs: Job[],
  weeklyGoal: WeeklyGoalState | null,
  weekStart: string,
): WeeklyProgress {
  const weekApplications = jobs.filter((job) => job.dateApplied >= weekStart).length;
  const target = weeklyGoal?.target ?? 0;
  const percentage = target > 0 ? Math.min(100, Math.round((weekApplications / target) * 100)) : 0;
  return {
    completed: weekApplications,
    target,
    percentage,
    weekStart,
  };
}

function toCsv(jobs: Job[]): string {
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
  const rows = jobs.map((job) =>
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
  return [headers.join(','), ...rows].join('\n');
}

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyGoal, setWeeklyGoalState] = useState<WeeklyGoalState | null>(null);

  const refreshJobs = useCallback(async () => {
    setLoading(true);
    const [loadedJobs, loadedGoal] = await Promise.all([loadJobs(), loadWeeklyGoal()]);
    const weekStart = getStartOfWeekISO();

    let normalizedGoal = loadedGoal;
    if (loadedGoal && loadedGoal.weekStart !== weekStart) {
      normalizedGoal = { ...loadedGoal, weekStart };
      await saveWeeklyGoal(normalizedGoal);
    }

    setJobs(loadedJobs);
    setWeeklyGoalState(normalizedGoal);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshJobs();
  }, [refreshJobs]);

  const addJob = useCallback(
    async (formData: JobFormData) => {
      const now = new Date().toISOString();
      let newJob: Job = {
        id: uuidv4(),
        ...formData,
        checklist: [],
        history: [
          {
            id: uuidv4(),
            type: 'created',
            timestamp: now,
            toStatus: formData.status,
          },
        ],
        createdAt: now,
        updatedAt: now,
      };
      const followUpReminderId = await scheduleFollowUpReminder(newJob);
      if (followUpReminderId) {
        newJob = {
          ...newJob,
          followUpReminderId,
        };
      }
      const updated = [...jobs, newJob];
      setJobs(updated);
      await saveJobs(updated);
      return newJob.id;
    },
    [jobs],
  );

  const updateJob = useCallback(
    async (id: string, formData: JobFormData) => {
      const job = jobs.find((entry) => entry.id === id);
      if (!job) return;

      const now = new Date().toISOString();
      const history = [...(job.history ?? [])];
      if (job.status !== formData.status) {
        history.push(buildStatusHistoryEvent(job.status, formData.status));
      }

      await cancelJobNotifications(job);

      let updatedJob: Job = {
        ...job,
        ...formData,
        stageReminderDayBeforeId: undefined,
        stageReminderOneHourId: undefined,
        followUpReminderId: undefined,
        history,
        updatedAt: now,
      };

      const stageReminders = await scheduleStageReminders(updatedJob);
      const followUpReminderId = await scheduleFollowUpReminder(updatedJob);
      updatedJob = {
        ...updatedJob,
        stageReminderDayBeforeId: stageReminders.dayBeforeId,
        stageReminderOneHourId: stageReminders.oneHourId,
        followUpReminderId,
      };

      const updated = jobs.map((entry) => (entry.id === id ? updatedJob : entry));
      setJobs(updated);
      await saveJobs(updated);
    },
    [jobs],
  );

  const updateReflection = useCallback(
    async (id: string, reflection: string) => {
      const now = new Date().toISOString();
      const reflectionEvent: JobHistoryEvent = {
        id: uuidv4(),
        type: 'reflection_updated',
        timestamp: now,
      };
      const updated = jobs.map((job) =>
        job.id === id
          ? {
              ...job,
              reflection: reflection.trim() || undefined,
              updatedAt: now,
              history: [...(job.history ?? []), reflectionEvent],
            }
          : job,
      );
      setJobs(updated);
      await saveJobs(updated);
    },
    [jobs],
  );

  const addChecklistItem = useCallback(
    async (jobId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const now = new Date().toISOString();
      const item: ChecklistItem = {
        id: uuidv4(),
        text: trimmed,
        done: false,
        createdAt: now,
      };
      const updated = jobs.map((job) =>
        job.id === jobId
          ? { ...job, checklist: [...(job.checklist ?? []), item], updatedAt: now }
          : job,
      );
      setJobs(updated);
      await saveJobs(updated);
    },
    [jobs],
  );

  const toggleChecklistItem = useCallback(
    async (jobId: string, itemId: string) => {
      const now = new Date().toISOString();
      const updated = jobs.map((job) => {
        if (job.id !== jobId) return job;
        return {
          ...job,
          checklist: (job.checklist ?? []).map((item) =>
            item.id === itemId ? { ...item, done: !item.done } : item,
          ),
          updatedAt: now,
        };
      });
      setJobs(updated);
      await saveJobs(updated);
    },
    [jobs],
  );

  const removeChecklistItem = useCallback(
    async (jobId: string, itemId: string) => {
      const now = new Date().toISOString();
      const updated = jobs.map((job) =>
        job.id === jobId
          ? {
              ...job,
              checklist: (job.checklist ?? []).filter((item) => item.id !== itemId),
              updatedAt: now,
            }
          : job,
      );
      setJobs(updated);
      await saveJobs(updated);
    },
    [jobs],
  );

  const deleteJob = useCallback(
    async (id: string) => {
      const target = jobs.find((entry) => entry.id === id);
      if (target) {
        await cancelJobNotifications(target);
      }
      const updated = jobs.filter((entry) => entry.id !== id);
      setJobs(updated);
      await saveJobs(updated);
    },
    [jobs],
  );

  const getJobById = useCallback((id: string) => jobs.find((job) => job.id === id), [jobs]);

  const setWeeklyGoal = useCallback(async (target: number) => {
    const sanitized = Math.max(1, Math.round(target));
    const goal: WeeklyGoalState = {
      target: sanitized,
      weekStart: getStartOfWeekISO(),
    };
    setWeeklyGoalState(goal);
    await saveWeeklyGoal(goal);
  }, []);

  const clearWeeklyGoal = useCallback(async () => {
    setWeeklyGoalState(null);
    await saveWeeklyGoal(null);
  }, []);

  const importJobsFromJson = useCallback(async (jsonText: string) => {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) {
      throw new Error('Backup JSON must be an array of jobs.');
    }
    await Promise.all(jobs.map((job) => cancelJobNotifications(job)));
    await saveJobs(parsed as Job[]);
    await refreshJobs();
  }, [jobs, refreshJobs]);

  const weeklyProgress = useMemo(
    () => calculateWeeklyProgress(jobs, weeklyGoal, getStartOfWeekISO()),
    [jobs, weeklyGoal],
  );

  const insights = useMemo(() => calculateInsights(jobs), [jobs]);
  const todayISO = toISODateString(new Date());
  const deadlines = useMemo<DeadlineItem[]>(
    () =>
      jobs
        .filter(
          (job) =>
            Boolean(job.followUpDate) && job.status !== 'Offer' && job.status !== 'Rejected',
        )
        .map((job) => ({
          id: job.id,
          companyName: job.companyName,
          role: job.role,
          followUpDate: job.followUpDate ?? '',
          status: job.status,
          overdue: (job.followUpDate ?? '') < todayISO,
        }))
        .sort((a, b) => a.followUpDate.localeCompare(b.followUpDate)),
    [jobs, todayISO],
  );
  const exportJson = useMemo(() => JSON.stringify(jobs, null, 2), [jobs]);
  const exportCsv = useMemo(() => toCsv(jobs), [jobs]);

  return {
    jobs,
    loading,
    refreshJobs,
    addJob,
    updateJob,
    updateReflection,
    addChecklistItem,
    toggleChecklistItem,
    removeChecklistItem,
    deleteJob,
    getJobById,
    weeklyGoal,
    setWeeklyGoal,
    clearWeeklyGoal,
    weeklyProgress,
    insights,
    deadlines,
    exportJson,
    exportCsv,
    importJobsFromJson,
    todayISO,
  };
}
