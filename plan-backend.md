# Plan: Prompt Optimization Dashboard - Backend Implementation

## Goal
Build a FastAPI backend + Next.js dashboard for prompt optimization. The backend manages prompts, runs tests, and provides metrics. Keeps Maitai for LLM routing/observability.

## New Architecture

```
Maitai-interview/
├── api/                          # NEW: FastAPI backend
│   ├── main.py                   # FastAPI app entry point
│   ├── routers/
│   │   ├── prompts.py            # Prompt CRUD endpoints
│   │   ├── runs.py               # Test run endpoints
│   │   ├── test_sets.py          # Test set endpoints
│   │   ├── metrics.py            # Aggregated metrics
│   │   └── suggest.py            # LLM suggestions
│   ├── schemas.py                # Pydantic models
│   └── services/
│       ├── prompt_service.py     # Prompt file operations
│       ├── run_service.py        # Test execution logic
│       └── metrics_service.py    # Metrics aggregation
│
├── data/
│   ├── test_set.json             # Existing (unchanged)
│   ├── prompts/                  # NEW: Prompt JSON files
│   │   ├── v1.json
│   │   ├── v2.json
│   │   └── v3.json
│   └── runs/                     # NEW: Test run results
│       ├── v1_2024-01-15_001.json
│       └── ...
│
├── src/                          # Existing (minor changes)
│   ├── router.py                 # Maitai integration (unchanged)
│   ├── prompts.py                # Modified to load from JSON
│   └── config.py                 # Add API config
│
└── dashboard/                    # Next.js (Phase 2)
```

## Data Structures

### Prompt File (`data/prompts/v1.json`)
```json
{
  "id": "v1",
  "name": "Baseline Prompt",
  "template": "You are a customer support routing assistant...",
  "categories": ["ACCOUNT", "CANCEL", ...],
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

### Run Result (`data/runs/v1_2024-01-15_001.json`)
```json
{
  "id": "v1_2024-01-15_001",
  "prompt_id": "v1",
  "created_at": "2024-01-15T10:30:00Z",
  "status": "completed",
  "metrics": {
    "overall_accuracy": 0.934,
    "correct": 185,
    "total": 198,
    "category_stats": {...}
  },
  "results": [...]
}
```

## API Endpoints (11 total)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/prompts` | GET | List all prompts |
| `/prompts` | POST | Create new prompt |
| `/prompts/{id}` | GET | Get single prompt |
| `/prompts/{id}` | PUT | Edit prompt |
| `/prompts/{id}` | DELETE | Delete prompt |
| `/runs` | GET | List runs (filter by `?prompt_id=`) |
| `/runs` | POST | Execute new test run |
| `/runs/{id}` | GET | Get run details |
| `/test-set` | GET | Test set metadata |
| `/metrics/summary` | GET | Aggregated comparison data |
| `/suggest` | POST | LLM improvement suggestions |

## Implementation Steps

### Phase 1: Data Migration (Backend Foundation) ✅
- [x] 1. Create `data/prompts/` folder
- [x] 2. Create `data/runs/` folder
- [x] 3. Migrate v1, v2, v3 prompts from `prompts.py` to JSON files
- [x] 4. Move existing `results_*.json` to `data/runs/` with new naming

### Phase 2: FastAPI Setup ✅
- [x] 5. Install FastAPI + uvicorn (`pip install fastapi uvicorn`)
- [x] 6. Create `api/main.py` with CORS setup
- [x] 7. Create `api/schemas.py` with Pydantic models
- [x] 8. Update `requirements.txt`

### Phase 3: Prompt Service & Endpoints
- [ ] 9. Create `api/services/prompt_service.py`:
    - `list_prompts()` - Read all JSON files from `data/prompts/`
    - `get_prompt(id)` - Read single prompt
    - `create_prompt(data)` - Write new JSON file
    - `update_prompt(id, data)` - Update existing JSON
    - `delete_prompt(id)` - Remove JSON file
- [ ] 10. Create `api/routers/prompts.py` with CRUD endpoints
- [ ] 11. Update `src/prompts.py` to load from JSON files

### Phase 4: Run Service & Endpoints
- [ ] 12. Create `api/services/run_service.py`:
    - `list_runs(prompt_id?)` - Read all runs, filter by prompt
    - `get_run(id)` - Read single run
    - `execute_run(prompt_id)` - Run tests (async/background)
    - `save_run(run_data)` - Write result JSON
- [ ] 13. Create `api/routers/runs.py` with endpoints
- [ ] 14. Integrate with existing `TicketRouter` class

### Phase 5: Metrics & Test Set Endpoints
- [ ] 15. Create `api/services/metrics_service.py`:
    - `get_summary()` - Aggregate metrics across all runs per prompt
    - `get_test_set_info()` - Test set metadata
- [ ] 16. Create `api/routers/metrics.py`
- [ ] 17. Create `api/routers/test_sets.py`

### Phase 6: LLM Suggestions Endpoint
- [ ] 18. Create `api/routers/suggest.py`:
    - POST `/suggest` - Takes full analysis report, returns Claude suggestions
    - Input: prompt template, metrics, category stats, confusion matrix, failed cases
    - Output: actionable improvement suggestions
- [ ] 19. Add Anthropic SDK direct call (separate from Maitai)

### Phase 7: Testing & Integration
- [ ] 20. Test all endpoints with curl/Postman
- [ ] 21. Create simple test script for API validation
- [ ] 22. Update `.gitignore` for new folders

## Key Files to Modify

### `src/prompts.py` (modify)
```python
# Change from hardcoded PROMPTS dict to:
def get_prompt(ticket: str, prompt_id: str) -> str:
    """Load prompt template from JSON and format with ticket."""
    prompt_path = DATA_DIR / "prompts" / f"{prompt_id}.json"
    with open(prompt_path) as f:
        data = json.load(f)
    return data["template"].format(ticket=ticket)
```

### `api/schemas.py` (new)
```python
class PromptCreate(BaseModel):
    id: str
    name: str
    template: str

class PromptResponse(BaseModel):
    id: str
    name: str
    template: str
    categories: list[str]
    created_at: datetime

class RunResponse(BaseModel):
    id: str
    prompt_id: str
    status: Literal["pending", "running", "completed"]
    metrics: dict | None
    created_at: datetime

class SuggestRequest(BaseModel):
    prompt_id: str
    prompt_template: str
    metrics: dict                    # overall_accuracy, correct, total
    category_stats: dict             # per-category accuracy
    confusion_matrix: dict           # what gets misclassified as what
    failed_cases: list[dict]         # ticket, expected, predicted

class SuggestResponse(BaseModel):
    analysis: str                    # LLM's analysis of failure patterns
    suggestions: list[str]           # Specific, actionable improvements
    priority_categories: list[str]   # Categories needing most work
```

### `api/main.py` (new)
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import prompts, runs, metrics, test_sets, suggest

app = FastAPI(title="Prompt Optimization API")

app.add_middleware(CORSMiddleware, allow_origins=["*"], ...)

app.include_router(prompts.router, prefix="/prompts", tags=["prompts"])
app.include_router(runs.router, prefix="/runs", tags=["runs"])
app.include_router(metrics.router, prefix="/metrics", tags=["metrics"])
app.include_router(test_sets.router, prefix="/test-set", tags=["test-set"])
app.include_router(suggest.router, prefix="/suggest", tags=["suggest"])
```

## Background Task Handling

Test runs take 3-5 minutes (198 API calls with rate limiting). Use FastAPI BackgroundTasks:

```python
# POST /runs - Returns immediately with run_id, runs in background
@router.post("/runs")
async def create_run(prompt_id: str, background_tasks: BackgroundTasks):
    run_id = generate_run_id(prompt_id)
    # Create run file with status="running"
    save_run({"id": run_id, "prompt_id": prompt_id, "status": "running"})
    # Execute in background
    background_tasks.add_task(execute_run, run_id, prompt_id)
    return {"id": run_id, "status": "running"}
```

**Frontend polling:** Call `GET /runs/{id}` every 5 seconds until `status != "running"`

## Confusion Matrix Calculation

Computed from run results in `run_service.py`:

```python
def calculate_confusion_matrix(results: list[dict]) -> dict:
    """Build matrix of actual vs predicted categories."""
    matrix = defaultdict(lambda: defaultdict(int))
    for r in results:
        matrix[r["expected"]][r["predicted"]] += 1
    return dict(matrix)
```

Output format:
```json
{
  "SHIPPING": {"SHIPPING": 14, "DELIVERY": 3, "ORDER": 1},
  "DELIVERY": {"DELIVERY": 12, "SHIPPING": 4, "ORDER": 2},
  ...
}
```

## Environment Variables

```env
# .env file
ANTHROPIC_API_KEY=sk-ant-...      # For LLM suggestions
MAITAI_API_KEY=...                 # For test execution
API_PORT=8000                      # FastAPI port
CORS_ORIGINS=http://localhost:3000 # Next.js dev server
```

## Dependencies

```txt
# requirements.txt additions
fastapi>=0.104.0
uvicorn>=0.24.0
python-multipart>=0.0.6    # For form data
anthropic>=0.18.0          # For /suggest endpoint
```

## Running the API

```bash
# Development
uvicorn api.main:app --reload --port 8000

# Production
uvicorn api.main:app --host 0.0.0.0 --port 8000
```

## Error Handling

Run failures are captured in the run file:

```json
{
  "id": "v1_2024-01-15_001",
  "status": "failed",
  "error": "Rate limit exceeded at test #45",
  "partial_results": [...],  // Results up to failure point
  "failed_at": "2024-01-15T10:35:00Z"
}
```

## Updated Run Result Schema

```json
{
  "id": "v1_2024-01-15_001",
  "prompt_id": "v1",
  "created_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:35:00Z",
  "status": "completed",
  "metrics": {
    "overall_accuracy": 0.934,
    "correct": 185,
    "total": 198,
    "category_stats": {...}
  },
  "confusion_matrix": {
    "SHIPPING": {"SHIPPING": 14, "DELIVERY": 3},
    ...
  },
  "results": [...],
  "failed_cases": [
    {"test_id": 42, "ticket": "...", "expected": "DELIVERY", "predicted": "SHIPPING"}
  ]
}
```

## Current
Phase 1 & 2 complete. Ready for Phase 3 - Prompt Service & Endpoints
