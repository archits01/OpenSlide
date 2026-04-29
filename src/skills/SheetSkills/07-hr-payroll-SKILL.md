---
name: xlsx-hr-payroll
description: "Use this skill when the user asks to create, manage, or calculate payroll, salary sheets, leave trackers, attendance records, employee databases, headcount plans, compensation analysis, tax deduction sheets, or any spreadsheet related to human resources and employee management. Trigger on keywords: 'payroll', 'salary', 'leave tracker', 'attendance', 'employee list', 'headcount', 'compensation', 'tax deduction', 'PF', 'ESI', 'TDS', 'CTC', 'gross pay', 'net pay', 'pay slip', 'HR spreadsheet', 'offer letter data', 'appraisal tracker', 'performance review', 'employee database'. Also trigger when the user mentions specific payroll components like 'basic salary', 'HRA', 'DA', 'conveyance', 'professional tax', 'provident fund', 'gratuity'."
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


# HR & Payroll — Complete Skill

## Skills Chain (read these BEFORE starting)

1. **PRIMARY**: `/mnt/skills/public/xlsx/SKILL.md` — Read FIRST. Base rules.
2. **NO additional skills typically needed** — HR data is self-contained. Add deep-research only if the user needs market salary benchmarks for compensation analysis.

## Library Selection

**Use openpyxl** — Payroll sheets are formula-heavy (tax slabs, deductions, conditional calculations) and need precise formatting. Currency formatting, percentage calculations, and multi-sheet references are core requirements.

```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side, Protection
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.utils import get_column_letter
```

## CRITICAL: Sensitive Data Handling

HR and payroll data is highly sensitive. Apply these rules:

1. **Summary sheets should NEVER expose individual salary data** — use aggregates only (average, median, department totals)
2. **Consider sheet protection** for cells containing formulas so users don't accidentally overwrite calculations
3. **PII columns** (PAN numbers, bank accounts, Aadhaar) should be in a separate protected sheet if included
4. **Naming**: Never include employee names in file names shared broadly — use "Payroll_March2026.xlsx" not "Payroll_John_Smith.xlsx"

```python
# Protect formula cells from accidental editing
for row in ws.iter_rows(min_row=2, max_row=max_row):
    for cell in row:
        if cell.value and str(cell.value).startswith('='):
            cell.protection = Protection(locked=True)
ws.protection.sheet = True
ws.protection.password = 'payroll2026'  # Simple protection — not security
```

## Sheet Architecture

### Payroll Calculator

| Sheet Name | Purpose |
|---|---|
| Employee Master | Employee details — name, ID, department, designation, DOJ, bank |
| Salary Structure | CTC breakup — basic, HRA, DA, conveyance, special allowance |
| Monthly Payroll | Monthly calculation — earnings, deductions, net pay |
| Tax Calculation | Annual tax computation with slab-wise breakdown |
| Settings | Tax slabs, PF rate, ESI rate, professional tax slabs, standard deduction |

### Leave Tracker

| Sheet Name | Purpose |
|---|---|
| Leave Balance | Per-employee leave allocation and balance |
| Leave Log | All leave requests with dates and approval status |
| Attendance Summary | Monthly attendance count per employee |

## Column Structure — Monthly Payroll

### Earnings Section
| Column | Header | Formula/Type |
|---|---|---|
| A | Emp ID | Text |
| B | Employee Name | Text |
| C | Department | Dropdown |
| D | Designation | Text |
| E | Working Days | Number (standard: 22 or month-specific) |
| F | Days Worked | Number |
| G | Basic Salary (Monthly) | =Annual Basic / 12 |
| H | HRA | =Basic × HRA% (typically 40-50% of basic) |
| I | Dearness Allowance | =Basic × DA% |
| J | Conveyance Allowance | Fixed or formula |
| K | Special Allowance | =CTC/12 - (Basic + HRA + DA + Conveyance + Employer PF + Employer ESI) |
| L | Gross Earnings | =SUM(G:K) × (Days Worked / Working Days) |

### Deductions Section
| Column | Header | Formula/Type |
|---|---|---|
| M | Employee PF | =MIN(Basic, 15000) × 12% |
| N | Employee ESI | =IF(Gross<=21000, Gross×0.75%, 0) |
| O | Professional Tax | Slab-based (state-specific) |
| P | TDS (Income Tax) | =Annual tax / 12 (from Tax Calculation sheet) |
| Q | Other Deductions | Manual (advances, loans, etc.) |
| R | Total Deductions | =SUM(M:Q) |

### Net Pay
| Column | Header | Formula/Type |
|---|---|---|
| S | Net Pay | =Gross Earnings - Total Deductions |
| T | Bank Account | Text (for payment processing) |
| U | Payment Mode | Dropdown: NEFT / IMPS / Cheque |

## Indian Tax Slab Formulas (New Regime FY 2025-26)

```python
# Settings sheet — Tax Slabs (New Regime)
settings['A1'] = 'Income Tax Slabs — New Regime FY 2025-26'
slabs = [
    ('Up to ₹3,00,000', 0, 300000, 0.00),
    ('₹3,00,001 - ₹7,00,000', 300001, 700000, 0.05),
    ('₹7,00,001 - ₹10,00,000', 700001, 1000000, 0.10),
    ('₹10,00,001 - ₹12,00,000', 1000001, 1200000, 0.15),
    ('₹12,00,001 - ₹15,00,000', 1200001, 1500000, 0.20),
    ('Above ₹15,00,000', 1500001, None, 0.30),
]
# Standard deduction: ₹75,000
# Rebate under 87A: No tax if income <= ₹7,00,000 (new regime)
```

### Tax calculation formula (in Tax Calculation sheet)
```python
# For each employee, calculate annual taxable income and tax
# Taxable Income = Annual CTC - Standard Deduction - Employee PF (Section 80C)
f'=MAX(0, {annual_ctc_cell} - Settings!$B$20 - {annual_pf_cell})'

# Tax computation using nested IF (simplified)
f'=IF({taxable_income}<=300000,0,' \
f'IF({taxable_income}<=700000,(MIN({taxable_income},700000)-300000)*5%,' \
f'IF({taxable_income}<=1000000,20000+(MIN({taxable_income},1000000)-700000)*10%,' \
f'IF({taxable_income}<=1200000,50000+(MIN({taxable_income},1200000)-1000000)*15%,' \
f'IF({taxable_income}<=1500000,80000+(MIN({taxable_income},1500000)-1200000)*20%,' \
f'140000+({taxable_income}-1500000)*30%)))))'

# Add 4% Health & Education Cess
f'={tax_cell}*1.04'

# Monthly TDS = Annual Tax / 12
f'={annual_tax_with_cess}/12'

# Rebate check: If taxable income <= 7,00,000, tax = 0
f'=IF({taxable_income}<=700000,0,{calculated_tax})'
```

## PF and ESI Calculations

### Provident Fund (PF)
```python
# Employee contribution: 12% of Basic (capped at ₹15,000 basic)
f'=ROUND(MIN(G{row},15000)*0.12,0)'

# Employer PF contribution (same amount — NOT shown in payslip as deduction)
# Goes to a separate employer cost sheet
f'=ROUND(MIN(G{row},15000)*0.12,0)'

# Employer EPS (redirected from PF): 8.33% of Basic (capped at ₹15,000)
f'=ROUND(MIN(G{row},15000)*0.0833,0)'
```

### ESI (Employee State Insurance)
```python
# Applicable only if gross salary <= ₹21,000/month
# Employee: 0.75% of gross
# Employer: 3.25% of gross
f'=IF(L{row}<=21000,ROUND(L{row}*0.0075,0),0)'
```

### Professional Tax (Karnataka example)
```python
# Karnataka Professional Tax slabs:
# Gross <= ₹15,000: ₹0
# ₹15,001 - ₹25,000: ₹200/month
# Above ₹25,000: ₹200/month (₹300 in Feb)
f'=IF(L{row}<=15000,0,200)'
# Note: February is ₹300 — handle with an IF on the month
```

## Leave Tracker Formulas

### Leave balance
```python
# Allocated - Used = Balance
f'=C{row}-D{row}'  # C=Allocated, D=Used

# Leave types with separate tracking
# Casual Leave: 12/year
# Sick Leave: 12/year  
# Earned Leave: 15/year (accrues monthly: 1.25/month)
# Comp Off: manual
```

### Attendance calculation
```python
# Days worked = Working days - Leaves taken - Holidays
f'=E{row}-D{row}-F{row}'  # E=Working days, D=Leaves, F=Holidays

# Pro-rated salary
f'=G{row}*(H{row}/E{row})'  # G=Monthly salary, H=Days worked, E=Working days

# LOP (Loss of Pay) days
f'=MAX(0, D{row}-{leave_balance_cell})'  # Leaves taken beyond balance

# LOP deduction
f'=IF({lop_days}>0, (G{row}/E{row})*{lop_days}, 0)'
```

## Formatting Standards

### Currency formatting (Indian Rupees)
```python
INR_FORMAT = '₹#,##0'
INR_FORMAT_DECIMAL = '₹#,##0.00'

# Apply to all salary columns
for col in ['G','H','I','J','K','L','M','N','O','P','Q','R','S']:
    for row in range(2, max_row + 1):
        ws.cell(row=row, column=col_idx).number_format = INR_FORMAT
```

### Percentage formatting
```python
PCT_FORMAT = '0.0%'
# Apply to tax rate, PF rate columns
```

### Date formatting
```python
DATE_FORMAT = 'DD-MMM-YYYY'
# Apply to DOJ, leave dates
```

### Header styling
```python
HEADER_FONT = Font(name='Arial', bold=True, color='FFFFFF', size=10)
HEADER_FILL = PatternFill('solid', fgColor='2D3748')
EARNINGS_FILL = PatternFill('solid', fgColor='276749')  # Green for earnings section
DEDUCTIONS_FILL = PatternFill('solid', fgColor='9B2C2C')  # Red for deductions section
NET_PAY_FILL = PatternFill('solid', fgColor='2B6CB0')  # Blue for net pay
```

## Conditional Formatting

```python
# Highlight negative net pay (deductions exceed earnings — ERROR)
ws.conditional_formatting.add(
    f'S2:S{max_row}',
    CellIsRule(operator='lessThan', formula=['0'],
               fill=PatternFill('solid', fgColor='FED7D7'),
               font=Font(color='9B2C2C', bold=True))
)

# Highlight LOP days
ws.conditional_formatting.add(
    f'{lop_col}2:{lop_col}{max_row}',
    CellIsRule(operator='greaterThan', formula=['0'],
               fill=PatternFill('solid', fgColor='FEFCBF'),
               font=Font(color='975A16', bold=True))
)

# Highlight zero leave balance
ws.conditional_formatting.add(
    f'{balance_col}2:{balance_col}{max_row}',
    CellIsRule(operator='lessThanOrEqual', formula=['0'],
               fill=PatternFill('solid', fgColor='FED7D7'),
               font=Font(color='9B2C2C'))
)
```

## Recalculation — MANDATORY

Payroll is the highest-stakes spreadsheet domain. Errors mean incorrect pay, tax non-compliance, or legal issues. ALWAYS recalculate and verify.

```bash
python scripts/recalc.py output.xlsx 30
```

### Verification checklist (CRITICAL):
- [ ] Gross Pay = Sum of all earnings components
- [ ] Net Pay = Gross Pay - Total Deductions (must be positive for all employees)
- [ ] PF calculation: 12% of MIN(Basic, 15000) — not 12% of gross
- [ ] ESI: Applied only when gross <= ₹21,000
- [ ] Tax: Verify with 2-3 sample employees manually
- [ ] Pro-rating: Part-month employees have salary proportional to days worked
- [ ] Total payroll = Sum of all Net Pay values (cross-check with expected total)
- [ ] No #DIV/0! errors from zero working days
- [ ] No negative values anywhere except LOP deductions

## Real-World Examples

### Example 1: Monthly Payroll for 20 Employees
A startup runs monthly payroll:
- Employee master: 20 employees across Engineering, Sales, Operations
- CTC range: ₹4L to ₹25L per annum
- Structure: Basic (40% of CTC), HRA (50% of Basic), Special Allowance (remaining)
- Deductions: PF, Professional Tax, TDS
- Output: Net pay per employee, total payout, bank transfer file format

### Example 2: Leave Tracker
HR tracks leave for the team:
- Leave types: CL (12), SL (12), EL (15), Comp Off
- Monthly view: Calendar-style grid with leave markers
- Balance auto-update: Allocated - Used
- Carry forward rules: EL carries forward (max 30), CL/SL lapse at year end
- Reports: Department-wise leave utilization, absenteeism rate

### Example 3: Headcount Planning Model
A growing company plans hiring:
- Current headcount by department and level
- Planned hires: Month, role, level, expected CTC
- Cost projection: Monthly payroll cost with new hires phased in
- Total employee cost: Salary + PF (employer) + ESI (employer) + gratuity provision
- Attrition modeling: Assumed attrition rate × average replacement cost

### Example 4: Internship Stipend Tracker
A company manages intern payments:
- Columns: Intern Name, Start Date, End Date, Monthly Stipend, Days Worked, Pro-rated Amount, Payment Status
- Contract terms: Stipend amount, notice period, IP assignment
- Payment calculation: Monthly stipend × (days worked / working days in month)
- Status tracking: Pending, Paid, Disputed

## Common Pitfalls

- **PF ceiling**: PF is calculated on Basic salary capped at ₹15,000 — NOT on total gross. This is the most common payroll error.
- **ESI threshold**: ESI stops applying once gross exceeds ₹21,000. Don't apply it to all employees.
- **Tax regime**: India has Old and New tax regimes. ALWAYS ask which regime the company follows. Default to New Regime for FY 2025-26+.
- **Professional tax**: Varies by state (Karnataka, Maharashtra, etc.). Use the correct state's slabs.
- **February**: Professional tax may have a different amount in February (e.g., ₹300 vs ₹200 in Karnataka).
- **Rounding**: Round PF, ESI, and tax to nearest rupee — fractional paisa causes reconciliation issues.
- **13th month / bonus**: Some companies pay 13th month salary or performance bonus — handle as separate line items, not part of monthly CTC.

## Code Style

- Separate earnings and deductions sections with clear visual dividers (colored header rows)
- Use green headers for earnings columns, red for deductions, blue for net pay
- Define all rates (PF %, ESI %, tax slabs) in the Settings sheet — NEVER hardcode in formulas
- Include a "Payroll Summary" row at the bottom: total earnings, total deductions, total net pay
- Add cell comments explaining complex formulas (tax calculation, pro-rating logic)
