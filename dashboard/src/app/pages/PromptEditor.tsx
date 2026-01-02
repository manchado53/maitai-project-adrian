import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card } from '../components/ui/card';
import { CirclePlay, Save, X } from 'lucide-react';
import { getPrompt, createPrompt, updatePrompt, createRun } from '../lib/api';

interface PromptEditorProps {
  promptId?: string;
  onNavigate: (page: string, id?: string) => void;
}

export function PromptEditor({ promptId, onNavigate }: PromptEditorProps) {
  const isNewPrompt = promptId === 'new';

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [template, setTemplate] = useState('');
  const [loading, setLoading] = useState(!isNewPrompt);
  const [saving, setSaving] = useState(false);
  const [runningTest, setRunningTest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isNewPrompt && promptId) {
      async function fetchPrompt() {
        try {
          setLoading(true);
          const prompt = await getPrompt(promptId);
          setId(prompt.id);
          setName(prompt.name);
          setTemplate(prompt.template);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load prompt');
        } finally {
          setLoading(false);
        }
      }
      fetchPrompt();
    }
  }, [promptId, isNewPrompt]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      if (isNewPrompt) {
        await createPrompt({ id, name, template });
      } else {
        await updatePrompt(id, { name, template });
      }
      onNavigate('prompts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prompt');
    } finally {
      setSaving(false);
    }
  };

  const handleRunTest = async () => {
    try {
      setRunningTest(true);
      setError(null);
      // Save first if new
      if (isNewPrompt && id && name && template) {
        await createPrompt({ id, name, template });
      } else if (!isNewPrompt) {
        await updatePrompt(id, { name, template });
      }
      // Start run
      const run = await createRun(id);
      onNavigate('run-details', run.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start test run');
    } finally {
      setRunningTest(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading prompt...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          {isNewPrompt ? 'Create New Prompt' : 'Edit Prompt'}
        </h2>
        <Button variant="ghost" onClick={() => onNavigate('prompts')}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>

      {error && (
        <div className="text-red-500 p-4 border border-red-200 rounded bg-red-50">
          {error}
        </div>
      )}

      <Card className="p-6">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="space-y-2">
            <Label htmlFor="id">Prompt ID</Label>
            <Input
              id="id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="e.g., prompt-v4"
              disabled={!isNewPrompt}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Prompt Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Advanced Classifier v4"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">Prompt Template</Label>
            <Textarea
              id="template"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="Enter your prompt template here. Use {ticket} as a variable placeholder."
              className="min-h-[400px] font-mono text-sm"
              required
            />
            <p className="text-sm text-muted-foreground">
              Use <code className="bg-muted px-1 py-0.5 rounded">{'{ticket}'}</code> as a placeholder for the ticket text.
            </p>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onNavigate('prompts')}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="default" onClick={handleRunTest} disabled={runningTest || !id}>
              <CirclePlay className="mr-2 h-4 w-4" />
              {runningTest ? 'Starting...' : 'Run Test'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
