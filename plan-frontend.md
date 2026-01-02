# Plan: Prompt Optimization Dashboard - Frontend Design

## App Purpose
A dashboard for testing and improving LLM prompts. Users create prompts, run tests against a dataset, view accuracy metrics, and get AI-powered suggestions to improve their prompts.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Charts**: Recharts

## Color Scheme
- Primary: Blue for actions
- Success: Green for high accuracy (>90%)
- Warning: Yellow for medium accuracy (70-90%)
- Error: Red for low accuracy (<70%)

---

## Site Map

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Dashboard | Overview + prompt comparison |
| `/prompts` | Prompts List | List all prompts |
| `/prompts/new` | New Prompt | Create new prompt |
| `/prompts/[id]` | Edit Prompt | Edit existing prompt |
| `/runs` | Run History | Table of all test runs |
| `/runs/[id]` | Run Details | Single run full details |
| `/test-set` | Test Set | Browse test data |

---

## Pages & Components

### 1. DASHBOARD (`/`) - Main Page

**Header:**
- Logo + "Prompt Optimization Dashboard"
- Navigation: Dashboard | Prompts | Runs | Test Set
- [+ New Prompt] button (top right)

**Overview Section:**
- 3 metric cards side-by-side showing each prompt version (v1, v2, v3)
  - Prompt name
  - Accuracy percentage (large text)
  - Small progress bar
  - Run count
- Horizontal bar chart comparing all prompt accuracies
- Summary stats row: Best prompt, total test cases, total runs

**Prompt Cards Section (one card per prompt):**
Each card contains:
- **Header row**: Prompt name + overall accuracy + [Run Test] button
- **Run selector**: Dropdown (Latest, specific dates, Averaged)
- **Category breakdown**: Horizontal bar chart showing accuracy per category
  - 11 categories total
  - Warning icon next to categories below 80%
- **Confusion matrix**: Expandable section (collapsed by default)
  - Table/heatmap showing actual vs predicted categories
- **Failed cases list**: Shows 3-5 items with [View All] link
  - Format: "#42: Expected DELIVERY → Got SHIPPING"
- **Footer buttons**: [View Prompt] [Suggest Improvements]

**AI Suggestions Modal (triggered by "Suggest Improvements"):**
- Modal/dialog overlay
- Title: "AI Suggestions for [prompt name]"
- Analysis section: Paragraph explaining failure patterns
- Suggestions list: 3-5 numbered actionable items
- Priority categories: Colored badges (red = critical, yellow = needs work)
- [Close] button

---

### 2. PROMPTS PAGE (`/prompts`)

**Header:**
- Page title: "Prompts"
- [+ New Prompt] button

**Prompts List:**
Cards or rows for each prompt showing:
- Prompt name and ID
- Created date
- Run count
- Best accuracy achieved
- [Edit] button

---

### 3. PROMPT EDITOR (`/prompts/[id]` or `/prompts/new`)

**Form Layout:**
- **ID field**: Text input (disabled if editing existing prompt)
- **Name field**: Text input
- **Template field**: Large textarea with monospace font
  - Shows `{ticket}` as placeholder variable
- **Footer**: [Cancel] [Save] [Run Test] buttons

---

### 4. RUNS PAGE (`/runs`)

**Header:**
- Page title: "Run History"
- [+ New Run] button

**Filters Row:**
- Dropdown: Filter by prompt
- Dropdown: Filter by status (All, Completed, Running, Failed)

**Runs Table:**
| Column | Content |
|--------|---------|
| Run ID | #001, #002, etc. |
| Prompt | v1, v2, v3 |
| Accuracy | 93.4% |
| Status | Badge (Done/Running/Failed) |
| Date | Jan 16, 2024 10:30 |

- Rows are clickable (navigate to run details)
- Status badges: Done (green), Running (blue), Failed (red)

**New Run Modal (triggered by [+ New Run]):**
- Prompt selector dropdown
- [Cancel] [Start] buttons

---

### 5. RUN DETAILS (`/runs/[id]`)

Full-page version of prompt card from dashboard:
- All metrics displayed
- Category breakdown chart
- Full confusion matrix
- Complete failed cases list
- Back link to runs list

---

### 6. TEST SET PAGE (`/test-set`)

**Header:**
- Page title: "Test Set"
- Stats: "198 test cases | 11 categories"

**Filters Row:**
- Dropdown: Filter by category
- Search box: Search ticket text

**Test Cases Table:**
| Column | Content |
|--------|---------|
| ID | 1, 2, 3... |
| Ticket | "need assistance to notify..." |
| Expected Category | ACCOUNT |

- Paginated or virtual scroll for performance

**Category Distribution Section:**
- Small horizontal bar chart or chips showing count per category
- Example: ACCOUNT (18) | CANCEL (18) | CONTACT (18) | ...

---

## Key UI Components

### 1. Accuracy Badge
Colored pill/badge based on value:
- Green background: ≥90%
- Yellow background: 70-89%
- Red background: <70%

### 2. Progress Bar
- Horizontal bar
- Fill width based on accuracy percentage
- Color matches accuracy badge rules

### 3. Category Bar Chart
- Horizontal bars, one per category
- Sorted by accuracy (worst first) or alphabetically
- Bar color based on accuracy threshold
- Shows percentage + fraction (e.g., "94% (17/18)")

### 4. Confusion Matrix
- Grid layout
- Rows = Actual categories
- Columns = Predicted categories
- Cell color intensity based on count
- Diagonal = correct predictions (green tint)
- Off-diagonal = errors (red tint intensity by count)

### 5. Run Selector Dropdown
- Options show: Date + Accuracy
- Example: "Jan 16, 2024 (93.4%)"
- Special option: "Averaged" for multi-run average

### 6. Status Badge
- Pill-shaped
- "Completed" = green
- "Running" = blue with spinner
- "Failed" = red

### 7. Failed Case Item
- Compact row format
- Shows: Test ID, Expected → Got
- Example: "#42: Expected DELIVERY → Got SHIPPING"
- Ticket text preview on hover or expandable

---

## Responsive Behavior

**Desktop (≥1024px):**
- Multi-column layout
- Prompt cards in 2-3 column grid
- Full table views

**Tablet (768px - 1023px):**
- 2-column grid for prompt cards
- Condensed tables

**Mobile (<768px):**
- Single column, stacked cards
- Collapsible sections
- Horizontal scroll for tables

---

## Sample Data for Design

**Prompts:**
- v1 "Baseline Prompt" - 93.4% accuracy, 2 runs
- v2 "Simplified" - 77.8% accuracy, 1 run
- v3 "Fixed" - 80.3% accuracy, 1 run

**Categories (11):**
ACCOUNT, CANCEL, CONTACT, DELIVERY, FEEDBACK, INVOICE, ORDER, PAYMENT, REFUND, SHIPPING, SUBSCRIPTION

**Test Set:**
- 198 total test cases
- 18 per category (balanced)

**Sample Failed Case:**
- ID: 42
- Ticket: "where is my package, it says shipped but not delivered"
- Expected: DELIVERY
- Predicted: SHIPPING

---

## Current Status
Ready for design in Figma
