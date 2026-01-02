import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AccuracyBadge } from './AccuracyBadge';
import { CategoryChart } from './CategoryChart';
import { ConfusionMatrix } from './ConfusionMatrix';
import { CirclePlay, Eye, Lightbulb } from 'lucide-react';

/** Run type that works with both mock and API data. */
interface DisplayRun {
  id: string;
  promptId: string;
  accuracy: number;
  status: string;
  date: string;
  categoryBreakdown: Array<{ category: string; accuracy: number; total: number }>;
  confusionMatrix: Record<string, Record<string, number>>;
  failedCases: Array<{ id: number; ticket: string; expected: string; predicted: string }>;
}

interface PromptCardProps {
  promptName: string;
  runs: DisplayRun[];
  onViewPrompt: () => void;
  onSuggestImprovements: () => void;
  onRunTest: () => void;
}

export function PromptCard({
  promptName,
  runs,
  onViewPrompt,
  onSuggestImprovements,
  onRunTest
}: PromptCardProps) {
  const [selectedRunId, setSelectedRunId] = useState(runs[0]?.id);
  
  const selectedRun = runs.find(r => r.id === selectedRunId) || runs[0];
  const overallAccuracy = runs.length > 0 
    ? runs.reduce((sum, r) => sum + r.accuracy, 0) / runs.length 
    : 0;

  if (!selectedRun) return null;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{promptName}</h3>
            <p className="text-sm text-muted-foreground">
              Overall Accuracy: <AccuracyBadge accuracy={overallAccuracy} />
            </p>
          </div>
          <Button onClick={onRunTest}>
            <CirclePlay className="mr-2 h-4 w-4" />
            Run Test
          </Button>
        </div>

        {/* Run Selector */}
        <div>
          <label className="text-sm font-medium mb-2 block">Select Run:</label>
          <Select value={selectedRunId} onValueChange={setSelectedRunId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {runs.map(run => (
                <SelectItem key={run.id} value={run.id}>
                  {new Date(run.date).toLocaleDateString()} - {run.accuracy.toFixed(1)}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Breakdown */}
        <CategoryChart data={selectedRun.categoryBreakdown} />

        {/* Confusion Matrix */}
        <ConfusionMatrix matrix={selectedRun.confusionMatrix} />

        {/* Failed Cases */}
        <div>
          <h4 className="font-semibold mb-3">Failed Cases</h4>
          <div className="space-y-2">
            {selectedRun.failedCases.slice(0, 5).map(fail => (
              <div key={fail.id} className="p-3 border rounded-lg text-sm">
                <span className="font-medium">#{fail.id}:</span> {fail.ticket}
                <div className="mt-1 text-muted-foreground">
                  Expected: <span className="text-green-600">{fail.expected}</span> → 
                  Got: <span className="text-red-600">{fail.predicted}</span>
                </div>
              </div>
            ))}
          </div>
          {selectedRun.failedCases.length > 5 && (
            <Button variant="link" className="mt-2">
              View All ({selectedRun.failedCases.length} total)
            </Button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onViewPrompt}>
            <Eye className="mr-2 h-4 w-4" />
            View Prompt
          </Button>
          <Button variant="outline" onClick={onSuggestImprovements}>
            <Lightbulb className="mr-2 h-4 w-4" />
            Suggest Improvements
          </Button>
        </div>
      </div>
    </Card>
  );
}