import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CategoryAccuracy } from '../data/mockData';
import { TriangleAlert } from 'lucide-react';

interface CategoryChartProps {
  data: CategoryAccuracy[];
}

export function CategoryChart({ data }: CategoryChartProps) {
  const getBarColor = (accuracy: number) => {
    if (accuracy >= 90) return '#22c55e'; // green
    if (accuracy >= 70) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  const sortedData = [...data].sort((a, b) => a.accuracy - b.accuracy);

  return (
    <div className="space-y-4">
      <h4 className="font-semibold">Category Performance</h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sortedData} layout="vertical" margin={{ left: 80, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 100]} />
          <YAxis type="category" dataKey="category" width={80} />
          <Tooltip 
            formatter={(value: number) => `${value.toFixed(1)}%`}
            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
          />
          <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.accuracy)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="space-y-2">
        <p className="text-sm font-medium">Categories Below 80%:</p>
        {data.filter(d => d.accuracy < 80).map(d => (
          <div key={d.category} className="flex items-center gap-2 text-sm">
            <TriangleAlert className="h-4 w-4 text-yellow-500" />
            <span>{d.category}: {d.accuracy.toFixed(1)}%</span>
            <span className="text-muted-foreground">({d.total} cases)</span>
          </div>
        ))}
      </div>
    </div>
  );
}