import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { AccuracyBadge } from '../components/AccuracyBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Plus } from 'lucide-react';
import { getRuns, getPrompts, createRun, type Run, type Prompt } from '../lib/api';

interface RunsPageProps {
  onNavigate: (page: string, id?: string) => void;
}

export function RunsPage({ onNavigate }: RunsPageProps) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterPrompt, setFilterPrompt] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isNewRunModalOpen, setIsNewRunModalOpen] = useState(false);
  const [selectedPromptForRun, setSelectedPromptForRun] = useState('');
  const [startingRun, setStartingRun] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [runsRes, promptsRes] = await Promise.all([
          getRuns(),
          getPrompts(),
        ]);
        setRuns(runsRes.runs);
        setPrompts(promptsRes.prompts);
        if (promptsRes.prompts.length > 0) {
          setSelectedPromptForRun(promptsRes.prompts[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredRuns = runs.filter(run => {
    if (filterPrompt !== 'all' && run.prompt_id !== filterPrompt) return false;
    if (filterStatus !== 'all' && run.status !== filterStatus) return false;
    return true;
  });

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

  const handleStartRun = async () => {
    try {
      setStartingRun(true);
      const newRun = await createRun(selectedPromptForRun);
      setIsNewRunModalOpen(false);
      onNavigate('run-details', newRun.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start run');
    } finally {
      setStartingRun(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading runs...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Run History</h2>
        <Button onClick={() => setIsNewRunModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Run
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="w-64">
          <Select value={filterPrompt} onValueChange={setFilterPrompt}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by prompt" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prompts</SelectItem>
              {prompts.map(prompt => (
                <SelectItem key={prompt.id} value={prompt.id}>
                  {prompt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-48">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Runs Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Run ID</TableHead>
              <TableHead>Prompt</TableHead>
              <TableHead>Accuracy</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRuns.map(run => {
              const prompt = prompts.find(p => p.id === run.prompt_id);
              const accuracy = run.metrics?.overall_accuracy
                ? run.metrics.overall_accuracy * 100
                : 0;
              return (
                <TableRow
                  key={run.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onNavigate('run-details', run.id)}
                >
                  <TableCell className="font-mono text-sm">{run.id}</TableCell>
                  <TableCell>{prompt?.name || run.prompt_id}</TableCell>
                  <TableCell>
                    {run.status === 'completed' ? (
                      <AccuracyBadge accuracy={accuracy} />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(run.status)}</TableCell>
                  <TableCell>
                    {new Date(run.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredRuns.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No runs found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* New Run Modal */}
      <Dialog open={isNewRunModalOpen} onOpenChange={setIsNewRunModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Test Run</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Prompt</label>
              <Select value={selectedPromptForRun} onValueChange={setSelectedPromptForRun}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {prompts.map(prompt => (
                    <SelectItem key={prompt.id} value={prompt.id}>
                      {prompt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setIsNewRunModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleStartRun} disabled={startingRun || !selectedPromptForRun}>
                {startingRun ? 'Starting...' : 'Start'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
