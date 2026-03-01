export type JobStatus =
  | 'Applied'
  | 'HR Interview'
  | 'Technical Interview'
  | 'Final Round'
  | 'Offer'
  | 'Rejected';

export type JobType = 'Internship' | 'Full-Time' | 'Contract' | 'Part-Time';

export type Location = 'Remote' | 'Onsite' | 'Hybrid' | string;

export interface JobHistoryEvent {
  id: string;
  type: 'created' | 'status_changed' | 'reflection_updated';
  timestamp: string;
  fromStatus?: JobStatus;
  toStatus?: JobStatus;
  note?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

export interface Job {
  id: string;
  companyName: string;
  role: string;
  jobType: JobType;
  location: Location;
  salaryOffered?: number;
  recruiterContact?: string;
  dateApplied: string;
  status: JobStatus;
  followUpDate?: string;
  notes?: string;
  resumeVersion?: string;
  reflection?: string;
  checklist?: ChecklistItem[];
  history?: JobHistoryEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface JobFormData {
  companyName: string;
  role: string;
  jobType: JobType;
  location: Location;
  salaryOffered?: number;
  recruiterContact?: string;
  dateApplied: string;
  status: JobStatus;
  followUpDate?: string;
  notes?: string;
  resumeVersion?: string;
  reflection?: string;
}

export const JOB_STATUSES: JobStatus[] = [
  'Applied',
  'HR Interview',
  'Technical Interview',
  'Final Round',
  'Offer',
  'Rejected',
];

export const JOB_TYPES: JobType[] = [
  'Internship',
  'Full-Time',
  'Contract',
  'Part-Time',
];

export const LOCATION_OPTIONS: string[] = ['Remote', 'Onsite', 'Hybrid'];
