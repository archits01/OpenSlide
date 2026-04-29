---
name: xlsx-academic-research
description: "Use this skill when the user asks to create a literature review table, dataset catalog, model benchmark comparison, experiment results sheet, research bibliography, study guide, question bank, course tracker, or any spreadsheet that organizes academic, scientific, or educational reference data. Trigger on keywords: 'literature review', 'research table', 'paper comparison', 'dataset catalog', 'benchmark', 'experiment results', 'study guide', 'question bank', 'exam prep', 'course tracker', 'citation list', 'reading list', 'model comparison', 'survey of methods', 'related work', 'SOTA table'. Also trigger when the user asks to organize research papers, compare ML models, catalog datasets, or create educational materials in spreadsheet format."
---

# ═══════════════════════════════════════════════════════════════
# SECTION 0: EXACT EXECUTION PIPELINE (what Claude actually does)
# ═══════════════════════════════════════════════════════════════

## Tool Chain — Step by Step, Exactly as Claude Executes

When a user asks for any spreadsheet, Claude follows this EXACT tool chain in this EXACT order. No exceptions.

### Step 0: Read the skill file
```
Tool: view
Path: /mnt/skills/public/xlsx/SKILL.md
Why: ALWAYS the first action. Claude reads the base spreadsheet skill before writing a single line of code.
```

### Step 1: Check for uploaded files (if user mentions a file)
```
Tool: view
Path: /mnt/user-data/uploads/
Why: See what files the user has uploaded. All user uploads land here.
```

If the user uploaded an existing .xlsx:
```
Tool: bash_tool
Command: extract-text /mnt/user-data/uploads/file.xlsx | head -100
Why: Quick text dump to see sheet names, headers, and data structure before writing any code.
```

### Step 2: Write the Python script
```
Tool: bash_tool (with heredoc) or create_file
Path: /home/claude/build_spreadsheet.py
Why: /home/claude/ is the working directory. Users CANNOT see files here — it's a scratchpad.
     Claude writes the ENTIRE script in one shot, not incrementally.
```

### Step 3: Execute the script
```
Tool: bash_tool
Command: python3 /home/claude/build_spreadsheet.py
Why: Runs the script. Output file is saved to /mnt/user-data/outputs/filename.xlsx
```

### Step 4: Recalculate formulas (if ANY formulas exist)
```
Tool: bash_tool
Command: python scripts/recalc.py /mnt/user-data/outputs/filename.xlsx 30
Why: openpyxl writes formulas as text strings — they have NO calculated values.
     LibreOffice must open the file, recalculate every formula, and save.
     Without this, every formula cell shows "=SUM(B2:B9)" instead of "5000".
```

### Step 5: Verify recalc output
The recalc script returns JSON:
```json
{
  "status": "success",
  "total_errors": 0,
  "total_formulas": 42,
  "error_summary": {}
}
```

If `status` is `errors_found`:
```json
{
  "status": "errors_found",
  "total_errors": 3,
  "total_formulas": 42,
  "error_summary": {
    "#REF!": {
      "count": 2,
      "locations": ["Sheet1!B5", "Sheet1!C10"]
    },
    "#DIV/0!": {
      "count": 1,
      "locations": ["Sheet1!D15"]
    }
  }
}
```

Claude MUST:
1. Read the error locations
2. Identify the broken formulas in the Python script
3. Fix the script
4. Re-execute the script
5. Re-run recalc.py
6. Verify status is "success" and total_errors is 0
7. Repeat until ZERO errors

### Step 6: Deliver the file
```
Tool: present_files
Path: /mnt/user-data/outputs/filename.xlsx
Why: This is the ONLY way the user can see and download the file.
     Files in /home/claude/ are invisible to users.
     Files MUST be in /mnt/user-data/outputs/ to be presentable.
```

### Step 7: Respond to the user
Claude provides a CONCISE summary of what the file contains. Does NOT write extensive explanations of every column — the user can see the file themselves.

## File System Rules

| Path | Access | Purpose |
|---|---|---|
| `/mnt/user-data/uploads/` | Read-only | User's uploaded files live here |
| `/home/claude/` | Read-write | Claude's working directory (scratchpad — users can't see) |
| `/mnt/user-data/outputs/` | Read-write | Final deliverables go here (users CAN see/download) |
| `/mnt/skills/public/xlsx/` | Read-only | Skill files (cannot edit) |

## If the task is simple (single file, <100 lines of code):
Write the output directly to `/mnt/user-data/outputs/filename.xlsx` — skip the scratchpad.

## If the task is complex (multi-sheet, formulas, charts, >100 lines):
Write to `/home/claude/` first, iterate, then copy to `/mnt/user-data/outputs/`.

# ═══════════════════════════════════════════════════════════════
# SECTION 1: BASE XLSX RULES (from /mnt/skills/public/xlsx/SKILL.md)
# These rules apply to EVERY spreadsheet regardless of domain.
# ═══════════════════════════════════════════════════════════════

## Rule 1: Professional Font
Use a consistent, professional font (e.g., Arial, Times New Roman) for all deliverables unless otherwise instructed by the user.

## Rule 2: Zero Formula Errors
Every Excel file MUST be delivered with ZERO formula errors (#REF!, #DIV/0!, #VALUE!, #N/A, #NAME?). No exceptions.

## Rule 3: Preserve Existing Templates
When editing an existing file the user uploaded:
- Study and EXACTLY match existing format, style, and conventions
- Never impose standardized formatting on files with established patterns
- Existing template conventions ALWAYS override these guidelines

## Rule 4: CRITICAL — Use Formulas, Not Hardcoded Values
**Always use Excel formulas instead of calculating values in Python and hardcoding them.**

### ❌ WRONG — Hardcoding Calculated Values
```python
total = df['Sales'].sum()
sheet['B10'] = total  # Hardcodes 5000 — BREAKS when data changes

growth = (df.iloc[-1]['Revenue'] - df.iloc[0]['Revenue']) / df.iloc[0]['Revenue']
sheet['C5'] = growth  # Hardcodes 0.15 — unauditable

avg = sum(values) / len(values)
sheet['D20'] = avg  # Hardcodes 42.5 — dead number
```

### ✅ CORRECT — Using Excel Formulas
```python
sheet['B10'] = '=SUM(B2:B9)'           # Excel calculates — stays dynamic
sheet['C5'] = '=(C4-C2)/C2'            # Updates when source data changes
sheet['D20'] = '=AVERAGE(D2:D19)'      # Always accurate
```

This applies to ALL calculations — totals, percentages, ratios, differences, growth rates. The spreadsheet must recalculate when source data changes.

**Exception**: For pure reference tables with ONLY static text data (like a dataset catalog), this rule doesn't apply because there are no calculations to make.

## Rule 5: Library Selection
- **pandas**: Best for data analysis, bulk operations, cleaning messy data, and simple data export
- **openpyxl**: Best for complex formatting, formulas, charts, conditional formatting, data validation, and Excel-specific features
- **Both**: Use pandas for data cleaning/analysis FIRST, then openpyxl for formatting the output SECOND

## Rule 6: Reading Existing Files

### Quick text dump (see structure before writing code)
```bash
extract-text file.xlsx | head -100
extract-text --format xlsx file.xlsm | head -100
```

### With pandas (for data analysis)
```python
df = pd.read_excel('file.xlsx')                          # First sheet
all_sheets = pd.read_excel('file.xlsx', sheet_name=None) # All sheets as dict
df = pd.read_excel('file.xlsx', dtype={'id': str})       # Force data types
df = pd.read_excel('file.xlsx', usecols=['A', 'C', 'E']) # Specific columns
df = pd.read_excel('file.xlsx', parse_dates=['date_col']) # Parse dates
```

### With openpyxl (to preserve formulas and formatting)
```python
wb = load_workbook('file.xlsx')                    # Preserves formulas
wb = load_workbook('file.xlsx', data_only=True)    # ⚠️ Reads VALUES, formulas LOST if saved
wb = load_workbook('file.xlsx', read_only=True)    # Large files — read only
```

**⚠️ WARNING**: If you open with `data_only=True` and save, ALL formulas are permanently replaced with their last calculated values. The formulas are DESTROYED forever.

## Rule 7: Editing Existing Files
```python
from openpyxl import load_workbook

wb = load_workbook('existing.xlsx')
sheet = wb.active                    # or wb['SheetName']

# Working with multiple sheets
for sheet_name in wb.sheetnames:
    sheet = wb[sheet_name]

# Modify
sheet['A1'] = 'New Value'
sheet.insert_rows(2)    # Insert row at position 2
sheet.delete_cols(3)    # Delete column 3

# Add new sheet
new_sheet = wb.create_sheet('NewSheet')
new_sheet['A1'] = 'Data'

wb.save('modified.xlsx')
```

## Rule 8: Recalculation (MANDATORY if formulas exist)
```bash
python scripts/recalc.py <excel_file> [timeout_seconds]
```

The script:
- Automatically sets up LibreOffice macro on first run
- Recalculates ALL formulas in ALL sheets
- Scans every cell for errors (#REF!, #DIV/0!, #VALUE!, #N/A, #NAME?)
- Returns JSON with error count and exact cell locations
- Works on both Linux and macOS

## Rule 9: Formula Verification Checklist

### Essential Verification
- [ ] Test 2-3 sample cell references — do they pull the correct values?
- [ ] Column mapping — confirm Excel columns match (column 64 = BL, not BK)
- [ ] Row offset — Excel rows are 1-indexed (DataFrame row 5 = Excel row 6)

### Common Pitfalls
- [ ] NaN handling — check for null values with `pd.notna()`
- [ ] Far-right columns — FY data often in columns 50+
- [ ] Multiple matches — search all occurrences, not just first
- [ ] Division by zero — check denominators before using `/` in formulas
- [ ] Wrong references — verify all cell references point to intended cells
- [ ] Cross-sheet references — use correct format: `'Sheet Name'!A1`

### Formula Testing Strategy
- [ ] Start small — test formulas on 2-3 cells before applying broadly
- [ ] Verify dependencies — all referenced cells must exist
- [ ] Test edge cases — zero values, negative numbers, very large values

## Rule 10: Code Style
- Write minimal, concise Python code without unnecessary comments
- Avoid verbose variable names and redundant operations
- Avoid unnecessary print statements
- Add cell comments for complex formulas or important assumptions
- Document data sources for hardcoded values

# ═══════════════════════════════════════════════════════════════
# SECTION 2: DOMAIN-SPECIFIC RULES (varies per use case)
# ═══════════════════════════════════════════════════════════════


# Academic & Research Data — Complete Skill

## Skills Chain (read these BEFORE starting)

1. **PRIMARY**: `/mnt/skills/public/xlsx/SKILL.md` — Read FIRST. Base rules.
2. **RECOMMENDED**: `/mnt/skills/user/deep-research/SKILL.md` — Read this to research papers, datasets, benchmarks, or any academic data that needs to be accurate and current. Training data may be outdated for rapidly evolving fields (ML benchmarks change monthly).

## Library Selection

**Use openpyxl** for most academic tables — they're formatting-heavy reference tables with minimal formulas.

**Use pandas + openpyxl** if the user provides raw experiment data (CSV of model runs, survey responses) that needs aggregation before formatting.

```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
```

## Key Design Principle

Academic tables prioritize **clarity over aesthetics**. The goal is scanability — a researcher should be able to find any data point in under 5 seconds. This means:

- Clean, consistent structure
- Minimal decorative formatting (no excessive colors)
- Alternating row shading for readability on long tables
- Auto-filters on every column for instant sorting/filtering
- Hyperlinks for every paper, dataset, or URL reference
- Freeze panes so headers stay visible while scrolling through 100+ entries

## Sheet Architecture

### Literature Review / Survey Table

| Sheet Name | Purpose |
|---|---|
| Literature Review | Master table of all papers with metadata |
| By Method | Papers grouped or filtered by approach |
| Summary | Key findings, research gaps, trends |

### Dataset Catalog

| Sheet Name | Purpose |
|---|---|
| Datasets | Master list of datasets with metadata |
| Summary | Category breakdown, size distribution, license overview |

### Experiment Results

| Sheet Name | Purpose |
|---|---|
| Results | All experiment runs with metrics |
| Analysis | Aggregated comparisons, best configs, statistical tests |
| Raw Data | Unprocessed experiment logs |

## Column Structure — Literature Review Table

| Column | Header | Width | Purpose |
|---|---|---|---|
| A | # | 6 | Sequential number |
| B | Title | 45 | Paper title |
| C | Authors | 30 | Author list (First Author et al.) |
| D | Year | 8 | Publication year |
| E | Venue | 18 | Conference/journal (NeurIPS, ICML, CVPR, arXiv) |
| F | Method / Approach | 30 | Key technique or model name |
| G | Task / Problem | 25 | What problem does it solve |
| H | Dataset Used | 22 | Which datasets were evaluated on |
| I | Key Results | 35 | Primary metrics (accuracy, F1, BLEU, etc.) |
| J | Key Contribution | 40 | What's novel about this paper |
| K | Limitations | 35 | Noted weaknesses or gaps |
| L | Relevance | 12 | High / Medium / Low (to user's research) |
| M | URL / DOI | 35 | Link to paper (hyperlink) |
| N | Notes | 40 | Personal annotations, quotes, ideas |

## Column Structure — Dataset Catalog

| Column | Header | Width | Purpose |
|---|---|---|---|
| A | Dataset Name | 28 | Official name |
| B | Source / ID | 38 | Hugging Face ID, URL, or repository |
| C | Organization | 20 | Creator/maintainer |
| D | Task Type | 24 | Classification, QA, Generation, etc. |
| E | Modalities | 18 | Text, Image, Audio, Video, Multimodal |
| F | Size | 16 | Number of samples, file size |
| G | Downloads | 16 | Estimated or actual download count |
| H | License | 18 | Apache 2.0, CC-BY, MIT, etc. |
| I | Key Features | 45 | What makes it unique or valuable |
| J | Use Cases | 40 | What it's typically used for |

## Column Structure — Experiment Results

| Column | Header | Width | Purpose |
|---|---|---|---|
| A | Run ID | 10 | Unique experiment identifier |
| B | Model / Method | 25 | Model name or approach |
| C | Config | 30 | Hyperparameters or key settings |
| D | Dataset | 18 | Which dataset was used |
| E | Split | 10 | Train/Val/Test |
| F | Accuracy | 12 | Primary metric |
| G | F1 Score | 12 | Secondary metric |
| H | Precision | 12 | |
| I | Recall | 12 | |
| J | Latency (ms) | 12 | Inference time |
| K | Parameters | 14 | Model size |
| L | Training Time | 14 | Hours or epochs |
| M | GPU | 14 | Hardware used |
| N | Notes | 35 | Observations |

## Formatting Standards

### Headers
```python
HEADER_FONT = Font(name='Arial', bold=True, color='FFFFFF', size=11)
HEADER_FILL = PatternFill('solid', fgColor='2D3748')
HEADER_ALIGN = Alignment(horizontal='center', vertical='center', wrap_text=True)
```

### Data cells
```python
DATA_FONT = Font(name='Arial', size=10)
ALT_ROW_FILL = PatternFill('solid', fgColor='F7FAFC')
WRAP_ALIGN = Alignment(wrap_text=True, vertical='top')
CENTER_ALIGN = Alignment(horizontal='center', vertical='top')
```

### Hyperlinks
```python
LINK_FONT = Font(name='Arial', size=10, color='2B6CB0', underline='single')

# Apply hyperlinks to URL/DOI column
cell = ws.cell(row=row, column=url_col)
cell.value = 'arXiv:2401.12345'
cell.hyperlink = 'https://arxiv.org/abs/2401.12345'
cell.font = LINK_FONT
```

### Row height
```python
ws.row_dimensions[1].height = 28  # Header
for row in range(2, max_row + 1):
    ws.row_dimensions[row].height = 48  # Enough for wrapped text
```

### Border style (subtle)
```python
CELL_BORDER = Border(
    left=Side(style='thin', color='E2E8F0'),
    right=Side(style='thin', color='E2E8F0'),
    top=Side(style='thin', color='E2E8F0'),
    bottom=Side(style='thin', color='E2E8F0'),
)
```

## Conditional Formatting

### Relevance coloring (for literature review)
```python
ws.conditional_formatting.add(
    f'L2:L{max_row}',
    CellIsRule(operator='equal', formula=['"High"'],
               fill=PatternFill('solid', fgColor='C6F6D5'),
               font=Font(color='276749', bold=True))
)
ws.conditional_formatting.add(
    f'L2:L{max_row}',
    CellIsRule(operator='equal', formula=['"Medium"'],
               fill=PatternFill('solid', fgColor='FEFCBF'),
               font=Font(color='975A16'))
)
ws.conditional_formatting.add(
    f'L2:L{max_row}',
    CellIsRule(operator='equal', formula=['"Low"'],
               fill=PatternFill('solid', fgColor='EDF2F7'),
               font=Font(color='718096'))
)
```

### Best result highlighting (for experiment results)
```python
from openpyxl.formatting.rule import FormulaRule

# Highlight best accuracy in each dataset group
ws.conditional_formatting.add(
    f'F2:F{max_row}',
    FormulaRule(
        formula=[f'F2=MAX($F$2:$F${max_row})'],
        fill=PatternFill('solid', fgColor='C6F6D5'),
        font=Font(color='276749', bold=True)
    )
)
```

## Formula Patterns (Light Use)

### Summary statistics for experiment results
```python
# Count of experiments
f'=COUNTA(A2:A{max_row})'

# Best accuracy
f'=MAX(F2:F{max_row})'

# Average accuracy
f'=AVERAGE(F2:F{max_row})'

# Best model name (INDEX/MATCH)
f'=INDEX(B2:B{max_row},MATCH(MAX(F2:F{max_row}),F2:F{max_row},0))'

# Count by dataset
f'=COUNTIF(D2:D{max_row},"COCO")'

# Count by venue (literature review)
f'=COUNTIF(E2:E{max_row},"NeurIPS")'
f'=COUNTIF(E2:E{max_row},"ICML")'

# Papers per year
f'=COUNTIF(D2:D{max_row},2024)'
f'=COUNTIF(D2:D{max_row},2025)'
```

### Category breakdown for dataset catalog
```python
# Count by task type
f'=COUNTIF(D2:D{max_row},"Visual Question Answering")'

# Count by license
f'=COUNTIF(H2:H{max_row},"Apache 2.0")'

# Count by modality
f'=COUNTIF(E2:E{max_row},"*Image*")'  # Wildcard for partial match
```

## Freeze Panes and Auto-Filter — MANDATORY

```python
# Freeze header row (always)
ws.freeze_panes = 'A2'

# For wide tables, also freeze the name/title column
ws.freeze_panes = 'C2'  # Freezes columns A-B (ID, Title) and row 1

# Auto-filter on all columns — researchers WILL want to filter
ws.auto_filter.ref = f'A1:{get_column_letter(ws.max_column)}{max_row}'
```

## Title Row and Metadata

```python
# Add a title row above the data (merge across all columns)
ws.insert_rows(1, amount=3)

ws.merge_cells(f'A1:{get_column_letter(ws.max_column)}1')
ws['A1'] = 'Popular VLM Datasets on Hugging Face'
ws['A1'].font = Font(name='Arial', bold=True, size=14, color='2D3748')

ws.merge_cells(f'A2:{get_column_letter(ws.max_column)}2')
ws['A2'] = f'Compiled: {datetime.date.today().strftime("%B %Y")} | Source: Hugging Face Hub'
ws['A2'].font = Font(name='Arial', size=9, color='718096', italic=True)

# Adjust freeze panes to account for title rows
ws.freeze_panes = 'A5'  # Data starts at row 5 (title=1, subtitle=2, blank=3, header=4)
```

## Recalculation

**Usually NOT required** for pure reference tables with static data. Only required if you add summary formulas (COUNTIF, AVERAGE, MAX).

```bash
# Only if formulas exist:
python scripts/recalc.py output.xlsx 30
```

### Verify (if formulas used):
- [ ] COUNTIF counts match manual count
- [ ] MAX/MIN identify correct best/worst results
- [ ] INDEX/MATCH returns the correct model/paper name
- [ ] Summary percentages sum to ~100%

## Step-by-Step Workflow

### Step 1: Research the data (if not provided by user)
Use deep-research skill to gather accurate, current information. For ML papers, check arXiv, Semantic Scholar, PapersWithCode. For datasets, check Hugging Face, PapersWithCode Datasets. NEVER guess at metrics or dates.

### Step 2: Define column structure
Based on the type of academic table (lit review, dataset catalog, experiment results), choose the appropriate column set.

### Step 3: Compile data into Python list or DataFrame
Organize all entries in a structured format before writing to Excel.

### Step 4: Write data with openpyxl
Populate all cells with data, applying data font and wrap alignment.

### Step 5: Add hyperlinks
Every paper, dataset, or resource URL should be a clickable hyperlink.

### Step 6: Apply formatting
Headers, alternating rows, column widths, row heights for wrapped text.

### Step 7: Add title row and metadata
Date compiled, source, scope of the table.

### Step 8: Add summary section (optional)
Category counts, year distribution, top venues — using Excel formulas.

### Step 9: Set freeze panes and auto-filter

### Step 10: Save (and recalculate only if formulas were added)
```bash
python scripts/recalc.py output.xlsx 30  # Only if formulas exist
```

## Real-World Examples

### Example 1: VLM Dataset Catalog on Hugging Face
A researcher asks: "List the most popular VLM datasets on Hugging Face"
- 25 datasets with: Name, HF ID, Organization, Task Type, Modalities, Size, Downloads, License, Key Features, Use Cases
- Hyperlinks to each dataset's HF page
- Summary: Count by task type, count by license, size distribution
- This is exactly what we built earlier in this conversation

### Example 2: Literature Review — Transformer Architectures
A PhD student asks: "Help me organize my reading list on attention mechanisms"
- 60 papers: Title, Authors, Year, Venue, Method, Task, Key Results, Contribution, Limitations, Relevance
- Sorted by year (newest first)
- Filtered by venue: NeurIPS, ICML, ICLR, ACL
- Relevance column with conditional formatting (High = green, Low = grey)
- URL hyperlinks to arXiv or publisher pages

### Example 3: ML Model Benchmark Comparison
A developer asks: "Compare SOTA models on ImageNet, COCO, and SQuAD"
- Models: GPT-4V, Claude 3.5 Sonnet, Gemini Pro, LLaVA, InternVL
- Metrics per benchmark: Accuracy, F1, inference latency, model size
- Best-in-class highlighting per benchmark
- Summary: Overall ranking using average normalized scores

### Example 4: Exam Study Guide / Question Bank
A student asks: "Create a study guide for my ML exam"
- Topics: Supervised learning, Unsupervised learning, Deep learning, etc.
- Columns: Topic, Sub-topic, Key Concepts, Formulas, Exam Weightage, Preparation Status
- Status dropdown: Not Started, In Progress, Revised, Confident
- Conditional formatting on status for quick visual check
- Like the Atria University ML coursework study materials

### Example 5: Research Experiment Tracker
A lab runs experiments:
- 100 experiment runs across 5 model architectures × 4 datasets × 5 hyperparameter configs
- Columns: Run ID, Model, LR, Batch Size, Epochs, Dataset, Accuracy, F1, Loss, Training Time, GPU
- Analysis sheet: Best config per model, learning rate sensitivity, dataset difficulty ranking
- Pareto frontier: Models on accuracy vs. latency tradeoff

## Common Pitfalls

- **Stale benchmarks**: ML benchmarks change rapidly. Always note the date and version of metrics.
- **Inconsistent naming**: Use consistent paper/model/dataset names throughout. "GPT-4V" not sometimes "GPT4-Vision" and sometimes "GPT-4 with Vision".
- **Missing URLs**: Every paper and dataset should have a hyperlink. Researchers will want to click through.
- **Over-formatting**: Academic tables should be clean and scannable. Don't use 5 colors — alternating rows + one accent color is enough.
- **Wide tables**: If > 10 columns, freeze the first 2-3 identifier columns so they stay visible while scrolling right.
- **Year formatting**: Years should be plain numbers (2024) not formatted with commas (2,024). Format the column as text or use number format "0".

## Code Style

- Compile all data entries as a list of lists or list of dicts in Python
- Iterate and populate cells in a single loop
- Apply formatting in a separate pass after all data is written
- Add hyperlinks in the same loop as data population (not a separate pass)
- Keep the code linear and readable — academic tables are structurally simple
