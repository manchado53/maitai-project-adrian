import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { AccuracyBadge } from '../components/AccuracyBadge';
import { Plus, Edit } from 'lucide-react';
import { getPrompts, getMetricsSummary, type Prompt, type MetricsSummary } from '../lib/api';

interface PromptsPageProps {
  onNavigate: (page: string, id?: string) => void;
}

export function PromptsPage({ onNavigate }: PromptsPageProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [promptsRes, metricsRes] = await Promise.all([
          getPrompts(),
          getMetricsSummary(),
        ]);
        setPrompts(promptsRes.prompts);
        setMetrics(metricsRes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load prompts');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading prompts...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Prompts</h2>
        <Button onClick={() => onNavigate('prompt-editor', 'new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Prompt
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prompts.map(prompt => {
          const summary = metrics?.prompts[prompt.id];
          return (
            <Card key={prompt.id} className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{prompt.name}</h3>
                  <p className="text-sm text-muted-foreground">ID: {prompt.id}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(prompt.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Runs:</span>
                    <span>{summary?.run_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Best Accuracy:</span>
                    <AccuracyBadge accuracy={(summary?.best_accuracy || 0) * 100} />
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onNavigate('prompt-editor', prompt.id)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
