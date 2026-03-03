export type UUID = string;

export interface UserPreference {
  id: UUID;
  userId: UUID;
  dailyCapacityHours: number | null;
  maxDeepTasksPerDay: number | null;
  preferredWorkWindow: string | null;
  taskTypeDurationMultipliers: Record<string, number> | null;
  reminderStyle: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BrainDump {
  id: UUID;
  userId: UUID;
  rawText: string;
  createdAt: string;
}

export type DraftStatus = 'draft' | 'scheduled' | 'archived';

export interface DraftPlan {
  id: UUID;
  userId: UUID;
  brainDumpId: UUID | null;
  structuredJson: unknown;
  status: DraftStatus;
  createdAt: string;
}

export type TaskType = 'task' | 'project' | 'goal';
export type EnergyType = 'deep' | 'light' | null;
export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'cancelled';

export interface Task {
  id: UUID;
  userId: UUID;
  draftPlanId: UUID | null;
  title: string;
  category: string | null;
  taskType: TaskType | null;
  energyType: EnergyType;
  estimatedDurationMinutes: number | null;
  actualDurationMinutes: number | null;
  dueDate: string | null;
  hardCommitment: boolean;
  priority: number | null;
  status: TaskStatus;
  dependencyIds: UUID[] | null;
  createdAt: string;
}

export type ScheduleBlockType = 'task' | 'buffer' | 'break';
export type ScheduleBlockStatus = 'planned' | 'in_progress' | 'done' | 'skipped';

export interface ScheduleBlock {
  id: UUID;
  userId: UUID;
  date: string; // ISO date (YYYY-MM-DD)
  taskId: UUID | null;
  durationMinutes: number;
  blockType: ScheduleBlockType;
  status: ScheduleBlockStatus;
  createdAt: string;
}

export type ReportType = 'weekly' | 'monthly';

export interface Report {
  id: UUID;
  userId: UUID;
  type: ReportType;
  periodStart: string;
  periodEnd: string;
  metricsJson: unknown;
  narrativeText: string | null;
  createdAt: string;
}

