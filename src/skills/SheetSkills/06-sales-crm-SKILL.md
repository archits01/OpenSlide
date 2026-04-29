---
name: xlsx-sales-crm
description: "Use this skill when the user asks to create, manage, or analyze a sales pipeline, CRM tracker, lead list, deal tracker, commission calculator, sales forecast, or any spreadsheet tracking customer relationships, deals, revenue, and sales team performance. Trigger on keywords: 'sales pipeline', 'CRM', 'deal tracker', 'leads', 'prospects', 'opportunities', 'pipeline', 'conversion rate', 'win rate', 'commission', 'sales forecast', 'quota', 'territory', 'funnel', 'deal flow', 'outbound', 'cold outreach', 'follow-up tracker', 'sales report'. Also trigger when the user says 'track my deals', 'sales spreadsheet', or 'how is the pipeline'."
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


# Sales / CRM Data — Complete Skill

## Skills Chain (read these BEFORE starting)

1. **PRIMARY**: `/mnt/skills/public/xlsx/SKILL.md` — Read FIRST. Base rules.
2. **NO additional skills typically needed** — CRM data is usually self-contained. Add deep-research only if the user needs industry benchmarks for conversion rates or quota setting.

## Library Selection

**Use pandas for data cleaning + openpyxl for the final formatted output.**

Sales data often comes from CRM exports (Salesforce, HubSpot, Pipedrive) as messy CSVs that need cleaning before analysis. pandas handles the cleaning; openpyxl handles the professional output.

```python
import pandas as pd
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.formatting.rule import CellIsRule, FormulaRule, ColorScaleRule
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.chart import BarChart, PieChart, Reference
from openpyxl.utils import get_column_letter
```

## Sheet Architecture

### Sales Pipeline Tracker

| Sheet Name | Purpose |
|---|---|
| Pipeline | Master deal list with all active opportunities |
| Won Deals | Archive of closed-won deals |
| Lost Deals | Archive of closed-lost deals with loss reasons |
| Dashboard | Summary metrics, charts, pipeline value by stage |
| Reps | Sales rep performance summary |
| Settings | Dropdown values (stages, sources, reps), commission rates |

### Lead Tracker (simpler)

| Sheet Name | Purpose |
|---|---|
| Leads | All leads with status and follow-up dates |
| Dashboard | Conversion funnel, lead sources, response rates |

## Column Structure — Pipeline Tracker

| Column | Header | Width | Type | Purpose |
|---|---|---|---|---|
| A | Deal ID | 10 | Text | Unique ID: D-001, D-002 |
| B | Company Name | 28 | Text | Prospect company |
| C | Contact Name | 20 | Text | Primary contact |
| D | Contact Email | 25 | Text | Email |
| E | Deal Name | 30 | Text | Opportunity description |
| F | Deal Value | 14 | Currency | Expected revenue |
| G | Stage | 16 | Dropdown | Prospecting → Qualified → Proposal → Negotiation → Closed Won → Closed Lost |
| H | Probability | 10 | Percentage | Win likelihood (auto-set by stage or manual) |
| I | Weighted Value | 14 | Formula | =Deal Value × Probability |
| J | Sales Rep | 16 | Dropdown | Assigned rep |
| K | Lead Source | 16 | Dropdown | Inbound, Outbound, Referral, Event, Website |
| L | Created Date | 14 | Date | When deal entered pipeline |
| M | Last Activity | 14 | Date | Most recent touchpoint |
| N | Expected Close | 14 | Date | Target close date |
| O | Days in Pipeline | 12 | Formula | =TODAY()-L |
| P | Days Since Activity | 12 | Formula | =TODAY()-M |
| Q | Next Step | 35 | Text | Next action required |
| R | Notes | 40 | Text | Context, objections, history |

## Pipeline Stages and Default Probabilities

```python
STAGES = {
    'Prospecting': 0.10,
    'Qualified': 0.25,
    'Proposal Sent': 0.50,
    'Negotiation': 0.75,
    'Verbal Commit': 0.90,
    'Closed Won': 1.00,
    'Closed Lost': 0.00,
}
```

### Stage dropdown
```python
stage_validation = DataValidation(
    type='list',
    formula1='"Prospecting,Qualified,Proposal Sent,Negotiation,Verbal Commit,Closed Won,Closed Lost"',
    allow_blank=False
)
ws.add_data_validation(stage_validation)
stage_validation.add(f'G2:G{max_row}')
```

### Auto-probability based on stage
```python
# IF-chain that sets probability based on stage
f'=IF(G{row}="Prospecting",10%,IF(G{row}="Qualified",25%,IF(G{row}="Proposal Sent",50%,IF(G{row}="Negotiation",75%,IF(G{row}="Verbal Commit",90%,IF(G{row}="Closed Won",100%,0%))))))'
```

## Conditional Formatting — CRITICAL for Sales

### Stage-based coloring
```python
stage_colors = {
    'Prospecting': ('E2E8F0', '4A5568'),     # Grey
    'Qualified': ('BEE3F8', '2B6CB0'),        # Blue
    'Proposal Sent': ('FEFCBF', '975A16'),    # Yellow
    'Negotiation': ('FEEBC8', '9C4221'),      # Orange
    'Verbal Commit': ('C6F6D5', '276749'),    # Green
    'Closed Won': ('276749', 'FFFFFF'),        # Dark green, white text
    'Closed Lost': ('FED7D7', '9B2C2C'),      # Red
}

for stage, (bg, fg) in stage_colors.items():
    ws.conditional_formatting.add(
        f'G2:G{max_row}',
        CellIsRule(operator='equal', formula=[f'"{stage}"'],
                   fill=PatternFill('solid', fgColor=bg),
                   font=Font(color=fg, bold=True))
    )
```

### Stale deal highlighting (no activity in 14+ days)
```python
ws.conditional_formatting.add(
    f'P2:P{max_row}',
    CellIsRule(operator='greaterThanOrEqual', formula=['14'],
               fill=PatternFill('solid', fgColor='FED7D7'),
               font=Font(color='9B2C2C', bold=True))
)
```

### High-value deal highlighting (top 20% by value)
```python
ws.conditional_formatting.add(
    f'F2:F{max_row}',
    FormulaRule(
        formula=[f'F2>=PERCENTILE($F$2:$F${max_row},0.8)'],
        fill=PatternFill('solid', fgColor='C6F6D5'),
        font=Font(bold=True)
    )
)
```

### Overdue expected close date
```python
ws.conditional_formatting.add(
    f'N2:N{max_row}',
    FormulaRule(
        formula=[f'AND(N2<TODAY(),$G2<>"Closed Won",$G2<>"Closed Lost")'],
        fill=PatternFill('solid', fgColor='FED7D7'),
        font=Font(color='9B2C2C'))
)
```

## Formula Patterns

### Weighted pipeline value
```python
f'=F{row}*H{row}'  # Deal Value × Probability
```

### Days in pipeline
```python
f'=IF(L{row}="","",TODAY()-L{row})'
```

### Days since last activity
```python
f'=IF(M{row}="","",TODAY()-M{row})'
```

### Dashboard — Pipeline metrics
```python
# Total pipeline value (excluding closed)
f'=SUMIFS(Pipeline!F2:F{max_row},Pipeline!G2:G{max_row},"<>Closed Won",Pipeline!G2:G{max_row},"<>Closed Lost")'

# Weighted pipeline value
f'=SUMIFS(Pipeline!I2:I{max_row},Pipeline!G2:G{max_row},"<>Closed Won",Pipeline!G2:G{max_row},"<>Closed Lost")'

# Pipeline value by stage
f'=SUMIF(Pipeline!G2:G{max_row},"Prospecting",Pipeline!F2:F{max_row})'
f'=SUMIF(Pipeline!G2:G{max_row},"Qualified",Pipeline!F2:F{max_row})'
f'=SUMIF(Pipeline!G2:G{max_row},"Proposal Sent",Pipeline!F2:F{max_row})'
f'=SUMIF(Pipeline!G2:G{max_row},"Negotiation",Pipeline!F2:F{max_row})'

# Deal count by stage
f'=COUNTIF(Pipeline!G2:G{max_row},"Prospecting")'

# Average deal size
f'=AVERAGEIF(Pipeline!G2:G{max_row},"Closed Won",Pipeline!F2:F{max_row})'

# Win rate
f'=COUNTIF(Pipeline!G2:G{max_row},"Closed Won")/(COUNTIF(Pipeline!G2:G{max_row},"Closed Won")+COUNTIF(Pipeline!G2:G{max_row},"Closed Lost"))'

# Average sales cycle (days from created to closed won)
# Requires a helper column in Won Deals sheet: =Close Date - Created Date
f'=AVERAGE(WonDeals!O2:O{won_max_row})'

# Pipeline velocity
# = (Number of Opportunities × Win Rate × Average Deal Size) / Average Sales Cycle
f'=({deal_count_cell}*{win_rate_cell}*{avg_deal_cell})/{avg_cycle_cell}'
```

### Conversion funnel
```python
# Stage-to-stage conversion rates
f'=COUNTIF(G2:G{max_row},"Qualified")/COUNTIF(G2:G{max_row},"Prospecting")'
f'=COUNTIF(G2:G{max_row},"Proposal Sent")/COUNTIF(G2:G{max_row},"Qualified")'
f'=COUNTIF(G2:G{max_row},"Negotiation")/COUNTIF(G2:G{max_row},"Proposal Sent")'
f'=COUNTIF(G2:G{max_row},"Closed Won")/COUNTIF(G2:G{max_row},"Negotiation")'
```

### Commission calculator
```python
# Simple: flat rate
f'=IF(G{row}="Closed Won",F{row}*Settings!$B$3,0)'  # B3 = commission rate (e.g., 10%)

# Tiered: different rates for different thresholds
f'=IF(G{row}<>"Closed Won",0,IF(F{row}>=100000,F{row}*0.12,IF(F{row}>=50000,F{row}*0.10,F{row}*0.08)))'

# Accelerator: higher rate after hitting quota
# Requires a running total column
f'=IF({running_total_cell}>=Settings!$B$5,F{row}*Settings!$B$4,F{row}*Settings!$B$3)'
# B5 = quota threshold, B4 = accelerated rate, B3 = base rate
```

### Rep performance summary
```python
# Revenue per rep
f'=SUMIFS(Pipeline!F2:F{max_row},Pipeline!J2:J{max_row},A{rep_row},Pipeline!G2:G{max_row},"Closed Won")'

# Deals won per rep
f'=COUNTIFS(Pipeline!J2:J{max_row},A{rep_row},Pipeline!G2:G{max_row},"Closed Won")'

# Win rate per rep
f'=COUNTIFS(Pipeline!J2:J{max_row},A{rep_row},Pipeline!G2:G{max_row},"Closed Won")/(COUNTIFS(Pipeline!J2:J{max_row},A{rep_row},Pipeline!G2:G{max_row},"Closed Won")+COUNTIFS(Pipeline!J2:J{max_row},A{rep_row},Pipeline!G2:G{max_row},"Closed Lost"))'

# Quota attainment
f'={revenue_cell}/Settings!$B$2'  # B2 = quota target
```

## Charts

```python
# Pie chart: Pipeline value by stage
pie = PieChart()
pie.title = 'Pipeline by Stage'
pie.style = 10
data = Reference(dashboard, min_col=2, min_row=stage_start, max_row=stage_end)
cats = Reference(dashboard, min_col=1, min_row=stage_start, max_row=stage_end)
pie.add_data(data)
pie.set_categories(cats)
dashboard.add_chart(pie, 'E2')

# Bar chart: Revenue by rep
bar = BarChart()
bar.title = 'Revenue by Sales Rep'
bar.style = 10
data = Reference(reps_sheet, min_col=2, min_row=1, max_row=reps_sheet.max_row)
cats = Reference(reps_sheet, min_col=1, min_row=2, max_row=reps_sheet.max_row)
bar.add_data(data, titles_from_data=True)
bar.set_categories(cats)
reps_sheet.add_chart(bar, 'E2')
```

## Recalculation — MANDATORY

Sales pipeline trackers are formula-heavy. Every metric (weighted value, days in pipeline, win rate, conversion rates, commission) must be recalculated.

```bash
python scripts/recalc.py output.xlsx 30
```

### Verify after recalc:
- [ ] Weighted values = Deal Value × Probability for each row
- [ ] Days in pipeline reflects today's date correctly
- [ ] Win rate denominator is correct (won + lost, not total pipeline)
- [ ] Commission calculations match expected rates
- [ ] Summary counts match manual spot-check of pipeline
- [ ] Conversion funnel percentages are plausible (should decrease down the funnel)
- [ ] No division by zero errors in rate calculations

## Real-World Examples

### Example 1: B2B SaaS Sales Pipeline
A SaaS startup tracks enterprise deals:
- 40 active opportunities across 4 reps
- Stages: Demo Scheduled → Trial → Proposal → Legal Review → Closed Won/Lost
- Metrics: MRR (not one-time revenue), ACV, pipeline coverage ratio (pipeline/quota)
- Commission: 10% base, 15% accelerator above 120% quota attainment

### Example 2: Outbound Campaign Tracker
A BD team tracks cold outreach campaigns:
- Columns: Contact, Company, Email, LinkedIn, Campaign, Sent Date, Opened?, Replied?, Meeting Booked?, Outcome
- Formulas: Open rate = COUNTIF(Opened,"Yes")/COUNTA(Sent), Reply rate, Meeting rate
- Summary: Funnel metrics per campaign, best-performing templates, optimal send times

### Example 3: Commission Calculator
A sales manager needs to calculate monthly commissions:
- Input: Deal list with rep, close date, deal value, product line
- Tiers: 8% on first $50K, 10% on $50K-$100K, 12% above $100K
- Accelerator: 1.5× rate after 100% quota attainment
- Output: Per-rep commission statement with deal-by-deal breakdown, total payout
- Clawback: Deduction column for churned deals within 90 days

### Example 4: Lead Scoring Sheet
A marketing team scores inbound leads:
- Scoring criteria: Company size (1-5), Industry fit (1-5), Budget indicated (1-5), Engagement level (1-5), Title seniority (1-5)
- Weighted score: =SUMPRODUCT(scores, weights)
- Auto-classification: =IF(score>=4,"Hot",IF(score>=2.5,"Warm","Cold"))
- Routing: =IF(score>=4,"Sales Team",IF(score>=2.5,"SDR","Nurture"))

## Common Pitfalls

- **Win rate denominator**: Win rate = Won / (Won + Lost), NOT Won / Total Pipeline. Active deals are not in the denominator.
- **Date math**: "Days in pipeline" uses TODAY() which changes daily — warn the user
- **Currency**: Ensure all deal values are in the same currency. If multi-currency, add a currency column and conversion rate
- **Duplicate deals**: Add a helper column to flag duplicate company names in the pipeline
- **Pipeline hygiene**: Stale deals (no activity 30+ days) should be flagged — they inflate pipeline value artificially

## Code Style

- Define stage colors and probabilities as dictionaries at the top
- Use consistent column references — define as constants if the column order might change
- Put commission rate logic in the Settings sheet, not hardcoded in formulas
- Format currency columns consistently (same number of decimal places, same symbol)
