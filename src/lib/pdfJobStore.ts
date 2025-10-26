// Simple file-based job store for PDF generation jobs
// In production, this should be replaced with Redis or a database

import fs from 'fs';
import path from 'path';

const JOBS_DIR = path.join(process.cwd(), '.next', 'pdf-jobs');

// Ensure jobs directory exists
if (!fs.existsSync(JOBS_DIR)) {
  fs.mkdirSync(JOBS_DIR, { recursive: true });
}

interface PDFJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: {
    current: number;
    total: number;
    successCount: number;
    failureCount: number;
  };
  result?: {
    buffer: Buffer;
    filename: string;
  };
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

class PDFJobStore {
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up old jobs every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldJobs();
    }, 60 * 60 * 1000);
  }

  private getJobFilePath(id: string): string {
    return path.join(JOBS_DIR, `${id}.json`);
  }

  private readJob(id: string): PDFJob | null {
    try {
      const filePath = this.getJobFilePath(id);
      if (!fs.existsSync(filePath)) {
        return null;
      }
      const data = fs.readFileSync(filePath, 'utf8');
      const job = JSON.parse(data);
      // Convert date strings back to Date objects
      job.createdAt = new Date(job.createdAt);
      if (job.completedAt) {
        job.completedAt = new Date(job.completedAt);
      }
      // Convert buffer data back to Buffer if it exists
      if (job.result && job.result.buffer && job.result.buffer.data) {
        job.result.buffer = Buffer.from(job.result.buffer.data);
      }
      return job;
    } catch (error) {
      console.error(`Error reading job ${id}:`, error);
      return null;
    }
  }

  private writeJob(job: PDFJob): void {
    try {
      const filePath = this.getJobFilePath(job.id);
      fs.writeFileSync(filePath, JSON.stringify(job, null, 2));
    } catch (error) {
      console.error(`Error writing job ${job.id}:`, error);
    }
  }

  createJob(id: string, total: number): PDFJob {
    const job: PDFJob = {
      id,
      status: 'pending',
      progress: {
        current: 0,
        total,
        successCount: 0,
        failureCount: 0,
      },
      createdAt: new Date(),
    };
    this.writeJob(job);
    return job;
  }

  getJob(id: string): PDFJob | undefined {
    const job = this.readJob(id);
    return job || undefined;
  }

  getAllJobs(): Record<string, PDFJob> {
    try {
      const files = fs.readdirSync(JOBS_DIR);
      const jobs: Record<string, PDFJob> = {};
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const id = file.replace('.json', '');
          const job = this.readJob(id);
          if (job) {
            jobs[id] = job;
          }
        }
      }
      
      return jobs;
    } catch (error) {
      console.error('Error reading all jobs:', error);
      return {};
    }
  }

  updateJob(id: string, updates: Partial<PDFJob>): void {
    const job = this.readJob(id);
    if (job) {
      Object.assign(job, updates);
      this.writeJob(job);
    }
  }

  updateProgress(id: string, current: number, successCount: number, failureCount: number): void {
    const job = this.readJob(id);
    if (job) {
      job.progress.current = current;
      job.progress.successCount = successCount;
      job.progress.failureCount = failureCount;
      if (current >= job.progress.total) {
        job.status = 'completed';
        job.completedAt = new Date();
      }
      this.writeJob(job);
    }
  }

  setResult(id: string, buffer: Buffer, filename: string): void {
    const job = this.readJob(id);
    if (job) {
      job.result = { buffer, filename };
      job.status = 'completed';
      job.completedAt = new Date();
      this.writeJob(job);
    }
  }

  setError(id: string, error: string): void {
    const job = this.readJob(id);
    if (job) {
      job.error = error;
      job.status = 'failed';
      job.completedAt = new Date();
      this.writeJob(job);
    }
  }

  private cleanupOldJobs(): void {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const files = fs.readdirSync(JOBS_DIR);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const id = file.replace('.json', '');
          const job = this.readJob(id);
          if (job && job.completedAt && job.completedAt < oneHourAgo) {
            fs.unlinkSync(this.getJobFilePath(id));
          }
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Global singleton instance
export const pdfJobStore = new PDFJobStore();