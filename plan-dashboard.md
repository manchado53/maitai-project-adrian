# Plan: Prompt Optimization Dashboard

## Goal
Build a Next.js dashboard that displays prompt/model metrics and uses an LLM to suggest prompt improvements based on failure analysis.

## Architecture

```
Maitai-interview/
├── dashboard/                    # Next.js app (NEW)
│   ├── app/
│   │   ├── page.tsx             # Main dashboard
│   │   ├── api/
│   │   │   ├── metrics/route.ts # Serve metrics from JSON
│   │   │   └── suggest/route.ts # LLM prompt improvement
│   │   └── components/
│   │       ├── MetricsCard.tsx
│   │       ├── CategoryChart.tsx
│   │       └── PromptSuggestion.tsx
│   └── package.json
│
├── src/                          # Existing Python backend
│   ├── router.py                 # Maitai integration (unchanged)
│   ├── prompts.py                # v1, v2, v3 templates
│   └── config.py
├── data/
│   └── test_set.json             # 198 test cases
├── results_v1.json               # Baseline: 93.4% accuracy
├── results_v2.json               # 77.8% accuracy
└── results_v3.json               # 80.3% accuracy
```

## Implementation Steps

### Phase 1: Next.js Dashboard Setup
- [ ] 1. Create `dashboard/` folder with Next.js (`npx create-next-app@latest dashboard`)
- [ ] 2. Configure Tailwind CSS
- [ ] 3. Install recharts for charts
- [ ] 4. Create basic layout

### Phase 2: Metrics Display
- [ ] 5. Create `/api/metrics` route to serve results JSON
- [ ] 6. Build MetricsCard component (accuracy %, correct/total)
- [ ] 7. Build CategoryChart component (bar chart per category)
- [ ] 8. Build version comparison view (v1 vs v2 vs v3)

### Phase 3: LLM Prompt Suggestions
- [ ] 9. Create `/api/suggest` route:
    - Input: current prompt + failure examples
    - Process: Call Claude to analyze patterns
    - Output: improvement suggestions
- [ ] 10. Build PromptSuggestion component
- [ ] 11. Add "Analyze Failures" button per version

## Dashboard Features (MVP)

### 1. Comparison Section (Top)
- **Accuracy Comparison Chart** - Bar chart comparing v1, v2, v3
- **Summary Cards** - Best version, total tests, quick stats
- **Regression Highlights** - Categories that got worse between versions

### 2. Individual Prompt Sections (Per Version)
Each prompt version gets its own card/section:

```
┌─────────────────────────────────────────────────────┐
│  Prompt v1                              93.4% ████  │
├─────────────────────────────────────────────────────┤
│  Per-Category Accuracy (bar chart)                  │
│  ████████████ ACCOUNT     94%                       │
│  ██████████   CANCEL      78%                       │
│  ████████████ CONTACT    100%                       │
│  ████████     DELIVERY    67%  ⚠️ Needs work        │
│  ...                                                │
├─────────────────────────────────────────────────────┤
│  Failed Cases (13)                    [View All]    │
│  • #42: Expected DELIVERY, Got SHIPPING             │
│  • #67: Expected CANCEL, Got SUBSCRIPTION           │
├─────────────────────────────────────────────────────┤
│  [View Prompt] [Suggest Improvements]               │
└─────────────────────────────────────────────────────┘
```

### 3. Prompt Improvement Panel
- "Suggest Improvements" button per version
- LLM analyzes failure patterns
- Displays specific, actionable suggestions
- Shows which categories need the most work

### 4. Confusion Matrix (Optional)
- Heatmap showing what gets misclassified as what
- Helps identify systematic errors

## API Routes

### GET `/api/metrics`
Returns all results data:
```json
{
  "v1": { "accuracy": 0.934, "correct": 185, "total": 198, "category_stats": {...} },
  "v2": { "accuracy": 0.778, "correct": 154, "total": 198, "category_stats": {...} },
  "v3": { "accuracy": 0.803, "correct": 159, "total": 198, "category_stats": {...} }
}
```

### POST `/api/suggest`
Request:
```json
{
  "version": "v2",
  "prompt": "...",
  "failures": [
    { "ticket": "...", "expected": "SHIPPING", "predicted": "DELIVERY" },
    ...
  ]
}
```

Response:
```json
{
  "analysis": "The model confuses SHIPPING and DELIVERY...",
  "suggestions": [
    "Add explicit distinction between shipping status vs delivery confirmation",
    "Include examples of each category in the prompt",
    ...
  ]
}
```

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **LLM**: Claude API (via Anthropic SDK)

## Future Vision (V2+)

### Goal
Turn this into a general-purpose prompt optimization platform where anyone can:
1. **Upload their data** - Test sets with inputs and expected outputs
2. **Define prompts** - Create and version prompt templates
3. **Run experiments** - Test prompts against data with any model
4. **Iterate with AI** - Get LLM-powered suggestions to improve

### V2 Features
- [ ] User authentication
- [ ] Project/workspace system
- [ ] Upload custom test sets (CSV/JSON)
- [ ] Prompt editor with versioning
- [ ] Model selector (Claude, GPT-4, etc.)
- [ ] Run tests from dashboard (not just Python scripts)
- [ ] Save and compare experiment history
- [ ] Export improved prompts

### V3 Features
- [ ] Automated A/B testing
- [ ] Cost tracking per model/prompt
- [ ] Team collaboration
- [ ] Prompt templates library
- [ ] Fine-tuning recommendations

### Architecture Evolution
```
V1 (MVP):     Dashboard reads local JSON files
V2:           Database + API for data storage
V3:           Multi-tenant SaaS with auth
```

## Current Status
Ready to start Phase 1 - Next.js setup (MVP)
