# Prompt Optimization Dashboard

A full-stack application for LLM prompt regression testing. Test different prompt versions against a dataset of customer support tickets and visualize accuracy metrics, confusion matrices, and get AI-powered suggestions for improvements.

## Features

- **Prompt Management**: Create, edit, and version prompts for ticket classification
- **Test Runs**: Execute prompts against 198 test cases across 11 categories
- **Metrics Dashboard**: Visualize accuracy, category breakdown, and confusion matrices
- **AI Suggestions**: Get LLM-powered recommendations for prompt improvements via Maitai
- **Real-time Updates**: Watch test runs progress with auto-refreshing status

## Tech Stack

### Backend
- **FastAPI** - Python async web framework
- **Maitai SDK** - LLM routing with observability
- **Pydantic** - Data validation and serialization
- **JSON file storage** - Simple persistence for prompts and runs

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tool
- **Tailwind CSS v4** - Utility-first styling
- **shadcn/ui** - Component library
- **Recharts** - Data visualization

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm or pnpm
- Maitai API key (get one at [maitai.ai](https://maitai.ai))

## Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd Maitai-interview
```

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Windows (Command Prompt):
.venv\Scripts\activate.bat
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your API keys
# Windows PowerShell:
@"
MAITAI_API_KEY=your_maitai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
"@ | Out-File -FilePath .env -Encoding utf8

# Or manually create .env with:
# MAITAI_API_KEY=your_maitai_api_key_here
# ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 3. Frontend Setup

```bash
cd dashboard
npm install
```

## Running the Application

### Start the Backend (Terminal 1)

```bash
# From project root, with virtual environment activated
uvicorn api.main:app --reload --port 8000
```

The API will be available at http://localhost:8000

- Swagger docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### Start the Frontend (Terminal 2)

```bash
cd dashboard
npm run dev
```

The dashboard will be available at http://localhost:5173

## Project Structure

```
Maitai-interview/
├── api/                    # FastAPI backend
│   ├── main.py            # App entry point
│   ├── schemas.py         # Pydantic models
│   ├── routers/           # API endpoints
│   │   ├── prompts.py     # CRUD for prompts
│   │   ├── runs.py        # Test run management
│   │   ├── metrics.py     # Aggregated metrics
│   │   ├── test_sets.py   # Test case data
│   │   └── suggest.py     # AI suggestions via Maitai
│   └── services/          # Business logic
│       ├── prompt_service.py
│       ├── run_service.py
│       └── metrics_service.py
├── dashboard/             # React frontend
│   ├── src/
│   │   └── app/
│   │       ├── components/  # UI components
│   │       ├── pages/       # Page components
│   │       ├── lib/         # API client
│   │       └── data/        # Mock data (unused)
│   └── package.json
├── data/                  # JSON storage
│   ├── prompts/           # Saved prompts
│   ├── runs/              # Test run results
│   └── test_set.json      # 198 test cases
├── src/                   # Core logic
│   ├── prompts.py         # Prompt loading
│   └── router.py          # TicketRouter class
├── requirements.txt
└── .env                   # API keys (not committed)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/prompts` | List all prompts |
| POST | `/prompts` | Create a prompt |
| GET | `/prompts/{id}` | Get a prompt |
| PUT | `/prompts/{id}` | Update a prompt |
| DELETE | `/prompts/{id}` | Delete a prompt |
| GET | `/runs` | List all runs |
| POST | `/runs` | Start a new test run |
| GET | `/runs/{id}` | Get run details |
| GET | `/metrics/summary` | Get aggregated metrics |
| GET | `/test-set` | Get test set metadata |
| GET | `/test-set/cases` | Get test cases |
| POST | `/suggest` | Get AI suggestions |

## Usage

1. **Create a Prompt**: Go to Prompts > New Prompt and write your classification prompt
2. **Run a Test**: Click "Run Test" to execute against all 198 test cases
3. **View Results**: See accuracy breakdown by category and confusion matrix
4. **Get Suggestions**: Click "Suggest Improvements" for AI-powered recommendations
5. **Iterate**: Modify your prompt based on suggestions and re-run

## Categories

The test set includes customer support tickets across 11 categories:

- DELIVERY, SHIPPING, TRACKING
- PAYMENT, BILLING, REFUND
- PRODUCT, ACCOUNT, TECHNICAL
- CANCELLATION, OTHER

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MAITAI_API_KEY` | Your Maitai API key for observability | Yes |
| `ANTHROPIC_API_KEY` | Your Anthropic/Claude API key for LLM calls | Yes |
| `CORS_ORIGINS` | Allowed origins (default: `http://localhost:5173`) | No |

## License

MIT
