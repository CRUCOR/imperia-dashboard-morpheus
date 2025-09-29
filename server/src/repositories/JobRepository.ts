import { Job } from '@/models/Job'
import type { ProcessingJob } from '@/types'

export interface IJobRepository {
  create(job: Job): Promise<Job>
  findById(id: string): Promise<Job | null>
  findAll(): Promise<Job[]>
  update(id: string, job: Partial<ProcessingJob>): Promise<Job | null>
  delete(id: string): Promise<boolean>
}

export class InMemoryJobRepository implements IJobRepository {
  private jobs: Map<string, Job> = new Map()

  async create(job: Job): Promise<Job> {
    this.jobs.set(job.id, job)
    return job
  }

  async findById(id: string): Promise<Job | null> {
    return this.jobs.get(id) || null
  }

  async findAll(): Promise<Job[]> {
    return Array.from(this.jobs.values()).sort(
      (a, b) => b.startTime.getTime() - a.startTime.getTime()
    )
  }

  async update(id: string, updates: Partial<ProcessingJob>): Promise<Job | null> {
    const job = this.jobs.get(id)
    if (!job) return null

    Object.assign(job, updates)
    return job
  }

  async delete(id: string): Promise<boolean> {
    return this.jobs.delete(id)
  }

  async findByStatus(status: ProcessingJob['status']): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => job.status === status)
  }

  async clear(): Promise<void> {
    this.jobs.clear()
  }
}