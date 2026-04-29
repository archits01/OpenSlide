---
name: xlsx-data-analysis
description: "Use this skill when the user asks to analyze data, generate reports from data, create summary statistics, build pivot-style tables, visualize trends, clean messy data files, compute metrics/KPIs, or produce any spreadsheet where the primary task is transforming raw data into insights. Trigger on keywords: 'analyze this data', 'data analysis', 'statistics', 'summary report', 'metrics', 'KPI report', 'trends', 'pivot table', 'aggregate', 'group by', 'clean this data', 'data cleaning', 'parse this CSV', 'compute averages', 'distribution', 'correlation', 'frequency', 'outliers', 'data exploration'. Also trigger when the user uploads a CSV/XLSX/JSON with raw data and asks 'what does this data show?' or 'give me insights from this'."
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


# Data Analysis & Reporting — Complete Skill

## Skills Chain (read these BEFORE starting)

1. **PRIMARY**: `/mnt/skills/public/xlsx/SKILL.md` — Read this FIRST. Contains base spreadsheet rules.
2. **OPTIONAL**: `/mnt/skills/user/deep-research/SKILL.md` — Read IF the user needs external benchmarks, industry data, or context to compare their data against.
3. **OPTIONAL**: `/mnt/skills/public/pdf/SKILL.md` — Read IF the user wants a PDF report alongside the spreadsheet.

## Library Selection — TWO-PASS Workflow

Data analysis uses BOTH libraries in sequence:

**Pass 1 — pandas**: Heavy lifting. Read data, clean it, transform it, compute aggregations, build pivot tables, calculate statistics.

**Pass 2 — openpyxl**: Polish. Format the output, add headers, apply number formatting, insert charts, set print areas, freeze panes.

```python
import pandas as pd
from openpyxl import load_workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side, numbers
from openpyxl.chart import BarChart, LineChart, PieChart, Reference
from openpyxl.utils import get_column_letter
from openpyxl.utils.dataframe import dataframe_to_rows
```

### Why two passes?
- pandas is fast at computation but produces ugly, unformatted output
- openpyxl is slow at computation but excellent at formatting
- The combination gives you: fast analysis + professional output

## Sheet Architecture

### Standard data analysis output

| Sheet Name | Purpose |
|---|---|
| Executive Summary | Key findings, top-line metrics, charts |
| Detailed Analysis | Full pivot tables, breakdowns, drill-downs |
| Raw Data | Original data (cleaned) for reference and audit trail |
| Methodology | Notes on calculations, exclusions, assumptions |

### For simpler analyses (single question)

| Sheet Name | Purpose |
|---|---|
| Analysis | Results with summary metrics at top, detail below |
| Raw Data | Source data |

## Data Cleaning Workflow

### Step 1: Read and inspect the data
```python
df = pd.read_excel('input.xlsx')  # or pd.read_csv('input.csv')

# Inspect
print(f"Shape: {df.shape}")
print(f"Columns: {list(df.columns)}")
print(f"Dtypes:
{df.dtypes}")
print(f"Nulls:
{df.isnull().sum()}")
print(f"Duplicates: {df.duplicated().sum()}")
df.head(10)
```

### Step 2: Clean the data
```python
# Remove duplicates
df = df.drop_duplicates()

# Handle missing values
df['revenue'] = df['revenue'].fillna(0)
df['category'] = df['category'].fillna('Unknown')
df = df.dropna(subset=['date', 'id'])  # Drop rows with critical nulls

# Fix data types
df['date'] = pd.to_datetime(df['date'], errors='coerce')
df['revenue'] = pd.to_numeric(df['revenue'], errors='coerce')
df['id'] = df['id'].astype(str)

# Standardize text
df['category'] = df['category'].str.strip().str.title()
df['status'] = df['status'].str.upper()

# Remove outliers (optional — only if user requests or data is clearly corrupt)
q1 = df['revenue'].quantile(0.01)
q99 = df['revenue'].quantile(0.99)
df = df[(df['revenue'] >= q1) & (df['revenue'] <= q99)]
```

### Step 3: Feature engineering (if needed)
```python
# Date features
df['year'] = df['date'].dt.year
df['month'] = df['date'].dt.month
df['quarter'] = df['date'].dt.quarter
df['day_of_week'] = df['date'].dt.day_name()

# Derived metrics
df['margin'] = df['profit'] / df['revenue']
df['cost_per_unit'] = df['total_cost'] / df['units']
df['yoy_growth'] = df.groupby('category')['revenue'].pct_change(12)
```

## Analysis Patterns

### Aggregation (Group By)
```python
# Revenue by category
summary = df.groupby('category').agg(
    total_revenue=('revenue', 'sum'),
    avg_revenue=('revenue', 'mean'),
    count=('revenue', 'count'),
    min_revenue=('revenue', 'min'),
    max_revenue=('revenue', 'max')
).round(2)

summary = summary.sort_values('total_revenue', ascending=False)
```

### Pivot Table
```python
pivot = pd.pivot_table(
    df,
    values='revenue',
    index='category',
    columns='quarter',
    aggfunc='sum',
    fill_value=0,
    margins=True,        # Adds Grand Total row and column
    margins_name='Total'
)
```

### Time Series Analysis
```python
monthly = df.groupby(pd.Grouper(key='date', freq='M')).agg(
    revenue=('revenue', 'sum'),
    transactions=('id', 'count'),
    avg_order_value=('revenue', 'mean')
).round(2)

# Month-over-month growth
monthly['mom_growth'] = monthly['revenue'].pct_change()

# Rolling averages
monthly['revenue_3m_avg'] = monthly['revenue'].rolling(3).mean()
monthly['revenue_12m_avg'] = monthly['revenue'].rolling(12).mean()
```

### Distribution Analysis
```python
# Descriptive statistics
stats = df['revenue'].describe()

# Percentiles
percentiles = df['revenue'].quantile([0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99])

# Frequency distribution
freq = df['category'].value_counts()
freq_pct = df['category'].value_counts(normalize=True).round(4)
```

### Correlation Matrix
```python
numeric_cols = df.select_dtypes(include='number').columns
corr = df[numeric_cols].corr().round(3)
```

## Formatting the Output (Pass 2 — openpyxl)

### Export pandas results to Excel
```python
# Write multiple DataFrames to different sheets
with pd.ExcelWriter('output.xlsx', engine='openpyxl') as writer:
    summary.to_excel(writer, sheet_name='Summary')
    pivot.to_excel(writer, sheet_name='Pivot')
    monthly.to_excel(writer, sheet_name='Monthly Trends')
    df.to_excel(writer, sheet_name='Raw Data', index=False)
```

### Now format with openpyxl
```python
wb = load_workbook('output.xlsx')

for sheet_name in wb.sheetnames:
    ws = wb[sheet_name]
    
    # Header formatting
    for cell in ws[1]:
        cell.font = Font(name='Arial', bold=True, color='FFFFFF', size=10)
        cell.fill = PatternFill('solid', fgColor='2D3748')
        cell.alignment = Alignment(horizontal='center', wrap_text=True)
    
    # Auto-width columns
    for col in ws.columns:
        max_length = max(len(str(cell.value or '')) for cell in col)
        ws.column_dimensions[col[0].column_letter].width = min(max_length + 4, 40)
    
    # Number formatting
    for row in ws.iter_rows(min_row=2):
        for cell in row:
            if isinstance(cell.value, float):
                if abs(cell.value) < 1:
                    cell.number_format = '0.0%'
                else:
                    cell.number_format = '#,##0.00'
            cell.font = Font(name='Arial', size=10)
            cell.alignment = Alignment(vertical='top')
    
    # Alternating row shading
    for row_idx in range(3, ws.max_row + 1, 2):
        for cell in ws[row_idx]:
            cell.fill = PatternFill('solid', fgColor='F7FAFC')
    
    # Freeze panes
    ws.freeze_panes = 'A2' if sheet_name != 'Raw Data' else 'B2'
    
    # Auto-filter
    ws.auto_filter.ref = ws.dimensions

wb.save('output.xlsx')
```

## Adding Charts

```python
wb = load_workbook('output.xlsx')
ws = wb['Summary']

# Bar chart — Revenue by Category
chart = BarChart()
chart.title = 'Revenue by Category'
chart.x_axis.title = 'Category'
chart.y_axis.title = 'Revenue ($)'
chart.style = 10  # Clean style

data = Reference(ws, min_col=2, min_row=1, max_row=ws.max_row)
categories = Reference(ws, min_col=1, min_row=2, max_row=ws.max_row)
chart.add_data(data, titles_from_data=True)
chart.set_categories(categories)
chart.shape = 4  # Rounded corners

ws.add_chart(chart, 'E2')  # Place chart at E2

# Line chart — Monthly Trends
ws2 = wb['Monthly Trends']
line = LineChart()
line.title = 'Monthly Revenue Trend'
line.x_axis.title = 'Month'
line.y_axis.title = 'Revenue ($)'
line.style = 10

data = Reference(ws2, min_col=2, min_row=1, max_row=ws2.max_row)
dates = Reference(ws2, min_col=1, min_row=2, max_row=ws2.max_row)
line.add_data(data, titles_from_data=True)
line.set_categories(dates)

ws2.add_chart(line, 'E2')

wb.save('output.xlsx')
```

## Summary Formulas (added in openpyxl after pandas export)

After pandas exports the data, add summary formulas at the top of analysis sheets so the spreadsheet stays dynamic.

```python
# Add summary section above the data
ws.insert_rows(1, amount=6)

ws['A1'] = 'DATA ANALYSIS SUMMARY'
ws['A1'].font = Font(name='Arial', bold=True, size=14)

ws['A3'] = 'Total Records:'
ws['B3'] = f'=COUNTA(A8:A{ws.max_row})'

ws['A4'] = 'Total Revenue:'
ws['B4'] = f'=SUM(B8:B{ws.max_row})'
ws['B4'].number_format = '$#,##0'

ws['A5'] = 'Average Revenue:'
ws['B5'] = f'=AVERAGE(B8:B{ws.max_row})'
ws['B5'].number_format = '$#,##0.00'

ws['A6'] = 'Median Revenue:'
ws['B6'] = f'=MEDIAN(B8:B{ws.max_row})'
ws['B6'].number_format = '$#,##0.00'

ws['D3'] = 'Max Revenue:'
ws['E3'] = f'=MAX(B8:B{ws.max_row})'
ws['E3'].number_format = '$#,##0'

ws['D4'] = 'Min Revenue:'
ws['E4'] = f'=MIN(B8:B{ws.max_row})'
ws['E4'].number_format = '$#,##0'

ws['D5'] = 'Std Deviation:'
ws['E5'] = f'=STDEV(B8:B{ws.max_row})'
ws['E5'].number_format = '$#,##0.00'
```

## Recalculation

**Required when summary formulas are added after pandas export.** If the output is purely pandas-computed values with no Excel formulas, recalculation can be skipped.

```bash
python scripts/recalc.py output.xlsx 30
```

### Verify after recalc:
- [ ] Summary formula values match the pandas-computed values (cross-check SUM, AVERAGE)
- [ ] Charts render correctly
- [ ] No #REF! errors from inserted rows shifting references
- [ ] COUNTIF/SUMIF ranges cover all data rows

## Formula Verification Checklist

- [ ] Summary formulas reference the correct data range (check start and end rows)
- [ ] If rows were inserted for the summary section, data references shifted correctly
- [ ] Number formats match the data type (currency for money, % for rates, plain for counts)
- [ ] Charts reference the correct data ranges
- [ ] Freeze panes are below the summary section, not cutting through it
- [ ] Auto-filter covers only the data table, not the summary section

## Real-World Examples

### Example 1: API Cost Usage Analysis
A developer asks: "Analyze my API costs — here's a CSV of all calls"
- Clean: Parse timestamps, categorize by model (Claude 3.5, GPT-4), flag cache hits
- Analyze: Cost per model, cost per day, cache hit rate (%), cost savings from caching
- Output: Summary with total spend, cost by model pie chart, daily trend line chart, cache savings callout
- Like the OpenClaw analysis: ~73% cache savings, cost per conversation breakdown

### Example 2: Survey Results Analysis
A researcher asks: "Analyze this 500-response survey — CSV attached"
- Clean: Remove incomplete responses, standardize free-text answers, code Likert scales
- Analyze: Response distribution per question, cross-tabs (satisfaction × department), NPS calculation
- Output: Summary dashboard, per-question breakdown, demographic cross-tabs, key findings in Methodology sheet

### Example 3: Sales Performance Report
A sales manager asks: "Monthly sales report from this CRM export"
- Clean: Deduplicate leads, normalize stage names, parse close dates
- Analyze: Revenue by rep, win rate, average deal size, pipeline velocity, stage conversion rates
- Output: Executive summary with charts, rep-by-rep breakdown, trending metrics, raw data for audit

### Example 4: ML Experiment Results
A researcher asks: "Compare these model runs — here's the metrics CSV"
- Clean: Parse experiment IDs, extract hyperparameters from config columns
- Analyze: Accuracy/F1/latency across models, hyperparameter sensitivity, Pareto frontier
- Output: Model comparison table sorted by primary metric, scatter plot data, best config highlighted

## Common Pitfalls

- **pandas index**: When exporting with `.to_excel()`, set `index=False` unless the index IS meaningful data (like category names from groupby)
- **Row offset**: After inserting summary rows, all data references shift — recalculate ranges
- **Date handling**: pandas Timestamps and Excel dates are different formats — ensure pd.to_datetime conversion is applied before export
- **Large datasets**: For 100K+ rows, use `openpyxl` write_only mode or chunked pandas export to avoid memory issues
- **Mixed types**: pandas may infer wrong dtypes (numbers stored as strings) — always explicitly cast with `.astype()` or `pd.to_numeric()`
- **Chart data ranges**: If you insert rows AFTER creating charts, the chart data references may break — always insert rows BEFORE adding charts

## Code Style

- Use pandas method chaining where possible: `df.groupby('x').agg(...).sort_values(...).round(2)`
- Define formatting constants at the top
- Separate the analysis logic (pandas) from the formatting logic (openpyxl) into clear sections
- Avoid unnecessary intermediate DataFrames — chain operations
- Print summary stats to console for verification before exporting
