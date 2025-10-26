// Quick test to verify the file-based job store is working
const { pdfJobStore } = require('./src/lib/pdfJobStore.ts');

console.log('Testing job store...');

// Test creating a job
const testJob = pdfJobStore.createJob('test-123', 5);
console.log('Created job:', testJob.id, testJob.status);

// Test reading the job
const readJob = pdfJobStore.getJob('test-123');
console.log('Read job:', readJob ? readJob.id : 'not found');

// Test updating progress
pdfJobStore.updateProgress('test-123', 2, 1, 1);
const updatedJob = pdfJobStore.getJob('test-123');
console.log('Updated job progress:', updatedJob.progress);

console.log('Job store test completed');