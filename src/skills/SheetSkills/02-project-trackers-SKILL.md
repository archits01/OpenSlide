---
name: xlsx-project-trackers
description: "Use this skill when the user asks to create, edit, or manage a project tracker, task list, sprint backlog, Gantt chart, milestone tracker, roadmap, launch plan, onboarding checklist, or any spreadsheet that tracks work items with status, assignees, dates, and progress. Trigger on keywords: 'project tracker', 'task tracker', 'sprint', 'backlog', 'Gantt', 'milestone', 'roadmap', 'launch plan', 'timeline', 'checklist', 'work items', 'kanban', 'to-do list', 'action items', 'deliverables', 'dependencies', 'RAG status', 'red/amber/green', 'progress tracker', 'OKR tracker'. Also trigger when the user says 'track these tasks', 'manage this project', or 'I need to keep track of'."
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


# Project Trackers & Timelines — Complete Skill

## Skills Chain (read these BEFORE starting)

1. **PRIMARY**: `/mnt/skills/public/xlsx/SKILL.md` — Read this FIRST. Contains base spreadsheet rules for ALL Excel files.
2. **NO additional skills typically needed** — Project trackers rarely require external data research or document generation alongside.

## Library Selection

**Use openpyxl** — project trackers need conditional formatting, data validation (dropdowns), freeze panes, and structured formatting that pandas cannot provide.

```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.formatting.rule import CellIsRule, FormulaRule
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.utils import get_column_letter
```

Use pandas ONLY if the user uploads a raw CSV/JSON of tasks that needs cleaning before being loaded into the tracker.

## Sheet Architecture

### Single-sheet tracker (simple projects)
For projects with < 50 tasks, a single sheet works:

| Column | Header | Width | Purpose |
|---|---|---|---|
| A | Task ID | 10 | Auto-incrementing identifier (T-001, T-002) |
| B | Task Name | 40 | Description of the work item |
| C | Category / Epic | 18 | Grouping (Engineering, Design, Marketing) |
| D | Assignee | 18 | Person responsible |
| E | Priority | 12 | P0 / P1 / P2 / P3 |
| F | Status | 14 | Not Started / In Progress / Blocked / Done |
| G | Start Date | 14 | Planned or actual start |
| H | Due Date | 14 | Target completion date |
| I | Completed Date | 14 | Actual completion (blank if not done) |
| J | Days Remaining | 14 | Formula: =IF(F2="Done","✓",H2-TODAY()) |
| K | Days Overdue | 14 | Formula: =IF(AND(F2<>"Done",H2<TODAY()),TODAY()-H2,0) |
| L | Notes / Blockers | 45 | Free text for context |

### Multi-sheet tracker (complex projects)
For projects with multiple workstreams or phases:

| Sheet Name | Purpose |
|---|---|
| Dashboard | Summary counts, % complete, RAG status per workstream |
| All Tasks | Master task list with all columns |
| Sprint / Phase 1 | Filtered view of current sprint tasks |
| Sprint / Phase 2 | Next sprint planning |
| Completed | Archive of done tasks |
| Settings | Dropdown options, team member list, category definitions |

## Formatting Standards

### Header Row
```python
HEADER_FONT = Font(name='Arial', bold=True, color='FFFFFF', size=11)
HEADER_FILL = PatternFill('solid', fgColor='2D3748')
HEADER_ALIGNMENT = Alignment(horizontal='center', vertical='center', wrap_text=True)
HEADER_BORDER = Border(
    bottom=Side(style='medium', color='000000')
)
```

### Data Rows
```python
DATA_FONT = Font(name='Arial', size=10)
ALT_ROW_FILL = PatternFill('solid', fgColor='F7FAFC')  # Alternating row shading
WRAP_ALIGNMENT = Alignment(wrap_text=True, vertical='top')
CELL_BORDER = Border(
    left=Side(style='thin', color='E2E8F0'),
    right=Side(style='thin', color='E2E8F0'),
    top=Side(style='thin', color='E2E8F0'),
    bottom=Side(style='thin', color='E2E8F0'),
)
```

### Row height
```python
ws.row_dimensions[1].height = 28  # Header row
# Data rows: 22-30 depending on content density
for row in range(2, last_row + 1):
    ws.row_dimensions[row].height = 24
```

## Conditional Formatting — CRITICAL for Project Trackers

Conditional formatting is what makes a project tracker useful at a glance. Apply these rules AFTER all data is in place.

### Status column coloring
```python
# Green = Done
ws.conditional_formatting.add(
    f'F2:F{last_row}',
    CellIsRule(operator='equal', formula=['"Done"'],
               fill=PatternFill('solid', fgColor='C6F6D5'),
               font=Font(color='276749', bold=True))
)

# Yellow = In Progress
ws.conditional_formatting.add(
    f'F2:F{last_row}',
    CellIsRule(operator='equal', formula=['"In Progress"'],
               fill=PatternFill('solid', fgColor='FEFCBF'),
               font=Font(color='975A16', bold=True))
)

# Red = Blocked
ws.conditional_formatting.add(
    f'F2:F{last_row}',
    CellIsRule(operator='equal', formula=['"Blocked"'],
               fill=PatternFill('solid', fgColor='FED7D7'),
               font=Font(color='9B2C2C', bold=True))
)

# Grey = Not Started
ws.conditional_formatting.add(
    f'F2:F{last_row}',
    CellIsRule(operator='equal', formula=['"Not Started"'],
               fill=PatternFill('solid', fgColor='EDF2F7'),
               font=Font(color='4A5568'))
)
```

### Priority column coloring
```python
# P0 = Critical (red)
ws.conditional_formatting.add(
    f'E2:E{last_row}',
    CellIsRule(operator='equal', formula=['"P0"'],
               fill=PatternFill('solid', fgColor='FED7D7'),
               font=Font(color='9B2C2C', bold=True))
)

# P1 = High (orange)
ws.conditional_formatting.add(
    f'E2:E{last_row}',
    CellIsRule(operator='equal', formula=['"P1"'],
               fill=PatternFill('solid', fgColor='FEEBC8'),
               font=Font(color='9C4221', bold=True))
)

# P2 = Medium (blue)
ws.conditional_formatting.add(
    f'E2:E{last_row}',
    CellIsRule(operator='equal', formula=['"P2"'],
               fill=PatternFill('solid', fgColor='BEE3F8'),
               font=Font(color='2B6CB0'))
)

# P3 = Low (grey)
ws.conditional_formatting.add(
    f'E2:E{last_row}',
    CellIsRule(operator='equal', formula=['"P3"'],
               fill=PatternFill('solid', fgColor='EDF2F7'),
               font=Font(color='718096'))
)
```

### Overdue highlighting
```python
# Highlight entire row if task is overdue (due date < today AND status != Done)
ws.conditional_formatting.add(
    f'A2:L{last_row}',
    FormulaRule(
        formula=[f'AND($H2<TODAY(),$F2<>"Done")'],
        fill=PatternFill('solid', fgColor='FFF5F5'),
        font=Font(color='E53E3E')
    )
)
```

## Data Validation (Dropdowns) — MANDATORY for Trackers

Dropdowns prevent free-text chaos and ensure consistent status/priority values.

```python
# Status dropdown
status_validation = DataValidation(
    type='list',
    formula1='"Not Started,In Progress,Blocked,In Review,Done"',
    allow_blank=True
)
status_validation.error = 'Please select a valid status'
status_validation.errorTitle = 'Invalid Status'
ws.add_data_validation(status_validation)
status_validation.add(f'F2:F{last_row}')

# Priority dropdown
priority_validation = DataValidation(
    type='list',
    formula1='"P0,P1,P2,P3"',
    allow_blank=True
)
ws.add_data_validation(priority_validation)
priority_validation.add(f'E2:E{last_row}')

# Category dropdown
category_validation = DataValidation(
    type='list',
    formula1='"Engineering,Design,Marketing,Operations,Legal,Finance"',
    allow_blank=True
)
ws.add_data_validation(category_validation)
category_validation.add(f'C2:C{last_row}')

# Date validation (ensure dates are in valid range)
date_validation = DataValidation(
    type='date',
    operator='greaterThan',
    formula1='2024-01-01'
)
ws.add_data_validation(date_validation)
date_validation.add(f'G2:I{last_row}')
```

## Formula Patterns for Project Trackers

### Days remaining until due date
```python
# Shows number of days remaining, or "✓" if done, or "OVERDUE" if past due
'=IF(F2="Done","✓",IF(H2="","",IF(H2<TODAY(),"OVERDUE",H2-TODAY())))'
```

### Days overdue
```python
# Shows number of days overdue, 0 if not overdue or done
'=IF(OR(F2="Done",H2="",H2>=TODAY()),0,TODAY()-H2)'
```

### Duration (actual days spent)
```python
# Days between start and completion (or today if not complete)
'=IF(G2="","",IF(I2="",TODAY()-G2,I2-G2))'
```

### Dashboard summary formulas
```python
# Total tasks
'=COUNTA(A2:A{last_row})'

# Tasks by status
'=COUNTIF(F2:F{last_row},"Done")'
'=COUNTIF(F2:F{last_row},"In Progress")'
'=COUNTIF(F2:F{last_row},"Blocked")'
'=COUNTIF(F2:F{last_row},"Not Started")'

# Completion percentage
'=COUNTIF(F2:F{last_row},"Done")/COUNTA(F2:F{last_row})'

# Overdue count
'=COUNTIFS(H2:H{last_row},"<"&TODAY(),F2:F{last_row},"<>Done")'

# Tasks due this week
'=COUNTIFS(H2:H{last_row},">="&TODAY(),H2:H{last_row},"<="&TODAY()+7,F2:F{last_row},"<>Done")'

# Average days to completion
'=AVERAGEIFS(K2:K{last_row},F2:F{last_row},"Done")'
# where K column = =I2-G2 (completion date - start date)
```

### Assignee workload
```python
# Tasks assigned to a specific person
'=COUNTIFS(D2:D{last_row},"John",F2:F{last_row},"<>Done")'
```

## Freeze Panes and Auto-Filter — MANDATORY

```python
# Freeze the header row so it stays visible while scrolling
ws.freeze_panes = 'A2'

# Auto-filter on all columns — lets users sort/filter by any column
ws.auto_filter.ref = f'A1:L{last_row}'
```

## Step-by-Step Workflow

### Step 1: Determine tracker complexity
- < 20 tasks → Single sheet, simple columns
- 20-100 tasks → Single sheet with dashboard summary at top or separate sheet
- 100+ tasks → Multi-sheet with Dashboard, master list, and filtered views

### Step 2: Set up columns and headers
Define all columns, set widths, apply header formatting.

### Step 3: Add data validation (dropdowns)
Add status, priority, category, and assignee dropdowns BEFORE adding data.

### Step 4: Populate tasks
Either from user-provided data or create empty template rows for the user to fill.

### Step 5: Add formulas
Days remaining, days overdue, dashboard summaries — all as Excel formulas.

### Step 6: Apply conditional formatting
Status colors, priority colors, overdue row highlighting.

### Step 7: Set freeze panes and auto-filter

### Step 8: Save and recalculate (if formulas exist)
```bash
python scripts/recalc.py output.xlsx 30
```

### Step 9: Verify
- [ ] Dropdowns work (status, priority values are correct)
- [ ] Conditional formatting fires correctly
- [ ] Date formulas calculate properly
- [ ] Dashboard counts match manual counting
- [ ] Freeze panes lock the header row
- [ ] Auto-filter dropdowns appear on every column

## Recalculation

**Required if the tracker has formulas** (which it almost always does — days remaining, completion %, summary counts).

```bash
python scripts/recalc.py output.xlsx 30
```

Verify:
- Date calculations are correct (TODAY()-based formulas will show the current date's values)
- COUNTIF/COUNTIFS return correct counts
- Completion percentage makes sense
- No #REF! or #VALUE! errors in any cell

## Real-World Examples

### Example 1: Sprint Backlog Tracker
A product team asks: "Create a sprint tracker for our 2-week sprint"
- Columns: Story ID, User Story, Epic, Assignee, Story Points, Status, Sprint Day Added, Sprint Day Completed, Notes
- Status dropdown: To Do, In Dev, In Review, QA, Done
- Dashboard: Total stories, total points, points completed, velocity, burndown data
- Conditional formatting on status and overdue items
- Summary: Sprint goal at top, burndown chart data for external charting

### Example 2: Product Launch Timeline
A marketing team asks: "Build a launch tracker for our product release"
- Columns: Task, Workstream (Eng/Design/Marketing/Legal/Support), Owner, Priority, Status, Start, Due, Dependency, Notes
- Workstream filter via data validation dropdown
- RAG status column: =IF(F2="Done","Green",IF(AND(H2<TODAY(),F2<>"Done"),"Red",IF(H2<TODAY()+7,"Amber","Green")))
- Milestones highlighted with bold formatting and section separators
- Dependencies column tracks which tasks block which

### Example 3: Open Slides Feature Roadmap
A product owner tracks feature development:
- Columns: Feature ID, Feature Name, Priority (P0-P3), Status, Sprint Target, Effort Estimate, Actual Effort, Owner, Notes
- Grouped by milestone: MVP, v1.0, v1.1, Backlog
- Progress bar via conditional formatting on completion %
- Velocity tracking: planned vs actual effort per sprint

### Example 4: Client Onboarding Checklist
A services firm tracks client setup steps:
- Columns: Step #, Onboarding Task, Responsible Team, Status, Due Date (relative: Day 1, Day 3, Day 7), Actual Completion, SLA Met?, Notes
- SLA Met formula: =IF(I2="","",IF(I2<=H2,"Yes","No"))
- Conditional formatting: Green if SLA met, Red if missed
- Template designed for duplication per new client (copy sheet, rename)

## Common Pitfalls

- **Don't use merged cells in data rows** — breaks sorting and filtering
- **Don't put dashboard formulas in the same rows as data** — use a separate sheet or section above the data with a clear separator
- **Date formatting**: Ensure all date columns use consistent format (YYYY-MM-DD or DD-MMM-YYYY)
- **TODAY() formulas**: These recalculate every time the file is opened — warn the user that "Days Remaining" will change daily
- **Large trackers**: For 500+ rows, consider using Excel Tables (ListObjects) for automatic formula extension

## Code Style

- Define all styles and validations at the top of the script
- Add data validation BEFORE populating data
- Apply conditional formatting AFTER all data is in place
- Use consistent column letter references (define as constants if columns might shift)
- Avoid unnecessary print statements
