import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { AccuracyBadge } from '../components/AccuracyBadge';
import { CategoryChart } from '../components/CategoryChart';
import { ConfusionMatrix } from '../components/ConfusionMatrix';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { getRun, getPrompt, type Run, type Prompt } from '../lib/api';

interface RunDetailsProps {
  runId: string;
  onNavigate: (page: string) => void;
}

export function RunDetails({ runId, onNavigate }: RunDetailsProps) {
  const [run, setRun] = useState<Run | null>(null);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const runData = await getRun(runId);
      setRun(runData);
      const promptData = await getPrompt(runData.prompt_id);
      setPrompt(promptData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load run');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [runId]);

  // Auto-refresh while running
  useEffect(() => {
    if (run?.status === 'running' || run?.status === 'pending') {
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [run?.status, runId]);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading run details...</div>;
  }

  if (error || !run) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{error || 'Run not found'}</p>
        <Button onClick={() => onNavigate('runs')} className="mt-4">
          Back to Runs
        </Button>
      </div>
    );
  }

  const accuracy = run.metrics?.overall_accuracy ? run.metrics.overall_accuracy * 100 : 0;
  const categoryBreakdown = run.metrics?.category_stats
    ? Object.entries(run.metrics.category_stats).map(([category, stats]) => ({
        category,
        accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
        total: stats.total,
      }))
    : [];

  const failedCases = run.failed_cases?.map(fc => ({
    id: fc.test_id,
    ticket: fc.ticket,
    expected: fc.expected,
    predicted: fc.predicted || 'N/A',
  })) || [];

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: string } = {
      'completed': 'bg-green-500 hover:bg-green-600 text-white',
      'running': 'bg-blue-500 hover:bg-blue-600 text-white',
      'pending': 'bg-yellow-500 hover:bg-yellow-600 text-white',
      'failed': 'bg-red-500 hover:bg-red-600 text-white'
    };
    return (
      <Badge className={variants[status] || 'bg-gray-500'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => onNavigate('runs')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold">Run Details</h2>
          <p className="text-sm text-muted-foreground">
            {run.id} - {prompt?.name || run.prompt_id}
          </p>
        </div>
        {(run.status === 'running' || run.status === 'pending') && (
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Refreshing...
          </Button>
        )}
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {/* Run Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-semibold">{new Date(run.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overall Accuracy</p>
              <div className="mt-1">
                {run.status === 'completed' ? (
                  <AccuracyBadge accuracy={accuracy} size="lg" />
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="mt-1">{getStatusBadge(run.status)}</div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Prompt</p>
              <p className="font-semibold">{prompt?.name || run.prompt_id}</p>
            </div>
          </div>

          {run.status === 'running' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">
                Test run in progress... This may take a few minutes. The page will refresh automatically.
              </p>
            </div>
          )}

          {run.status === 'failed' && run.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">Error: {run.error}</p>
            </div>
          )}

          {run.status === 'completed' && (
            <>
              {/* Category Breakdown */}
              <div className="pt-6 border-t">
                <CategoryChart data={categoryBreakdown} />
              </div>

              {/* Confusion Matrix */}
              {run.confusion_matrix && Object.keys(run.confusion_matrix).length > 0 && (
                <div className="pt-6 border-t">
                  <ConfusionMatrix matrix={run.confusion_matrix} />
                </div>
              )}

              {/* Failed Cases */}
              {failedCases.length > 0 && (
                <div className="pt-6 border-t">
                  <h4 className="font-semibold mb-4">Failed Cases ({failedCases.length})</h4>
                  <div className="space-y-3">
                    {failedCases.map(fail => (
                      <div key={fail.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-mono text-sm font-medium">Case #{fail.id}</span>
                          <div className="flex gap-2">
                            <span className="text-sm">
                              Expected: <span className="text-green-600 font-medium">{fail.expected}</span>
                            </span>
                            <span className="text-sm">
                              Got: <span className="text-red-600 font-medium">{fail.predicted}</span>
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{fail.ticket}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
