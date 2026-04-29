---
name: xlsx-financial-models
description: "Use this skill when the user asks to create, edit, or analyze a financial model, budget, forecast, valuation, or any spreadsheet involving revenue projections, cost structures, cash flows, P&L statements, balance sheets, DCF models, LBO models, cap tables, unit economics, scenario analysis, sensitivity tables, or any file where money flows through formulas. Trigger on keywords: 'financial model', 'budget', 'forecast', 'projection', 'DCF', 'valuation', 'P&L', 'income statement', 'balance sheet', 'cash flow', 'cap table', 'unit economics', 'burn rate', 'runway', 'revenue model', 'cost model', 'sensitivity analysis', 'scenario analysis', 'LBO', 'merger model', '3-statement model'. Also trigger when the user provides raw financial data and asks to 'model it', 'project it', or 'build a forecast'."
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


# Financial Models & Budgets — Complete Skill

## Skills Chain (read these BEFORE starting)

1. **PRIMARY**: `/mnt/skills/public/xlsx/SKILL.md` — Read this FIRST. It contains the base spreadsheet rules that apply to ALL Excel files.
2. **OPTIONAL**: `/mnt/skills/user/deep-research/SKILL.md` — Read this IF the user needs market data, industry benchmarks, comparable company data, or any external data points to populate the model.

## Library Selection

**Always use openpyxl** for financial models. Never pandas alone.

- openpyxl gives you: cell-level formatting, formula insertion, color coding, named ranges, conditional formatting, multiple sheets, freeze panes, print areas
- pandas is only used IF the user provides a raw data file (CSV, JSON) that needs cleaning BEFORE being loaded into the model — in that case, use pandas to clean, then openpyxl to build the model

```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side, numbers
from openpyxl.utils import get_column_letter
```

## Sheet Architecture

Financial models MUST have a clear sheet structure. Minimum viable structure:

| Sheet Name | Purpose | Content |
|---|---|---|
| Assumptions | All inputs live here | Growth rates, margins, tax rates, discount rates, multiples — all in blue text |
| Income Statement | P&L projection | Revenue → COGS → Gross Profit → OpEx → EBITDA → Net Income |
| Balance Sheet | Assets = Liabilities + Equity | Current/Non-current assets, current/non-current liabilities, equity |
| Cash Flow | Operating + Investing + Financing | Derived from P&L and BS changes |
| Valuation | DCF or comps | WACC, terminal value, enterprise value, equity value |
| Sensitivity | What-if analysis | Data tables varying 2 assumptions |

For simpler models (budgets, single-purpose forecasts), reduce to:

| Sheet Name | Purpose |
|---|---|
| Assumptions | All inputs |
| Model | Core calculations |
| Summary | Key outputs and charts |

## Color Coding Standards — MANDATORY

These are industry-standard investment banking conventions. Never deviate unless the user's existing template uses different conventions.

```python
# Define color constants at the top of every financial model script
BLUE_INPUT = Font(name='Arial', color='0000FF')           # Hardcoded inputs users will change
BLACK_FORMULA = Font(name='Arial', color='000000')         # ALL formulas and calculations
GREEN_LINK = Font(name='Arial', color='008000')            # Links from other worksheets
RED_EXTERNAL = Font(name='Arial', color='FF0000')          # External links to other files
YELLOW_ATTENTION = PatternFill('solid', fgColor='FFFF00')  # Key assumptions needing review

# Section headers
SECTION_HEADER = Font(name='Arial', bold=True, size=11, color='000000')
SECTION_FILL = PatternFill('solid', fgColor='D9E1F2')

# Borders for financial tables
THIN_BORDER = Border(
    bottom=Side(style='thin', color='000000')
)
DOUBLE_BORDER = Border(
    bottom=Side(style='double', color='000000')  # Use for final totals (Net Income, Total Assets)
)
```

### When to use each color:
- **Blue (0,0,255)**: Revenue growth rate of 15% → this is a user assumption, make it blue
- **Black (0,0,0)**: =B5*(1+$B$3) → this is a formula, make it black
- **Green (0,128,0)**: ='Income Statement'!B25 → pulling Net Income into Cash Flow sheet
- **Red (255,0,0)**: ='[ComparableCompanies.xlsx]Sheet1'!B5 → pulling from another file
- **Yellow background**: Tax rate cell that the user MUST update for their jurisdiction

## Number Formatting Standards — MANDATORY

```python
# Currency — ALWAYS specify units in the header, not in the format
# Header says "Revenue ($mm)" or "Revenue (₹ Cr)"
CURRENCY_FORMAT = '$#,##0;($#,##0);"-"'
CURRENCY_FORMAT_DECIMAL = '$#,##0.0;($#,##0.0);"-"'
CURRENCY_FORMAT_INR = '₹#,##0;(₹#,##0);"-"'

# Percentages — one decimal place
PERCENT_FORMAT = '0.0%;(0.0%);"-"'

# Multiples — one decimal with 'x' suffix
MULTIPLE_FORMAT = '0.0"x"'

# Years — MUST be text to prevent "2,024" formatting
# Write years as strings: sheet['B3'] = '2024' (not sheet['B3'] = 2024)

# Negative numbers — ALWAYS parentheses, never minus sign
# ($1,234) not -$1,234
# (5.0%) not -5.0%

# Zeros — display as dash "-", not "0" or "$0"
# The format string ;"-" handles this: positive;negative;zero
```

### Applying number formats in openpyxl:
```python
cell = sheet['B5']
cell.value = 1500000
cell.number_format = '$#,##0;($#,##0);"-"'
cell.font = BLUE_INPUT  # It's a hardcoded input

cell2 = sheet['B6']
cell2.value = '=B5*(1+Assumptions!$B$3)'
cell2.number_format = '$#,##0;($#,##0);"-"'
cell2.font = BLACK_FORMULA  # It's a formula
```

## Formula Construction Rules — CRITICAL

### Rule 1: NEVER hardcode values in formulas
```python
# ❌ WRONG
sheet['C5'] = '=B5*1.15'  # Where did 15% come from? Unauditable.

# ✅ CORRECT
assumptions['B3'] = 0.15  # Growth rate assumption — BLUE text
assumptions['B3'].font = BLUE_INPUT
sheet['C5'] = '=B5*(1+Assumptions!$B$3)'  # References the assumption cell
sheet['C5'].font = BLACK_FORMULA
```

### Rule 2: Assumptions in separate cells with labels
```python
# Assumptions sheet layout
assumptions['A1'] = 'ASSUMPTIONS'
assumptions['A1'].font = SECTION_HEADER

assumptions['A3'] = 'Revenue Growth Rate'
assumptions['B3'] = 0.15
assumptions['B3'].font = BLUE_INPUT
assumptions['B3'].number_format = '0.0%'

assumptions['A4'] = 'Gross Margin'
assumptions['B4'] = 0.65
assumptions['B4'].font = BLUE_INPUT
assumptions['B4'].number_format = '0.0%'

assumptions['A5'] = 'Tax Rate'
assumptions['B5'] = 0.25
assumptions['B5'].font = BLUE_INPUT
assumptions['B5'].number_format = '0.0%'
assumptions['B5'].fill = YELLOW_ATTENTION  # User MUST verify for their jurisdiction
```

### Rule 3: Use absolute references for assumptions, relative for projections
```python
# $B$3 = absolute (doesn't change when formula is dragged across columns)
# B5 = relative (shifts as you copy across projection years)
sheet['C5'] = '=B5*(1+Assumptions!$B$3)'  # Drag this from C to G for 5 years
```

### Rule 4: Cross-sheet references use GREEN text
```python
# In Cash Flow sheet, pulling Net Income from Income Statement
cf_sheet['B5'] = "='Income Statement'!B25"
cf_sheet['B5'].font = GREEN_LINK
```

### Rule 5: Document EVERY hardcode
```python
# If you must hardcode a number (e.g., historical actual), document the source
sheet['B5'] = 150000000  # Historical revenue
sheet['B5'].font = BLUE_INPUT
sheet['B5'].comment = openpyxl.comments.Comment(
    'Source: Company 10-K, FY2024, Page 45, Revenue Note',
    'Claude'
)
```

## Step-by-Step Workflow

### Step 1: Understand the model structure
Before writing any code, determine:
- What type of model? (3-statement, DCF, budget, single-purpose forecast)
- How many projection years? (typically 3-5 for operating models, 5-10 for DCF)
- What are the key assumptions? (growth rates, margins, capex, working capital)
- Does the user have historical data or starting from scratch?

### Step 2: Create the workbook with proper sheet structure
```python
wb = Workbook()

# Create sheets in logical order
assumptions = wb.active
assumptions.title = 'Assumptions'

income_stmt = wb.create_sheet('Income Statement')
balance_sheet = wb.create_sheet('Balance Sheet')
cash_flow = wb.create_sheet('Cash Flow')
```

### Step 3: Build the Assumptions sheet first
All inputs go here. Every cell that contains a number the user might want to change gets BLUE text. Label every assumption clearly.

### Step 4: Build projection sheets with formulas
Every calculation cell must contain an Excel formula, not a Python-calculated value. Use cell references back to Assumptions sheet.

### Step 5: Add formatting
Apply number formats, color coding, borders, section headers, column widths, freeze panes.

```python
# Freeze panes — lock row labels and header row
sheet.freeze_panes = 'C3'  # Freezes columns A-B and rows 1-2

# Column widths
sheet.column_dimensions['A'].width = 30  # Row labels
for col in range(2, 8):
    sheet.column_dimensions[get_column_letter(col)].width = 15  # Data columns

# Print area (for PDF export)
sheet.print_area = 'A1:G30'
```

### Step 6: Save and recalculate — MANDATORY
```bash
python scripts/recalc.py output.xlsx 30
```

### Step 7: Verify zero formula errors
The recalc script returns JSON. If `status` is `errors_found`, fix every error before delivering.

```json
{
  "status": "errors_found",
  "total_errors": 2,
  "total_formulas": 87,
  "error_summary": {
    "#REF!": {
      "count": 1,
      "locations": ["Income Statement!C15"]
    },
    "#DIV/0!": {
      "count": 1,
      "locations": ["Assumptions!B20"]
    }
  }
}
```

Fix the errors, save again, recalculate again, verify zero errors.

## Recalculation — MANDATORY for Financial Models

Financial models are formula-heavy. openpyxl writes formulas as text strings — it does NOT calculate values. Without recalculation, every formula cell shows the formula text instead of the computed number.

```bash
# Run recalculation
python scripts/recalc.py output.xlsx 30

# What it does:
# 1. Opens the file in LibreOffice
# 2. Recalculates ALL formulas in ALL sheets
# 3. Saves the file with computed values
# 4. Scans every cell for errors (#REF!, #DIV/0!, #VALUE!, #N/A, #NAME?)
# 5. Returns JSON with error count and locations
```

### After recalc, verify:
- [ ] Total errors = 0
- [ ] Open the file and spot-check 3-5 formula cells — do the numbers make sense?
- [ ] Check cross-sheet references — does Cash Flow sheet correctly pull from Income Statement?
- [ ] Check assumption sensitivity — change one assumption mentally and verify the formula chain would propagate correctly

## Formula Verification Checklist

### Before delivery, verify:
- [ ] Every blue cell is actually an input (not a formula)
- [ ] Every black cell is actually a formula (not a hardcode)
- [ ] Every green cell correctly references another sheet
- [ ] No circular references (LibreOffice will warn about these)
- [ ] Years are formatted as text ("2024" not "2,024")
- [ ] All currency shows proper format with units in headers
- [ ] Negatives show in parentheses
- [ ] Zeros show as dashes
- [ ] Totals have double-border bottom (Net Income, Total Assets, etc.)
- [ ] Subtotals have single-border bottom (Gross Profit, Operating Income, etc.)
- [ ] Freeze panes are set so row labels and headers stay visible while scrolling

## Common Formulas in Financial Models

```python
# Revenue projection
'=B5*(1+Assumptions!$B$3)'

# COGS (as % of revenue)
'=B5*Assumptions!$B$4'

# Gross Profit
'=B5-B6'

# Gross Margin %
'=IF(B5=0,"-",B7/B5)'

# Operating Income
'=B7-B8-B9-B10'

# Tax
'=IF(B12>0,B12*Assumptions!$B$5,0)'  # Only tax on positive income

# Net Income
'=B12-B13'

# YoY Growth
'=IF(B5=0,"-",(C5-B5)/B5)'

# WACC (in DCF)
'=Assumptions!$B$10*Assumptions!$B$11*(1-Assumptions!$B$5)+Assumptions!$B$12*Assumptions!$B$13'

# Terminal Value (Gordon Growth)
'=G14*(1+Assumptions!$B$15)/(Assumptions!$B$16-Assumptions!$B$15)'

# NPV of cash flows
'=NPV(Assumptions!$B$16,C14:G14)'

# Sensitivity table (Data Table)
# Use openpyxl to set up the grid, then formulas reference the intersection
```

## Real-World Examples

### Example 1: Startup Financial Projections for Investor Deck
A startup founder asks: "Build me a 5-year financial model for my SaaS business"
- Assumptions sheet: MRR growth, churn rate, ARPU, CAC, LTV, headcount plan, salary costs
- P&L: MRR → ARR → Net Revenue, COGS (hosting + support), Gross Profit, S&M, R&D, G&A, EBITDA
- Cash Flow: Operating cash flow, capex, fundraising rounds
- Metrics sheet: LTV/CAC ratio, payback period, burn rate, runway in months
- All formulas. All blue inputs. Summary dashboard with key charts.

### Example 2: Department Budget with Variance Analysis
A finance team asks: "Create an annual budget tracker with monthly actuals vs budget"
- Assumptions: Annual budget allocations by category, monthly phasing %
- Budget sheet: 12 monthly columns × expense categories, budget per cell = annual × phasing %
- Actuals sheet: Same structure, filled in monthly with actual spend
- Variance sheet: =Actuals-Budget for each cell, conditional formatting (red if over, green if under)
- Summary: YTD spend vs YTD budget, full-year forecast = YTD actuals + remaining budget

### Example 3: DCF Valuation
An analyst asks: "Build a DCF model for a company with these financials"
- Assumptions: Revenue growth, EBITDA margin, tax rate, capex % of revenue, NWC days, WACC, terminal growth
- Projections: 5-year revenue → EBITDA → NOPAT → FCF
- Terminal value: Gordon Growth method
- DCF: NPV of projected FCFs + PV of terminal value = Enterprise Value
- Bridge: EV → subtract net debt → Equity Value → divide by shares = Price per share
- Sensitivity: 2-way table varying WACC (rows) and terminal growth (columns)

### Example 4: CoLeads AI Infrastructure Quotation
A consulting firm asks: "Build a pricing model for a GPU cluster deployment"
- Assumptions: Hardware unit costs (GPUs, NAS, switches), quantities per tier, GST rate, margin %
- Tier 1 (Multi-campus): Itemized hardware × qty × unit cost, subtotal, GST, grand total ~₹19Cr
- Tier 2 (Single-campus): Same structure, fewer quantities, grand total ~₹14Cr
- Comparison sheet: Side-by-side tier comparison with delta
- All prices in ₹ Cr format, GST calculated as formulas

### Example 5: Burn Rate and Runway Calculator
A startup CEO asks: "How long will our money last?"
- Assumptions: Current cash balance, monthly revenue, monthly expenses by category, growth rates
- Monthly projection: 24-month cash flow forecast
- Runway calculation: =MATCH(0, cash_balance_row, -1) to find when cash hits zero
- Scenario analysis: Base case, best case (higher growth), worst case (no growth + higher burn)
- Chart: Cash balance over time with runway marker

## Code Style

- Write minimal Python — no unnecessary comments, no verbose variable names
- Group all style constants at the top of the script
- Build one sheet at a time in logical order
- Add formatting AFTER all data and formulas are in place
- Save once at the end, recalculate once after saving
