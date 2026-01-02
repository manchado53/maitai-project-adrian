/**
 * API client for connecting to the FastAPI backend.
 * Replaces mock data with real API calls.
 */

const API_BASE = 'http://localhost:8000';

// ============ Types (matching backend schemas) ============

export interface Prompt {
  id: string;
  name: string;
  template: string;
  categories: string[];
  created_at: string;
  updated_at: string;
}

export interface PromptListResponse {
  prompts: Prompt[];
  total: number;
}

export interface CategoryStats {
  total: number;
  correct: number;
}

export interface RunMetrics {
  overall_accuracy: number;
  correct: number;
  total: number;
  category_stats: Record<string, CategoryStats>;
}

export interface FailedCase {
  test_id: number;
  ticket: string;
  expected: string;
  predicted: string | null;
}

export interface Run {
  id: string;
  prompt_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  completed_at: string | null;
  metrics: RunMetrics | null;
  confusion_matrix: Record<string, Record<string, number>> | null;
  failed_cases: FailedCase[] | null;
  error?: string | null;
}

export interface RunListResponse {
  runs: Run[];
  total: number;
}

export interface PromptSummary {
  id: string;
  name: string;
  latest_accuracy: number | null;
  run_count: number;
  best_accuracy: number | null;
}

export interface MetricsSummary {
  prompts: Record<string, PromptSummary>;
  best_prompt: string | null;
  total_runs: number;
  test_set_size: number;
}

export interface TestCase {
  id: number;
  ticket: string;
  expected: string;
  intent?: string | null;
}

export interface TestSetInfo {
  total: number;
  categories: string[];
  category_counts: Record<string, number>;
}

export interface TestSetDetail {
  total: number;
  categories: string[];
  cases: TestCase[];
}

export interface SuggestRequest {
  prompt_id: string;
  prompt_template: string;
  metrics: Record<string, unknown>;
  category_stats: Record<string, unknown>;
  confusion_matrix: Record<string, Record<string, number>>;
  failed_cases: Array<Record<string, unknown>>;
}

export interface SuggestResponse {
  analysis: string;
  suggestions: string[];
  priority_categories: string[];
}

// ============ API Functions ============

/** Fetch wrapper with error handling. */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ============ Prompts ============

/** Get all prompts. */
export async function getPrompts(): Promise<PromptListResponse> {
  return apiFetch<PromptListResponse>('/prompts');
}

/** Get a single prompt by ID. */
export async function getPrompt(id: string): Promise<Prompt> {
  return apiFetch<Prompt>(`/prompts/${id}`);
}

/** Create a new prompt. */
export async function createPrompt(data: {
  id: string;
  name: string;
  template: string;
}): Promise<Prompt> {
  return apiFetch<Prompt>('/prompts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Update an existing prompt. */
export async function updatePrompt(
  id: string,
  data: { name?: string; template?: string }
): Promise<Prompt> {
  return apiFetch<Prompt>(`/prompts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** Delete a prompt. */
export async function deletePrompt(id: string): Promise<void> {
  return apiFetch<void>(`/prompts/${id}`, {
    method: 'DELETE',
  });
}

// ============ Runs ============

/** Get all runs, optionally filtered by prompt ID. */
export async function getRuns(promptId?: string): Promise<RunListResponse> {
  const query = promptId ? `?prompt_id=${promptId}` : '';
  return apiFetch<RunListResponse>(`/runs${query}`);
}

/** Get a single run by ID. */
export async function getRun(id: string): Promise<Run> {
  return apiFetch<Run>(`/runs/${id}`);
}

/** Create a new test run for a prompt. */
export async function createRun(promptId: string): Promise<Run> {
  return apiFetch<Run>('/runs', {
    method: 'POST',
    body: JSON.stringify({ prompt_id: promptId }),
  });
}

// ============ Metrics ============

/** Get aggregated metrics summary. */
export async function getMetricsSummary(): Promise<MetricsSummary> {
  return apiFetch<MetricsSummary>('/metrics/summary');
}

// ============ Test Set ============

/** Get test set metadata. */
export async function getTestSet(): Promise<TestSetInfo> {
  return apiFetch<TestSetInfo>('/test-set');
}

/** Get test cases with optional filters. */
export async function getTestCases(filters?: {
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<TestSetDetail> {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.offset) params.set('offset', String(filters.offset));

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<TestSetDetail>(`/test-set/cases${query}`);
}

// ============ AI Suggestions ============

/** Get AI-powered suggestions for prompt improvement. */
export async function getSuggestions(data: SuggestRequest): Promise<SuggestResponse> {
  return apiFetch<SuggestResponse>('/suggest', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============ Utility Transforms ============

/** Transform backend Run to frontend-compatible format. */
export function transformRunForDisplay(run: Run) {
  const categoryBreakdown = run.metrics?.category_stats
    ? Object.entries(run.metrics.category_stats).map(([category, stats]) => ({
        category,
        accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
        total: stats.total,
      }))
    : [];

  return {
    id: run.id,
    promptId: run.prompt_id,
    accuracy: run.metrics?.overall_accuracy ? run.metrics.overall_accuracy * 100 : 0,
    status: run.status,
    date: run.created_at,
    categoryBreakdown,
    confusionMatrix: run.confusion_matrix || {},
    failedCases: run.failed_cases?.map((fc) => ({
      id: fc.test_id,
      ticket: fc.ticket,
      expected: fc.expected,
      predicted: fc.predicted || 'N/A',
    })) || [],
  };
}

/** Transform backend Prompt to frontend-compatible format with metrics. */
export function transformPromptForDisplay(
  prompt: Prompt,
  summary?: PromptSummary
) {
  return {
    id: prompt.id,
    name: prompt.name,
    template: prompt.template,
    createdAt: prompt.created_at.split('T')[0],
    runCount: summary?.run_count || 0,
    bestAccuracy: summary?.best_accuracy ? summary.best_accuracy * 100 : 0,
  };
}
