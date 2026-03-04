/**
 * AI 结构化输出：单条事项（PRD 6.1）
 */
export type TaskTypeSuggestion = 'task' | 'project' | 'goal';
export type EnergyTypeSuggestion = 'deep' | 'light';

export interface StructuredDraftItem {
  category_suggestion: string;
  type: TaskTypeSuggestion;
  title: string;
  sub_tasks?: string[];
  estimated_duration_minutes: number;
  urgency_level: number; // 1-5 or similar
  importance_level: number;
  energy_type: EnergyTypeSuggestion;
  suggested_time_window?: string;
  rationale?: string;
}

export type StructuredDraft = StructuredDraftItem[];
