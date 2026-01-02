# Plan: Prompt Optimization Dashboard - Frontend

## App Purpose
A dashboard for testing and improving LLM prompts. Users create prompts, run tests against a dataset, view accuracy metrics, and get AI-powered suggestions to improve their prompts.

## Tech Stack (Figma Export)
- **Framework**: Vite + React 18
- **Styling**: Tailwind CSS v4 + shadcn/ui (46 components)
- **Charts**: Recharts
- **Icons**: Lucide React + MUI Icons
- **State**: React useState (client-side routing)

## Project Structure
```
dashboard/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── ui/           # 46 shadcn/ui components
│   │   │   ├── AccuracyBadge.tsx
│   │   │   ├── AISuggestionsModal.tsx
│   │   │   ├── CategoryChart.tsx
│   │   │   ├── ConfusionMatrix.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   └── PromptCard.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── PromptEditor.tsx
│   │   │   ├── PromptsPage.tsx
│   │   │   ├── RunDetails.tsx
│   │   │   ├── RunsPage.tsx
│   │   │   └── TestSetPage.tsx
│   │   ├── data/
│   │   │   └── mockData.ts   # Replace with API calls
│   │   └── App.tsx           # Main router
│   ├── styles/
│   └── main.tsx
└── package.json
```

## Pages & Navigation
| Page | Component | Purpose |
|------|-----------|---------|
| Dashboard | `Dashboard.tsx` | Overview + prompt comparison |
| Prompts | `PromptsPage.tsx` | List all prompts |
| Prompt Editor | `PromptEditor.tsx` | Create/edit prompts |
| Runs | `RunsPage.tsx` | Test run history |
| Run Details | `RunDetails.tsx` | Single run analysis |
| Test Set | `TestSetPage.tsx` | Browse test data |

## Custom Components (from Figma)
1. **AccuracyBadge** - Color-coded accuracy (green ≥90%, yellow ≥70%, red <70%)
2. **AISuggestionsModal** - AI improvement suggestions dialog
3. **CategoryChart** - Per-category accuracy bar chart
4. **ConfusionMatrix** - Expandable confusion matrix
5. **MetricCard** - Accuracy metric display card
6. **PromptCard** - Full prompt analysis card

---

## Backend Integration Plan

### API Base URL
```typescript
const API_BASE = 'http://localhost:8000';
```

### API Client (`src/app/lib/api.ts`)
Create functions to call each backend endpoint:

| Function | Endpoint | Purpose |
|----------|----------|---------|
| `getPrompts()` | GET /prompts | List all prompts |
| `getPrompt(id)` | GET /prompts/{id} | Get single prompt |
| `createPrompt(data)` | POST /prompts | Create new prompt |
| `updatePrompt(id, data)` | PUT /prompts/{id} | Update prompt |
| `deletePrompt(id)` | DELETE /prompts/{id} | Delete prompt |
| `getRuns(promptId?)` | GET /runs | List runs |
| `getRun(id)` | GET /runs/{id} | Get run details |
| `createRun(promptId)` | POST /runs | Start new test run |
| `getMetricsSummary()` | GET /metrics/summary | Dashboard metrics |
| `getTestSet()` | GET /test-set | Test set info |
| `getTestCases(filters)` | GET /test-set/cases | Test cases |
| `getSuggestions(data)` | POST /suggest | AI suggestions |

### Data Type Mapping
Backend → Frontend type alignment:

```typescript
// Prompt
interface Prompt {
  id: string;
  name: string;
  template: string;
  categories: string[];
  created_at: string;
  updated_at: string;
}

// Run
interface Run {
  id: string;
  prompt_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  completed_at: string | null;
  metrics: {
    overall_accuracy: number;
    correct: number;
    total: number;
    category_stats: Record<string, { total: number; correct: number }>;
  } | null;
  confusion_matrix: Record<string, Record<string, number>> | null;
  failed_cases: Array<{
    test_id: number;
    ticket: string;
    expected: string;
    predicted: string | null;
  }> | null;
}

// Metrics Summary
interface MetricsSummary {
  prompts: Record<string, {
    id: string;
    name: string;
    latest_accuracy: number | null;
    run_count: number;
    best_accuracy: number | null;
  }>;
  best_prompt: string | null;
  total_runs: number;
  test_set_size: number;
}
```

---

## Implementation Steps

### Phase 1: API Client ✅
- [x] Create `src/app/lib/api.ts` with all API functions
- [x] Add TypeScript interfaces for API responses

### Phase 2: Connect Pages
- [ ] Dashboard.tsx - Use `getMetricsSummary()`, `getRuns()`
- [ ] PromptsPage.tsx - Use `getPrompts()`
- [ ] PromptEditor.tsx - Use `getPrompt()`, `createPrompt()`, `updatePrompt()`
- [ ] RunsPage.tsx - Use `getRuns()`, `createRun()`
- [ ] RunDetails.tsx - Use `getRun()`
- [ ] TestSetPage.tsx - Use `getTestSet()`, `getTestCases()`

### Phase 3: AI Suggestions
- [ ] AISuggestionsModal.tsx - Use `getSuggestions()`

### Phase 4: Polish
- [ ] Loading states
- [ ] Error handling
- [ ] Run status polling (for in-progress runs)

---

## Running the Dashboard

```bash
cd dashboard
pnpm install
pnpm dev
```

Runs on http://localhost:5173

**Backend must be running:** `uvicorn api.main:app --reload --port 8000`

---

## Current Status
Figma export complete. Ready to connect to backend API.
