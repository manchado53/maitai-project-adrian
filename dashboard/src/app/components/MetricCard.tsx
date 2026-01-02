import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { AccuracyBadge } from "./AccuracyBadge";

interface MetricCardProps {
  name: string;
  accuracy: number;
  runCount: number;
}

export function MetricCard({ name, accuracy, runCount }: MetricCardProps) {
  return (
    <Card className="p-6">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{name}</h3>
            <p className="text-sm text-muted-foreground">{runCount} runs</p>
          </div>
          <AccuracyBadge accuracy={accuracy} />
        </div>
        <Progress value={accuracy} className="h-2" />
      </div>
    </Card>
  );
}
