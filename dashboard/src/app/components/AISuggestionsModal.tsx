import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { CircleAlert, TriangleAlert, Copy, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';

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
  enhancedPrompt?: string;
}

export function AISuggestionsModal({
  isOpen,
  onClose,
  promptName,
  suggestions,
  enhancedPrompt
}: AISuggestionsModalProps) {
  const [copied, setCopied] = useState(false);

  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') return <CircleAlert className="h-5 w-5 text-red-500" />;
    if (priority === 'medium') return <TriangleAlert className="h-5 w-5 text-yellow-500" />;
    return <TriangleAlert className="h-5 w-5 text-blue-500" />;
  };

  const handleCopy = async () => {
    if (enhancedPrompt) {
      await navigator.clipboard.writeText(enhancedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Suggestions for {promptName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Suggestions Section */}
          <div>
            <h4 className="font-semibold mb-3">Improvement Suggestions</h4>
            {suggestions.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
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
            )}
          </div>

          {/* Enhanced Prompt Section */}
          {enhancedPrompt && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Enhanced Prompt</h4>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                {enhancedPrompt}
              </pre>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
