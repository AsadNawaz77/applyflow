import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Job, JobFormData } from '../types';
import { loadJobs, saveJobs } from '../storage/jobStorage';

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshJobs = useCallback(async () => {
    setLoading(true);
    const loaded = await loadJobs();
    setJobs(loaded);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshJobs();
  }, [refreshJobs]);

  const addJob = useCallback(
    async (formData: JobFormData) => {
      const now = new Date().toISOString();
      const newJob: Job = {
        id: uuidv4(),
        ...formData,
        createdAt: now,
      };
      const updated = [...jobs, newJob];
      setJobs(updated);
      await saveJobs(updated);
      return newJob.id;
    },
    [jobs]
  );

  const updateJob = useCallback(
    async (id: string, formData: JobFormData) => {
      const job = jobs.find((j) => j.id === id);
      if (!job) return;
      const updatedJob: Job = {
        ...job,
        ...formData,
      };
      const updated = jobs.map((j) => (j.id === id ? updatedJob : j));
      setJobs(updated);
      await saveJobs(updated);
    },
    [jobs]
  );

  const deleteJob = useCallback(
    async (id: string) => {
      const updated = jobs.filter((j) => j.id !== id);
      setJobs(updated);
      await saveJobs(updated);
    },
    [jobs]
  );

  const getJobById = useCallback(
    (id: string) => jobs.find((j) => j.id === id),
    [jobs]
  );

  return {
    jobs,
    loading,
    refreshJobs,
    addJob,
    updateJob,
    deleteJob,
    getJobById,
  };
}
