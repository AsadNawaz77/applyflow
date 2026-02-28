import AsyncStorage from '@react-native-async-storage/async-storage';
import { Job } from '../types';

const JOBS_STORAGE_KEY = '@applyflow_jobs';

export async function loadJobs(): Promise<Job[]> {
  try {
    const data = await AsyncStorage.getItem(JOBS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
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
