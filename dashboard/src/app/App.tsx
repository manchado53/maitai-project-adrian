import { useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { PromptsPage } from './pages/PromptsPage';
import { PromptEditor } from './pages/PromptEditor';
import { RunsPage } from './pages/RunsPage';
import { RunDetails } from './pages/RunDetails';
import { TestSetPage } from './pages/TestSetPage';
import { Button } from './components/ui/button';

type Page = 'dashboard' | 'prompts' | 'prompt-editor' | 'runs' | 'run-details' | 'test-set';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [pageId, setPageId] = useState<string | undefined>();

  const navigate = (page: Page, id?: string) => {
    setCurrentPage(page);
    setPageId(id);
  };

  const navItems = [
    { id: 'dashboard' as Page, label: 'Dashboard' },
    { id: 'prompts' as Page, label: 'Prompts' },
    { id: 'runs' as Page, label: 'Runs' },
    { id: 'test-set' as Page, label: 'Test Set' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold">Prompt Optimization Dashboard</h1>
              <nav className="flex gap-1">
                {navItems.map(item => (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? 'default' : 'ghost'}
                    onClick={() => navigate(item.id)}
                  >
                    {item.label}
                  </Button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentPage === 'dashboard' && (
          <Dashboard onNavigate={navigate} />
        )}
        {currentPage === 'prompts' && (
          <PromptsPage onNavigate={navigate} />
        )}
        {currentPage === 'prompt-editor' && (
          <PromptEditor promptId={pageId} onNavigate={navigate} />
        )}
        {currentPage === 'runs' && (
          <RunsPage onNavigate={navigate} />
        )}
        {currentPage === 'run-details' && pageId && (
          <RunDetails runId={pageId} onNavigate={navigate} />
        )}
        {currentPage === 'test-set' && (
          <TestSetPage />
        )}
      </main>
    </div>
  );
}
