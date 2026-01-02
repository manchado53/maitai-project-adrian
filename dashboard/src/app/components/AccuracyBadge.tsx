import { Badge } from "./ui/badge";

interface AccuracyBadgeProps {
  accuracy: number;
  size?: 'sm' | 'default' | 'lg';
}

export function AccuracyBadge({ accuracy, size = 'default' }: AccuracyBadgeProps) {
  const getColor = (acc: number) => {
    if (acc >= 90) return 'bg-green-500 hover:bg-green-600 text-white';
    if (acc >= 70) return 'bg-yellow-500 hover:bg-yellow-600 text-white';
    return 'bg-red-500 hover:bg-red-600 text-white';
  };

  return (
    <Badge className={getColor(accuracy)}>
      {accuracy.toFixed(1)}%
    </Badge>
  );
}
