import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChecklistItem, Job, JobHistoryEvent, JobStatus } from '../types';

const JOBS_STORAGE_KEY = '@applyflow_jobs';
const WEEKLY_GOAL_STORAGE_KEY = '@applyflow_weekly_goal';

export interface WeeklyGoalState {
  target: number;
  weekStart: string;
}

function normalizeDate(value: unknown, fallback: string): string {
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
    return value;
  }
  return fallback;
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeHistory(value: unknown): JobHistoryEvent[] {
  if (!Array.isArray(value)) return [];
  const normalized: JobHistoryEvent[] = [];
  value.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const event = item as Partial<JobHistoryEvent> & Record<string, unknown>;
    if (!event.id || !event.type || !event.timestamp) return;
    if (!['created', 'status_changed', 'reflection_updated'].includes(String(event.type))) {
      return;
    }
    const normalizedEvent: JobHistoryEvent = {
      id: String(event.id),
      type: event.type as JobHistoryEvent['type'],
      timestamp: normalizeDate(event.timestamp, new Date().toISOString()),
    };
    const fromStatus = normalizeOptionalString(event.fromStatus);
    const toStatus = normalizeOptionalString(event.toStatus);
    const note = normalizeOptionalString(event.note);
    if (fromStatus) normalizedEvent.fromStatus = fromStatus as JobStatus;
    if (toStatus) normalizedEvent.toStatus = toStatus as JobStatus;
    if (note) normalizedEvent.note = note;
    normalized.push(normalizedEvent);
  });
  return normalized;
}

function normalizeChecklist(value: unknown): ChecklistItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const entry = item as Partial<ChecklistItem> & Record<string, unknown>;
      if (!entry.id || !entry.text) return null;
      return {
        id: String(entry.id),
        text: String(entry.text),
        done: Boolean(entry.done),
        createdAt: normalizeDate(entry.createdAt, new Date().toISOString()),
      };
    })
    .filter((entry): entry is ChecklistItem => entry !== null);
}

function migrateJob(raw: unknown): Job | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Partial<Job> & Record<string, unknown>;
  if (!item.id || !item.companyName || !item.role || !item.jobType || !item.location) {
    return null;
  }
  if (!item.dateApplied || !item.status) {
    return null;
  }

  const now = new Date().toISOString();
  const createdAt = normalizeDate(item.createdAt, now);
  const updatedAt = normalizeDate(item.updatedAt, createdAt);

  return {
    id: String(item.id),
    companyName: String(item.companyName),
    role: String(item.role),
    jobType: item.jobType as Job['jobType'],
    location: String(item.location),
    salaryOffered: typeof item.salaryOffered === 'number' ? item.salaryOffered : undefined,
    recruiterContact: normalizeOptionalString(item.recruiterContact),
    dateApplied: String(item.dateApplied),
    status: item.status as Job['status'],
    followUpDate: normalizeOptionalString(item.followUpDate),
    notes: normalizeOptionalString(item.notes),
    resumeVersion: normalizeOptionalString(item.resumeVersion),
    reflection: normalizeOptionalString(item.reflection),
    stageDateTime: normalizeOptionalString(item.stageDateTime),
    stageReminderDayBeforeId: normalizeOptionalString(item.stageReminderDayBeforeId),
    stageReminderOneHourId: normalizeOptionalString(item.stageReminderOneHourId),
    followUpReminderId: normalizeOptionalString(item.followUpReminderId),
    checklist: normalizeChecklist(item.checklist),
    history: normalizeHistory(item.history),
    createdAt,
    updatedAt,
  };
}

export async function loadJobs(): Promise<Job[]> {
  try {
    const data = await AsyncStorage.getItem(JOBS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      const migrated = parsed
        .map((item) => migrateJob(item))
        .filter((item): item is Job => item !== null);
      await saveJobs(migrated);
      return migrated;
    }
    return [];
  } catch (error) {
    console.error('Failed to load jobs:', error);
    return [];
  }
}

export async function saveJobs(jobs: Job[]): Promise<void> {
  try {
    await AsyncStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
  } catch (error) {
    console.error('Failed to save jobs:', error);
    throw error;
  }
}

export async function loadWeeklyGoal(): Promise<WeeklyGoalState | null> {
  try {
    const data = await AsyncStorage.getItem(WEEKLY_GOAL_STORAGE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data) as Partial<WeeklyGoalState> | null;
    if (!parsed) return null;
    if (typeof parsed.target !== 'number' || parsed.target <= 0) return null;
    if (typeof parsed.weekStart !== 'string') return null;
    return { target: parsed.target, weekStart: parsed.weekStart };
  } catch (error) {
    console.error('Failed to load weekly goal:', error);
    return null;
  }
}

export async function saveWeeklyGoal(goal: WeeklyGoalState | null): Promise<void> {
  try {
    if (!goal) {
      await AsyncStorage.removeItem(WEEKLY_GOAL_STORAGE_KEY);
      return;
    }
    await AsyncStorage.setItem(WEEKLY_GOAL_STORAGE_KEY, JSON.stringify(goal));
  } catch (error) {
    console.error('Failed to save weekly goal:', error);
    throw error;
  }
}
