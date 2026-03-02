import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Job, JobStatus } from '../types';

const INTERVIEW_STATUSES: JobStatus[] = ['HR Interview', 'Technical Interview', 'Final Round'];
const MISSED_TRIGGER_GRACE_MS = 5 * 60 * 1000;
const GRACE_FALLBACK_DELAY_MS = 15 * 1000;

Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
      // Android foreground compatibility.
      shouldShowAlert: true,
    }) as never,
});

function isInterviewStatus(status: JobStatus) {
  return INTERVIEW_STATUSES.includes(status);
}

function formatInterviewLabel(status: JobStatus) {
  if (status === 'HR Interview') return 'HR interview';
  if (status === 'Technical Interview') return 'technical interview';
  if (status === 'Final Round') return 'final-round interview';
  return 'interview';
}

export function extractTimeValue(date: Date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function extractLocalDateValue(date: Date) {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function isValidTimeHHMM(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

function parseISODateAsLocal(dateISO: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIndex, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function combineDateAndTime(dateISO: string, timeHHMM: string): string | null {
  if (!dateISO || !isValidTimeHHMM(timeHHMM)) return null;
  const [hh, mm] = timeHHMM.split(':').map(Number);
  const date = parseISODateAsLocal(dateISO);
  if (!date) return null;
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(hh, mm, 0, 0);
  return date.toISOString();
}

export async function requestNotificationsPermissionIfNeeded(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

async function scheduleNotificationAt(
  date: Date,
  title: string,
  body: string,
  data: Record<string, string>,
) {
  const now = Date.now();
  let triggerDate = date;
  const delta = date.getTime() - now;

  // If scheduling happens a bit late (seconds/minutes drift), still deliver soon.
  if (delta <= 0) {
    const missedBy = Math.abs(delta);
    if (missedBy > MISSED_TRIGGER_GRACE_MS) return undefined;
    triggerDate = new Date(now + GRACE_FALLBACK_DELAY_MS);
  }

  return Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

export async function cancelNotificationById(id?: string) {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Ignore stale/missing ids.
  }
}

export async function cancelJobNotifications(job: Job) {
  await Promise.all([
    cancelNotificationById(job.stageReminderDayBeforeId),
    cancelNotificationById(job.stageReminderOneHourId),
    cancelNotificationById(job.followUpReminderId),
  ]);
}

export async function scheduleStageReminders(job: Job) {
  if (!job.stageDateTime || !isInterviewStatus(job.status)) {
    return { dayBeforeId: undefined, oneHourId: undefined };
  }

  const ok = await requestNotificationsPermissionIfNeeded();
  if (!ok) return { dayBeforeId: undefined, oneHourId: undefined };

  const stageAt = new Date(job.stageDateTime);
  if (Number.isNaN(stageAt.getTime())) return { dayBeforeId: undefined, oneHourId: undefined };
  const label = formatInterviewLabel(job.status);
  const time = extractTimeValue(stageAt);

  const oneDayBefore = new Date(stageAt.getTime() - 24 * 60 * 60 * 1000);
  const oneHourBefore = new Date(stageAt.getTime() - 60 * 60 * 1000);

  const commonData = {
    jobId: job.id,
    companyName: job.companyName,
    role: job.role,
    status: job.status,
  };

  const dayBeforeId = await scheduleNotificationAt(
    oneDayBefore,
    `${job.companyName} interview reminder`,
    `Get ready. You have a ${label} tomorrow at ${time} for ${job.role}.`,
    commonData,
  );

  const oneHourId = await scheduleNotificationAt(
    oneHourBefore,
    `${job.companyName} starts in 1 hour`,
    `Your ${label} for ${job.role} starts in one hour. Be prepared.`,
    commonData,
  );

  return { dayBeforeId, oneHourId };
}

export async function scheduleFollowUpReminder(job: Job) {
  if (!job.followUpDate || job.status === 'Offer' || job.status === 'Rejected') {
    return undefined;
  }

  const ok = await requestNotificationsPermissionIfNeeded();
  if (!ok) return undefined;

  const followUp = parseISODateAsLocal(job.followUpDate);
  if (!followUp) return undefined;
  followUp.setHours(9, 0, 0, 0);

  return scheduleNotificationAt(
    followUp,
    `Follow up today: ${job.companyName}`,
    `You planned a follow-up today for ${job.role} at ${job.companyName}.`,
    {
      jobId: job.id,
      companyName: job.companyName,
      role: job.role,
      status: job.status,
    },
  );
}
