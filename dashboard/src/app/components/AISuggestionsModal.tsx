import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { CircleAlert, TriangleAlert } from 'lucide-react';

interface Suggestion {
  priority: 'high' | 'medium' | 'low';
  text: string;
}

interface AISuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptName: string;
  analysis: string;
  suggestions: Suggestion[];
}

export function AISuggestionsModal({
  isOpen,
  onClose,
  promptName,
  analysis,
  suggestions
}: AISuggestionsModalProps) {
  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') return <CircleAlert className="h-5 w-5 text-red-500" />;
    if (priority === 'medium') return <TriangleAlert className="h-5 w-5 text-yellow-500" />;
    return <TriangleAlert className="h-5 w-5 text-blue-500" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Suggestions for {promptName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2">Analysis</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{analysis}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Suggestions</h4>
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="flex gap-3 p-4 border rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {getPriorityIcon(suggestion.priority)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">
                        {suggestion.priority} priority
                      </span>
                    </div>
                    <p className="text-sm">{suggestion.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}