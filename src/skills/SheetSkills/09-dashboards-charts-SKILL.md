---
name: xlsx-dashboards
description: "Use this skill when the user asks to create a dashboard, KPI tracker, executive summary sheet, metrics overview, or any spreadsheet that consolidates data into visual summaries with charts, callout metrics, and at-a-glance overviews. Trigger on keywords: 'dashboard', 'KPI', 'metrics dashboard', 'executive summary', 'overview', 'scorecard', 'report card', 'performance dashboard', 'analytics dashboard', 'data dashboard', 'weekly report', 'monthly report', 'status overview', 'management report', 'board deck data'. Also trigger when the user says 'give me an overview of this data', 'summarize this data visually', 'I need to present these numbers', or 'build me a report with charts'."
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


# Dashboards with Charts — Complete Skill

## Skills Chain (read these BEFORE starting)

1. **PRIMARY**: `/mnt/skills/public/xlsx/SKILL.md` — Read FIRST. Base rules.
2. **NO additional skills typically needed** — Dashboards synthesize existing data. If the user needs data gathered first, add deep-research.

## Library Selection

**Use openpyxl** — dashboards need charts, cross-sheet formulas, conditional formatting, and precise layout control.

**Use pandas + openpyxl** if raw data needs aggregation before being visualized.

```python
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side, numbers
from openpyxl.chart import BarChart, LineChart, PieChart, AreaChart, Reference
from openpyxl.chart.label import DataLabelList
from openpyxl.chart.series import DataPoint
from openpyxl.formatting.rule import CellIsRule, ColorScaleRule, IconSetRule
from openpyxl.utils import get_column_letter
```

## Sheet Architecture — CRITICAL for Dashboards

The sheet order matters. Dashboard goes FIRST — it's what the user sees when they open the file.

| Sheet Name | Position | Purpose |
|---|---|---|
| Dashboard | Sheet 1 (leftmost) | Visual summary — KPI callouts, charts, key tables |
| Monthly Data | Sheet 2 | Time-series data that feeds the dashboard |
| Breakdown | Sheet 3 | Category/segment breakdowns |
| Raw Data | Sheet 4 (rightmost) | Source data for audit trail |

### Dashboard Layout (typical)
```
+---------------------------+---------------------------+
|  KPI 1: Revenue           |  KPI 2: Customers         |
|  $1.2M  ▲ 15% YoY        |  4,250  ▲ 8% YoY          |
+---------------------------+---------------------------+
|  KPI 3: Avg Order Value   |  KPI 4: Churn Rate        |
|  $285   ▲ 3% YoY         |  2.1%   ▼ 0.5pp YoY      |
+---------------------------+---------------------------+
|                                                       |
|  [Revenue Trend — Line Chart]                         |
|                                                       |
+---------------------------+---------------------------+
|  [Revenue by Segment      |  [Top Products            |
|   — Pie Chart]            |   — Bar Chart]            |
+---------------------------+---------------------------+
|  [Monthly Performance Table — Compact]                |
+-------------------------------------------------------+
```

## KPI Callout Cells — The Heart of a Dashboard

KPI callouts are large, bold metric cells that draw the eye immediately. They are THE most important element.

### Structure per KPI block (4 cells):
```python
# Row 1: Label
ws['B2'] = 'Total Revenue'
ws['B2'].font = Font(name='Arial', size=9, color='718096')

# Row 2: Value (BIG number)
ws['B3'] = "='Monthly Data'!B14"  # Pulls total from data sheet
ws['B3'].font = Font(name='Arial', bold=True, size=28, color='1A202C')
ws['B3'].number_format = '$#,##0.0,,"M"'  # Shows $1.2M

# Row 3: Change indicator
ws['B4'] = "=('Monthly Data'!B14-'Monthly Data'!B2)/'Monthly Data'!B2"
ws['B4'].font = Font(name='Arial', size=11, color='276749')  # Green if positive
ws['B4'].number_format = '▲ 0.0%;▼ 0.0%'  # Shows ▲ 15.3% or ▼ 2.1%

# Row 4: Period label
ws['B5'] = 'vs. same period last year'
ws['B5'].font = Font(name='Arial', size=8, color='A0AEC0', italic=True)
```

### KPI card background
```python
# Light card background for each KPI block
KPI_FILL = PatternFill('solid', fgColor='F7FAFC')
KPI_BORDER = Border(
    left=Side(style='thin', color='E2E8F0'),
    right=Side(style='thin', color='E2E8F0'),
    top=Side(style='thin', color='E2E8F0'),
    bottom=Side(style='thin', color='E2E8F0'),
)

for row in range(2, 6):
    for col in range(2, 4):  # KPI 1 block: columns B-C
        cell = ws.cell(row=row, column=col)
        cell.fill = KPI_FILL
        cell.border = KPI_BORDER
```

### Conditional coloring for change indicators
```python
# Green for positive change
ws.conditional_formatting.add(
    'B4',
    CellIsRule(operator='greaterThan', formula=['0'],
               font=Font(name='Arial', size=11, color='276749', bold=True))
)

# Red for negative change
ws.conditional_formatting.add(
    'B4',
    CellIsRule(operator='lessThan', formula=['0'],
               font=Font(name='Arial', size=11, color='E53E3E', bold=True))
)
```

## Charts — Detailed Implementation

### Line Chart (Revenue Trend)
```python
line = LineChart()
line.title = 'Revenue Trend (12 Months)'
line.style = 10
line.y_axis.title = 'Revenue ($)'
line.x_axis.title = 'Month'
line.height = 12  # cm
line.width = 24   # cm

# Data reference from Monthly Data sheet
data_sheet = wb['Monthly Data']
data = Reference(data_sheet, min_col=2, min_row=1, max_row=13)  # 12 months + header
cats = Reference(data_sheet, min_col=1, min_row=2, max_row=13)  # Month labels

line.add_data(data, titles_from_data=True)
line.set_categories(cats)

# Style the line
line.series[0].graphicalProperties.line.width = 25000  # Thicker line
line.series[0].graphicalProperties.line.solidFill = '2B6CB0'  # Blue

# Place on dashboard
ws.add_chart(line, 'B8')
```

### Pie Chart (Revenue by Segment)
```python
pie = PieChart()
pie.title = 'Revenue by Segment'
pie.style = 10
pie.height = 12
pie.width = 14

data = Reference(wb['Breakdown'], min_col=2, min_row=1, max_row=5)
cats = Reference(wb['Breakdown'], min_col=1, min_row=2, max_row=5)
pie.add_data(data, titles_from_data=True)
pie.set_categories(cats)

# Add data labels with percentages
pie.dataLabels = DataLabelList()
pie.dataLabels.showPercent = True
pie.dataLabels.showVal = False
pie.dataLabels.showCatName = True

# Custom colors for each slice
colors = ['2B6CB0', '38A169', 'D69E2E', 'E53E3E']
for i, color in enumerate(colors):
    pt = DataPoint(idx=i)
    pt.graphicalProperties.solidFill = color
    pie.series[0].data_points.append(pt)

ws.add_chart(pie, 'B20')
```

### Bar Chart (Top Products)
```python
bar = BarChart()
bar.type = 'col'
bar.title = 'Top 5 Products by Revenue'
bar.style = 10
bar.height = 12
bar.width = 14

data = Reference(wb['Breakdown'], min_col=4, min_row=1, max_row=6)
cats = Reference(wb['Breakdown'], min_col=3, min_row=2, max_row=6)
bar.add_data(data, titles_from_data=True)
bar.set_categories(cats)

bar.series[0].graphicalProperties.solidFill = '2B6CB0'

ws.add_chart(bar, 'H20')
```

### Stacked Bar Chart (Revenue vs Target)
```python
bar = BarChart()
bar.type = 'col'
bar.grouping = 'clustered'  # or 'stacked'
bar.title = 'Actual vs Target Revenue'
bar.height = 12
bar.width = 24

# Two data series: Actual and Target
actual = Reference(data_sheet, min_col=2, min_row=1, max_row=13)
target = Reference(data_sheet, min_col=3, min_row=1, max_row=13)
cats = Reference(data_sheet, min_col=1, min_row=2, max_row=13)

bar.add_data(actual, titles_from_data=True)
bar.add_data(target, titles_from_data=True)
bar.set_categories(cats)

bar.series[0].graphicalProperties.solidFill = '2B6CB0'  # Actual = blue
bar.series[1].graphicalProperties.solidFill = 'E2E8F0'  # Target = grey

ws.add_chart(bar, 'B32')
```

## Dashboard Formula Patterns

ALL dashboard values MUST be formulas pulling from data sheets. NEVER hardcode values on the dashboard.

### Total metrics
```python
# Total revenue (sum of monthly)
"='Monthly Data'!B14"  # Where B14 = =SUM(B2:B13)

# YTD revenue
"=SUMPRODUCT(('Monthly Data'!A2:A13<=TODAY())*'Monthly Data'!B2:B13)"

# Current month revenue
"=INDEX('Monthly Data'!B2:B13,MONTH(TODAY()))"
```

### Growth calculations
```python
# Month-over-month growth
"=('Monthly Data'!B{current}-'Monthly Data'!B{previous})/'Monthly Data'!B{previous}"

# Year-over-year growth (if prior year data exists)
"=('Monthly Data'!B14-'Prior Year'!B14)/'Prior Year'!B14"
```

### Aggregated metrics
```python
# Average deal size
"=AVERAGEIF('Raw Data'!G2:G{max},'Raw Data'!F2:F{max},\"Closed Won\")"

# Customer count (unique)
# Note: Excel doesn't have native COUNTUNIQUE — use SUMPRODUCT workaround
"=SUMPRODUCT(1/COUNTIF('Raw Data'!C2:C{max},'Raw Data'!C2:C{max}))"

# Churn rate
"=COUNTIF('Raw Data'!G2:G{max},\"Churned\")/COUNTA('Raw Data'!G2:G{max})"
```

### Cross-sheet references (GREEN text)
```python
# All dashboard formulas pulling from other sheets use GREEN font
cell = ws['B3']
cell.value = "='Monthly Data'!B14"
cell.font = Font(name='Arial', bold=True, size=28, color='008000')  # Green = cross-sheet
```

## Formatting Standards

### Dashboard-specific rules
```python
# No gridlines on dashboard sheet
ws.sheet_view.showGridLines = False

# Page setup for printing
ws.page_setup.orientation = 'landscape'
ws.page_setup.fitToPage = True
ws.page_setup.fitToWidth = 1
ws.page_setup.fitToHeight = 1

# Column widths for dashboard layout
for col in range(1, 15):
    ws.column_dimensions[get_column_letter(col)].width = 12

# Row heights for KPI section
for row in range(2, 6):
    ws.row_dimensions[row].height = 24
ws.row_dimensions[3].height = 40  # KPI value row — taller
```

### Data table on dashboard (compact summary)
```python
# Mini table below charts — key monthly figures
TABLE_HEADER = Font(name='Arial', bold=True, size=9, color='FFFFFF')
TABLE_FILL = PatternFill('solid', fgColor='2D3748')
TABLE_DATA = Font(name='Arial', size=9)
TABLE_ALT = PatternFill('solid', fgColor='F7FAFC')
```

## Step-by-Step Workflow

### Step 1: Understand the KPIs
Ask or determine: What are the 4-6 most important metrics? What time period? What comparisons (MoM, YoY, vs target)?

### Step 2: Set up data sheets FIRST
Build the Monthly Data, Breakdown, and Raw Data sheets with clean, structured data. The dashboard will pull from these.

### Step 3: Build the dashboard layout
Plan the grid: KPI callouts at top, charts in middle, compact table at bottom.

### Step 4: Create KPI callout cells with formulas
Every value is a formula referencing data sheets. Green font for cross-sheet references.

### Step 5: Create charts
Line chart for trends, pie for composition, bar for comparisons, stacked bar for actual vs target.

### Step 6: Add conditional formatting
Green/red for positive/negative changes, color scales for performance ranges.

### Step 7: Hide gridlines, set print area

### Step 8: Save and recalculate — MANDATORY
```bash
python scripts/recalc.py output.xlsx 30
```

### Step 9: Verify every KPI value
Open the file, check each KPI callout against the source data. One wrong formula on a dashboard is catastrophic — executives make decisions based on these numbers.

## Recalculation — MANDATORY

Dashboards are 100% formula-driven. Without recalculation, every KPI shows the formula text instead of the number. This is the worst possible outcome — an executive opens the file and sees `='Monthly Data'!B14` instead of `$1.2M`.

```bash
python scripts/recalc.py output.xlsx 30
```

### Verification checklist:
- [ ] Every KPI callout shows a number, not a formula
- [ ] Change indicators show correct ▲/▼ direction
- [ ] Charts render with correct data
- [ ] Cross-sheet references pull the right values
- [ ] Totals match: Dashboard total = sum of data sheet values
- [ ] No #REF!, #DIV/0!, or #VALUE! errors anywhere
- [ ] Percentages are plausible (not 1500% growth unless it's real)

## Real-World Examples

### Example 1: Startup Monthly Dashboard
A CEO wants a one-pager for board meetings:
- KPIs: MRR ($), Active Users, Churn Rate, Burn Rate, Runway (months)
- Charts: MRR trend (12 months), User growth, Revenue by plan tier
- Table: Monthly P&L summary (Revenue, COGS, OpEx, Net Income)
- Data: From accounting + product analytics exports

### Example 2: Marketing Metrics Dashboard
A CMO tracks campaign performance:
- KPIs: CAC ($), LTV ($), LTV/CAC ratio, Website traffic, Conversion rate
- Charts: Traffic by channel (pie), Conversion funnel (funnel chart via stacked bar), CAC trend (line)
- Table: Campaign-by-campaign ROI breakdown
- Conditional formatting: Green if CAC < target, Red if above

### Example 3: OpenClaw Operations Dashboard
Track AI agent performance:
- KPIs: Total API calls, Cache hit rate (%), Cost per conversation ($), Uptime (%)
- Charts: Daily API call volume (line), Cost breakdown by model (pie), Cache vs non-cache (stacked bar)
- Table: Per-workflow stats (WhatsApp, Voice, Scraping)
- Alert: Red highlight if cost/conversation exceeds $0.50 threshold

### Example 4: Sales Team Scorecard
A VP Sales tracks rep performance:
- KPIs: Total pipeline ($), Weighted pipeline ($), Closed-Won ($), Win rate (%)
- Charts: Revenue by rep (bar), Pipeline by stage (stacked bar), Monthly close rate (line)
- Table: Rep-by-rep leaderboard with quota attainment %
- Conditional formatting: Green if > 100% quota, Yellow if 80-100%, Red if < 80%

## Common Pitfalls

- **Hardcoded dashboard values**: EVERY number on the dashboard MUST be a formula. If you hardcode $1.2M and the data changes, the dashboard is wrong and no one knows.
- **Chart data ranges**: If rows are added to data sheets, chart ranges may not auto-extend. Use dynamic named ranges or Excel Tables.
- **Gridlines**: Turn OFF gridlines on the dashboard sheet. They make it look like a data entry form, not a dashboard.
- **Too many charts**: 3-4 charts maximum. More = visual clutter. Choose the most insightful views.
- **Missing context**: Every KPI needs a comparison (vs last period, vs target, vs industry benchmark). A number without context is meaningless.
- **Print scaling**: Dashboard should fit on one page (landscape A4) when printed. Set fitToPage.

## Code Style

- Build data sheets first, dashboard last (dashboard depends on data sheets)
- Define KPI cell positions as named constants for readability
- Group chart creation code by chart type
- Use consistent chart dimensions (height=12, width=24 for full-width; width=14 for half-width)
- Turn off gridlines as the LAST step (easy to forget)
