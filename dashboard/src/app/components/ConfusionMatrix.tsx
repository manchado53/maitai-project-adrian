import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface ConfusionMatrixProps {
  matrix: { [key: string]: { [key: string]: number } };
}

export function ConfusionMatrix({ matrix }: ConfusionMatrixProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const categories = Object.keys(matrix);

  const getColorIntensity = (value: number, max: number) => {
    const intensity = value / max;
    if (intensity > 0.8) return 'bg-green-500/80 text-white';
    if (intensity > 0.5) return 'bg-green-500/50';
    if (intensity > 0.2) return 'bg-yellow-500/30';
    if (value > 0) return 'bg-red-500/30';
    return '';
  };

  // Find max value for normalization
  const maxValue = Math.max(
    ...categories.flatMap(cat => Object.values(matrix[cat] || {}))
  );

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        onClick={() => setIsExpanded(true)}
        className="w-full"
      >
        <span>Show Confusion Matrix</span>
        <ChevronDown className="ml-2 h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Confusion Matrix</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Actual</TableHead>
              {categories.map(cat => (
                <TableHead key={cat} className="text-center text-xs">
                  {cat}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map(actualCat => (
              <TableRow key={actualCat}>
                <TableCell className="font-medium text-xs">{actualCat}</TableCell>
                {categories.map(predictedCat => {
                  const value = matrix[actualCat]?.[predictedCat] || 0;
                  return (
                    <TableCell
                      key={predictedCat}
                      className={`text-center ${getColorIntensity(value, maxValue)}`}
                    >
                      {value || ''}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
