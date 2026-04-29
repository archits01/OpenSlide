---
name: xlsx-inventory-assets
description: "Use this skill when the user asks to create or manage an inventory list, asset register, equipment tracker, stock list, warehouse inventory, IT asset management sheet, license tracker, or any spreadsheet that catalogs physical or digital items with quantities, values, locations, and statuses. Trigger on keywords: 'inventory', 'asset register', 'asset list', 'equipment tracker', 'stock list', 'warehouse', 'IT assets', 'license tracker', 'serial numbers', 'depreciation', 'asset management', 'catalog', 'parts list', 'BOM' (bill of materials), 'fixed assets', 'consumables'. Also trigger when the user says 'track these items', 'list of equipment', or 'what do we have'."
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


# Inventory & Asset Lists — Complete Skill

## Skills Chain (read these BEFORE starting)

1. **PRIMARY**: `/mnt/skills/public/xlsx/SKILL.md` — Read FIRST. Base spreadsheet rules.
2. **NO additional skills typically needed** — Inventory trackers are self-contained.

## Library Selection

**Use openpyxl** — inventory sheets need data validation dropdowns, conditional formatting, structured formulas, and professional formatting.

```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.formatting.rule import CellIsRule, FormulaRule
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.utils import get_column_letter
import datetime
```

## Sheet Architecture

### Standard inventory tracker

| Sheet Name | Purpose |
|---|---|
| Inventory | Master list of all items |
| Summary | Category totals, value summary, status breakdown |
| Settings | Dropdown values (categories, locations, statuses), depreciation rates |

### IT asset register (more complex)

| Sheet Name | Purpose |
|---|---|
| Hardware | Laptops, monitors, servers, peripherals |
| Software | Licenses, subscriptions, seats |
| Network | Switches, routers, access points, cabling |
| Summary | Total asset value, depreciation schedule, renewal alerts |
| Settings | Dropdown values, depreciation rates per category |

## Column Structure — Standard Inventory

| Column | Header | Width | Type | Purpose |
|---|---|---|---|---|
| A | Asset ID | 12 | Text (auto-format) | Unique identifier: INV-001, IT-001, SW-001 |
| B | Item Name | 35 | Text | Description of the asset |
| C | Category | 18 | Dropdown | Type of asset (Hardware, Software, Furniture, etc.) |
| D | Sub-Category | 18 | Dropdown | Specific type (Laptop, Monitor, Server, etc.) |
| E | Brand / Vendor | 18 | Text | Manufacturer or vendor name |
| F | Model / Version | 20 | Text | Specific model number or software version |
| G | Serial Number | 22 | Text | Unique serial or license key |
| H | Quantity | 10 | Number | Count (1 for unique assets, N for consumables) |
| I | Unit Cost | 14 | Currency | Purchase price per unit |
| J | Total Value | 14 | Formula | =H*I (quantity × unit cost) |
| K | Purchase Date | 14 | Date | When acquired |
| L | Warranty Expiry | 14 | Date | End of warranty period |
| M | Location | 18 | Dropdown | Physical location (Office A, Server Room, etc.) |
| N | Assigned To | 18 | Text / Dropdown | Person or department responsible |
| O | Status | 14 | Dropdown | Active / In Repair / Retired / Disposed |
| P | Condition | 12 | Dropdown | Excellent / Good / Fair / Poor |
| Q | Depreciation Rate | 12 | Percentage | Annual depreciation % |
| R | Current Value | 14 | Formula | Depreciated value calculation |
| S | Notes | 40 | Text | Additional context, repair history |

## Data Validation — MANDATORY for Inventory

### Category dropdown
```python
cat_validation = DataValidation(
    type='list',
    formula1='"Hardware,Software,Network,Furniture,Vehicles,Office Equipment,Consumables"',
    allow_blank=True
)
cat_validation.error = 'Select a valid category'
ws.add_data_validation(cat_validation)
cat_validation.add(f'C2:C{max_row}')
```

### Status dropdown
```python
status_validation = DataValidation(
    type='list',
    formula1='"Active,In Repair,In Storage,Retired,Disposed,On Order"',
    allow_blank=True
)
ws.add_data_validation(status_validation)
status_validation.add(f'O2:O{max_row}')
```

### Condition dropdown
```python
condition_validation = DataValidation(
    type='list',
    formula1='"Excellent,Good,Fair,Poor,N/A"',
    allow_blank=True
)
ws.add_data_validation(condition_validation)
condition_validation.add(f'P2:P{max_row}')
```

### Location dropdown
```python
location_validation = DataValidation(
    type='list',
    formula1='"Main Office,Server Room,Branch A,Branch B,Warehouse,Remote,In Transit"',
    allow_blank=True
)
ws.add_data_validation(location_validation)
location_validation.add(f'M2:M{max_row}')
```

### Quantity validation (positive integers only)
```python
qty_validation = DataValidation(
    type='whole',
    operator='greaterThanOrEqual',
    formula1='0'
)
qty_validation.error = 'Quantity must be a non-negative integer'
ws.add_data_validation(qty_validation)
qty_validation.add(f'H2:H{max_row}')
```

### Currency validation (positive numbers)
```python
cost_validation = DataValidation(
    type='decimal',
    operator='greaterThanOrEqual',
    formula1='0'
)
ws.add_data_validation(cost_validation)
cost_validation.add(f'I2:I{max_row}')
```

## Formula Patterns

### Total value per item
```python
# =Quantity × Unit Cost
f'=H{row}*I{row}'
```

### Depreciated current value (straight-line)
```python
# =MAX(0, Unit Cost - (Unit Cost × Depreciation Rate × Years Since Purchase))
# Years since purchase = (TODAY() - Purchase Date) / 365.25
f'=MAX(0, I{row} - (I{row} * Q{row} * (TODAY()-K{row})/365.25))'
```

### Warranty status
```python
# Returns "Active", "Expiring Soon" (within 30 days), or "Expired"
f'=IF(L{row}="","N/A",IF(L{row}<TODAY(),"Expired",IF(L{row}<TODAY()+30,"Expiring Soon","Active")))'
```

### Age of asset in years
```python
f'=IF(K{row}="","",ROUND((TODAY()-K{row})/365.25,1))'
```

### Summary sheet formulas
```python
# Total number of assets
f'=COUNTA(Inventory!A2:A{max_row})'

# Total purchase value
f'=SUM(Inventory!J2:J{max_row})'

# Total current value (depreciated)
f'=SUM(Inventory!R2:R{max_row})'

# Total depreciation
f'=SUM(Inventory!J2:J{max_row})-SUM(Inventory!R2:R{max_row})'

# Count by category
f'=COUNTIF(Inventory!C2:C{max_row},"Hardware")'
f'=COUNTIF(Inventory!C2:C{max_row},"Software")'

# Value by category
f'=SUMIF(Inventory!C2:C{max_row},"Hardware",Inventory!J2:J{max_row})'

# Count by status
f'=COUNTIF(Inventory!O2:O{max_row},"Active")'
f'=COUNTIF(Inventory!O2:O{max_row},"Retired")'

# Count of expired warranties
f'=COUNTIFS(Inventory!L2:L{max_row},"<"&TODAY(),Inventory!O2:O{max_row},"Active")'

# Count of warranties expiring within 30 days
f'=COUNTIFS(Inventory!L2:L{max_row},">="&TODAY(),Inventory!L2:L{max_row},"<="&TODAY()+30,Inventory!O2:O{max_row},"Active")'

# Average asset age
f'=AVERAGE(IF(Inventory!K2:K{max_row}<>"", (TODAY()-Inventory!K2:K{max_row})/365.25))'
# Note: This is an array formula — enter with Ctrl+Shift+Enter or wrap in IFERROR
```

## Conditional Formatting

### Status-based row coloring
```python
# Active = default (no special coloring)

# In Repair = orange background
ws.conditional_formatting.add(
    f'A2:S{max_row}',
    FormulaRule(formula=[f'$O2="In Repair"'],
               fill=PatternFill('solid', fgColor='FEEBC8'))
)

# Retired = grey text
ws.conditional_formatting.add(
    f'A2:S{max_row}',
    FormulaRule(formula=[f'$O2="Retired"'],
               font=Font(color='A0AEC0'),
               fill=PatternFill('solid', fgColor='F7FAFC'))
)

# Disposed = strikethrough grey
ws.conditional_formatting.add(
    f'A2:S{max_row}',
    FormulaRule(formula=[f'$O2="Disposed"'],
               font=Font(color='CBD5E0', strikethrough=True))
)
```

### Warranty expiry alerts
```python
# Expired warranty = red
ws.conditional_formatting.add(
    f'L2:L{max_row}',
    FormulaRule(formula=[f'AND(L2<>"",L2<TODAY())'],
               fill=PatternFill('solid', fgColor='FED7D7'),
               font=Font(color='9B2C2C', bold=True))
)

# Expiring within 30 days = yellow
ws.conditional_formatting.add(
    f'L2:L{max_row}',
    FormulaRule(formula=[f'AND(L2<>"",L2>=TODAY(),L2<=TODAY()+30)'],
               fill=PatternFill('solid', fgColor='FEFCBF'),
               font=Font(color='975A16', bold=True))
)
```

### Condition-based coloring
```python
ws.conditional_formatting.add(
    f'P2:P{max_row}',
    CellIsRule(operator='equal', formula=['"Poor"'],
               fill=PatternFill('solid', fgColor='FED7D7'),
               font=Font(color='9B2C2C', bold=True))
)

ws.conditional_formatting.add(
    f'P2:P{max_row}',
    CellIsRule(operator='equal', formula=['"Fair"'],
               fill=PatternFill('solid', fgColor='FEFCBF'),
               font=Font(color='975A16'))
)
```

## Freeze Panes and Auto-Filter

```python
# Freeze header row and ID + Name columns
ws.freeze_panes = 'C2'

# Auto-filter on all columns — essential for filtering by category, location, status
ws.auto_filter.ref = f'A1:S{max_row}'
```

## Step-by-Step Workflow

### Step 1: Determine inventory type
IT assets? Office equipment? Warehouse stock? Software licenses? This determines column structure and dropdown values.

### Step 2: Set up sheets (Inventory, Summary, Settings)

### Step 3: Define column structure with proper widths

### Step 4: Add data validation dropdowns BEFORE adding data

### Step 5: Populate inventory data
From user-provided list or create empty template with formatted columns.

### Step 6: Add formulas
Total value, depreciated value, warranty status, age calculations.

### Step 7: Add summary sheet with COUNTIF/SUMIF formulas

### Step 8: Apply conditional formatting
Status coloring, warranty alerts, condition coloring.

### Step 9: Set freeze panes and auto-filter

### Step 10: Save and recalculate
```bash
python scripts/recalc.py output.xlsx 30
```

## Recalculation — REQUIRED

Inventory trackers use formulas for total values, depreciation, warranty status, and summary counts. All must be recalculated.

```bash
python scripts/recalc.py output.xlsx 30
```

### Verify after recalc:
- [ ] Total value column (J) = Quantity × Unit Cost for each row
- [ ] Current value (R) reflects depreciation correctly
- [ ] Warranty status formulas show correct Active/Expiring/Expired
- [ ] Summary sheet counts match manual spot-check
- [ ] No #REF! errors from formula references
- [ ] SUMIF/COUNTIF ranges cover all data rows

## Real-World Examples

### Example 1: AI Infrastructure Inventory
A tech company deploys a GPU cluster:
- Categories: GPU Cards, NAS Storage, Network Switches, Servers, Cabling
- Items: 8× NVIDIA A100 80GB ($15,000 each), 2× Synology NAS ($8,000 each), 4× 10GbE switches
- Per item: Serial number, rack location, warranty expiry, power draw
- Depreciation: 3-year straight-line for GPUs, 5-year for network equipment
- Summary: Total hardware value, depreciation schedule, warranty renewal timeline

### Example 2: IT Asset Register for a 50-Person Company
IT department tracks all hardware:
- Laptops: Model, RAM, storage, assignee, purchase date, warranty
- Monitors: Size, resolution, serial, location
- Peripherals: Keyboards, mice, headsets, docks
- Servers: Rack location, IP, CPU, RAM, storage, role
- Conditional formatting: Red for expired warranties, yellow for expiring within 30 days
- Summary: Asset count by category, total value, depreciation to date

### Example 3: Software License Inventory
A company tracks all SaaS and perpetual licenses:
- Columns: Software Name, Vendor, License Type (Perpetual/Annual/Monthly), Seats Purchased, Seats Used, Cost/Seat, Total Cost, Renewal Date, Owner
- Formulas: Utilization % = Seats Used / Seats Purchased, Annual Cost projection
- Alerts: Renewals within 30 days highlighted, underutilized licenses (< 50% usage) flagged
- Summary: Total annual software spend, spend by department, utilization rate

### Example 4: Warehouse Stock Tracker
A small business tracks physical inventory:
- Columns: SKU, Product Name, Category, Location (Aisle-Shelf), Quantity On Hand, Reorder Point, Unit Cost, Total Value
- Reorder alert: =IF(H2<=I2, "REORDER", "OK") with conditional formatting
- Low stock highlighting: Yellow if within 20% of reorder point, Red if at or below
- Summary: Total stock value, items below reorder point, value by category

## Common Pitfalls

- **Serial numbers as text**: Serial numbers that look like numbers (e.g., "00123456") must be stored as text — prepend with apostrophe or format column as text BEFORE entering data
- **Date formatting**: Be consistent — use ISO format (YYYY-MM-DD) or locale-appropriate (DD-MMM-YYYY). Never mix formats.
- **Depreciation methods**: Always specify which method (straight-line, declining balance) and rate in the Settings sheet. Different asset categories may have different rates.
- **Large inventories**: For 1000+ items, use Excel Tables (ListObjects) for automatic formula extension when new rows are added
- **Duplicate serial numbers**: Add a helper column with =COUNTIF($G$2:$G${max_row},G2) and conditional formatting to highlight duplicates

## Code Style

- Define all dropdown values in a Settings sheet for easy modification
- Use consistent ID format with prefix: IT-001, SW-001, NW-001
- Group items by category with sort order, not merged cell separators
- Include a "Last Audit Date" field for physical inventory reconciliation
- Add a print area for asset tags or inventory count sheets
