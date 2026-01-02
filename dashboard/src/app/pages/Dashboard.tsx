import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MetricCard } from '../components/MetricCard';
import { PromptCard } from '../components/PromptCard';
import { AISuggestionsModal } from '../components/AISuggestionsModal';
import { Card } from '../components/ui/card';
import {
  getPrompts,
  getRuns,
  getMetricsSummary,
  getSuggestions,
  transformRunForDisplay,
  type Prompt,
  type Run,
  type MetricsSummary,
} from '../lib/api';

interface DashboardProps {
  onNavigate: (page: string, id?: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [selectedPromptForSuggestions, setSelectedPromptForSuggestions] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ priority: 'high' | 'medium' | 'low'; text: string }>>([]);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string>('');
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [promptsRes, runsRes, metricsRes] = await Promise.all([
          getPrompts(),
          getRuns(),
          getMetricsSummary(),
        ]);
        setPrompts(promptsRes.prompts);
        setRuns(runsRes.runs);
        setMetrics(metricsRes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Fetch AI suggestions when a prompt is selected
  useEffect(() => {
    async function fetchSuggestions() {
      if (!selectedPromptForSuggestions) return;

      const prompt = prompts.find(p => p.id === selectedPromptForSuggestions);
      const promptRuns = runs.filter(r => r.prompt_id === selectedPromptForSuggestions && r.status === 'completed');
      const latestRun = promptRuns[0];

      if (!prompt || !latestRun?.metrics) {
        setAiAnalysis('No completed runs available for analysis.');
        setAiSuggestions([]);
        return;
      }

      try {
        setLoadingSuggestions(true);
        const response = await getSuggestions({
          prompt_id: prompt.id,
          prompt_template: prompt.template,
          metrics: {
            overall_accuracy: latestRun.metrics.overall_accuracy,
            correct: latestRun.metrics.correct,
            total: latestRun.metrics.total,
          },
          category_stats: latestRun.metrics.category_stats,
          confusion_matrix: latestRun.confusion_matrix || {},
          failed_cases: latestRun.failed_cases?.map(fc => ({
            test_id: fc.test_id,
            ticket: fc.ticket,
            expected: fc.expected,
            predicted: fc.predicted,
          })) || [],
        });
        setAiAnalysis(response.analysis);
        setAiSuggestions(response.suggestions.map((s, i) => ({
          priority: (i === 0 ? 'high' : i < 3 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
          text: s,
        })));
        setEnhancedPrompt(response.enhanced_prompt);
      } catch (err) {
        setAiAnalysis('Failed to get AI suggestions. Please try again.');
        setAiSuggestions([]);
        setEnhancedPrompt('');
      } finally {
        setLoadingSuggestions(false);
      }
    }
    fetchSuggestions();
  }, [selectedPromptForSuggestions, prompts, runs]);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  // Get best run for each prompt using metrics summary
  const promptMetrics = prompts.map(prompt => {
    const summary = metrics?.prompts[prompt.id];
    return {
      name: prompt.name,
      accuracy: (summary?.best_accuracy || 0) * 100,
      runCount: summary?.run_count || 0
    };
  });

  // Chart data
  const chartData = prompts.map(prompt => {
    const summary = metrics?.prompts[prompt.id];
    return {
      name: prompt.name.split(' ').slice(0, 2).join(' '),
      accuracy: (summary?.best_accuracy || 0) * 100
    };
  });

  const bestPromptId = metrics?.best_prompt;
  const bestPrompt = prompts.find(p => p.id === bestPromptId) || prompts[0];
  const bestAccuracy = bestPrompt ? (metrics?.prompts[bestPrompt.id]?.best_accuracy || 0) * 100 : 0;

  const totalRuns = metrics?.total_runs || 0;
  const totalTestCases = metrics?.test_set_size || 198;

  const selectedPrompt = prompts.find(p => p.id === selectedPromptForSuggestions);

  return (
    <div className="space-y-8">
      {/* Overview Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Overview</h2>
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {promptMetrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>

        {/* Comparison Chart */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Prompt Accuracy Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(1)}%`}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Bar dataKey="accuracy" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Best Prompt</p>
            <p className="text-xl font-semibold">{bestPrompt.name}</p>
            <p className="text-sm text-green-600">{bestAccuracy.toFixed(1)}% accuracy</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Test Cases</p>
            <p className="text-xl font-semibold">{totalTestCases}</p>
            <p className="text-sm text-muted-foreground">Across 11 categories</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Runs</p>
            <p className="text-xl font-semibold">{totalRuns}</p>
            <p className="text-sm text-muted-foreground">All prompts combined</p>
          </Card>
        </div>
      </div>

      {/* Prompt Cards */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Prompt Performance</h2>
        <div className="space-y-6">
          {prompts.map(prompt => {
            const promptRuns = runs
              .filter(r => r.prompt_id === prompt.id && r.status === 'completed')
              .map(transformRunForDisplay);
            return (
              <PromptCard
                key={prompt.id}
                promptName={prompt.name}
                runs={promptRuns}
                onViewPrompt={() => onNavigate('prompt-editor', prompt.id)}
                onSuggestImprovements={() => setSelectedPromptForSuggestions(prompt.id)}
                onRunTest={() => onNavigate('runs')}
              />
            );
          })}
        </div>
      </div>

      {/* AI Suggestions Modal */}
      {selectedPrompt && (
        <AISuggestionsModal
          isOpen={!!selectedPromptForSuggestions}
          onClose={() => setSelectedPromptForSuggestions(null)}
          promptName={selectedPrompt.name}
          analysis={aiAnalysis}
          suggestions={loadingSuggestions ? [] : aiSuggestions}
          enhancedPrompt={loadingSuggestions ? undefined : enhancedPrompt}
        />
      )}
    </div>
  );
}
