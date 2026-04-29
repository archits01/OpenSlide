---
name: xlsx-quotations-pricing
description: "Use this skill when the user asks to create a quotation, price estimate, cost proposal, rate card, invoice, billing sheet, pricing model, or any spreadsheet that presents costs, prices, or fees to a client or customer. Trigger on keywords: 'quotation', 'quote', 'estimate', 'proposal', 'pricing', 'rate card', 'invoice', 'billing', 'cost breakdown', 'line items', 'GST', 'tax', 'total cost', 'price list', 'pricing model', 'fee structure', 'cost estimate', 'purchase order', 'proforma'. Also trigger when the user says 'how much will it cost', 'build me a pricing sheet', 'send a quote to the client', or mentions creating a document with amounts and taxes for external sharing."
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


# Quotations & Pricing — Complete Skill

## Skills Chain (read these BEFORE starting)

1. **PRIMARY**: `/mnt/skills/public/xlsx/SKILL.md` — Read FIRST. Base rules.
2. **OPTIONAL**: `/mnt/skills/user/coleads-service-agreement/SKILL.md` — Read IF the user needs a formal service agreement (.docx) alongside the quotation spreadsheet. Common workflow: Build the pricing in Excel, then generate the contract referencing those prices.
3. **OPTIONAL**: `/mnt/skills/public/pdf/SKILL.md` — Read IF the user wants a PDF version of the quotation for emailing to clients.
4. **OPTIONAL**: `/mnt/skills/user/deep-research/SKILL.md` — Read IF the user needs market rate benchmarks to validate their pricing (e.g., "are these consulting rates competitive?").

## Library Selection

**Use openpyxl** — Quotations need precise formatting, professional layout, formula-driven calculations, and print-ready design. This is a client-facing document — visual quality matters as much as accuracy.

```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.drawing.image import Image  # For company logo
import datetime
```

## CRITICAL: Client-Facing Quality Standards

Quotations go DIRECTLY to clients. They represent the company. Apply these extra standards:

1. **Company branding**: Logo area, company name in large font, address, GSTIN/tax ID, contact details
2. **Professional borders**: Clean, consistent border styling — not Excel default gridlines
3. **Print-ready**: Set print area, page margins, headers/footers, fit to one page
4. **No formula visibility**: Client should see values, not formulas — recalculation is MANDATORY
5. **Currency formatting**: Consistent throughout — ₹ for Indian, $ for USD, with proper comma separators
6. **Date formatting**: Quote date, validity period clearly stated
7. **Quote reference number**: Professional reference like QT-2026-0042

## Sheet Architecture

### Simple Quotation (single page)

| Section | Rows | Content |
|---|---|---|
| Header | 1-8 | Company logo, name, address, GSTIN, contact |
| Quote Details | 9-12 | Quote #, Date, Client name, Validity |
| Line Items | 14-N | Item description, Qty, Unit Rate, Total |
| Subtotal | N+1 | Sum of line items |
| Tax | N+2 to N+4 | CGST, SGST (or IGST), total tax |
| Grand Total | N+5 | Subtotal + Tax |
| Terms | N+7+ | Payment terms, delivery, warranty, notes |

### Multi-Tier Quotation

| Sheet Name | Purpose |
|---|---|
| Summary | Side-by-side tier comparison with grand totals |
| Tier 1 - Basic | Basic package line items and pricing |
| Tier 2 - Standard | Standard package line items and pricing |
| Tier 3 - Premium | Premium package line items and pricing |
| Terms & Conditions | Payment terms, SLA, warranty, exclusions |

### Rate Card

| Sheet Name | Purpose |
|---|---|
| Rate Card | Per-role or per-service hourly/daily/monthly rates |
| Estimated Project Cost | Roles × hours × rate = project estimate |
| Terms | Engagement terms, billing cycle, escalation |

## Header Section — Company Branding

```python
# Company header (top of quotation)
ws.merge_cells('A1:H1')
ws['A1'] = 'CoLeads Edgeworks LLP'
ws['A1'].font = Font(name='Arial', bold=True, size=18, color='1A202C')
ws['A1'].alignment = Alignment(horizontal='left', vertical='center')
ws.row_dimensions[1].height = 32

ws.merge_cells('A2:H2')
ws['A2'] = 'AI Infrastructure & Technology Consulting'
ws['A2'].font = Font(name='Arial', size=10, color='718096', italic=True)

ws.merge_cells('A3:H3')
ws['A3'] = 'Bengaluru, Karnataka, India | GSTIN: XXABC1234X1ZX'
ws['A3'].font = Font(name='Arial', size=9, color='A0AEC0')

ws.merge_cells('A4:H4')
ws['A4'] = 'Email: contact@coleads.in | Phone: +91-XXXXXXXXXX'
ws['A4'].font = Font(name='Arial', size=9, color='A0AEC0')

# Separator line
for col in range(1, 9):
    ws.cell(row=5, column=col).border = Border(bottom=Side(style='medium', color='2D3748'))
ws.row_dimensions[5].height = 8
```

## Quote Details Section

```python
# Quote metadata
ws['A7'] = 'Quotation Reference:'
ws['B7'] = 'QT-2026-0042'
ws['A7'].font = Font(name='Arial', bold=True, size=10)
ws['B7'].font = Font(name='Arial', size=10, color='2B6CB0')

ws['A8'] = 'Date:'
ws['B8'] = datetime.date.today()
ws['B8'].number_format = 'DD-MMM-YYYY'

ws['A9'] = 'Valid Until:'
ws['B9'] = datetime.date.today() + datetime.timedelta(days=30)
ws['B9'].number_format = 'DD-MMM-YYYY'

ws['D7'] = 'Prepared For:'
ws['E7'] = 'Client Company Name'
ws['E7'].font = Font(name='Arial', bold=True, size=10)

ws['D8'] = 'Attention:'
ws['E8'] = 'Mr./Ms. Client Contact Name'

ws['D9'] = 'Email:'
ws['E9'] = 'client@company.com'
```

## Line Items Section

### Column structure
```python
ITEM_HEADERS = ['S.No.', 'Description', 'Specifications', 'Qty', 'Unit', 'Unit Rate', 'Total']
ITEM_WIDTHS = [6, 40, 30, 8, 10, 16, 16]

header_row = 12
for i, (h, w) in enumerate(ITEM_HEADERS, 1):
    cell = ws.cell(row=header_row, column=i, value=h)
    cell.font = Font(name='Arial', bold=True, color='FFFFFF', size=10)
    cell.fill = PatternFill('solid', fgColor='2D3748')
    cell.alignment = Alignment(horizontal='center', vertical='center')
    cell.border = Border(
        bottom=Side(style='medium', color='000000')
    )
    ws.column_dimensions[get_column_letter(i)].width = w
```

### Line item data
```python
items = [
    (1, 'NVIDIA A100 80GB GPU Card', 'PCIe, 80GB HBM2e, 300W TDP', 8, 'Nos.', 1500000),
    (2, 'Synology NAS Storage', 'RS3621xs+, 12-bay, 96TB raw', 2, 'Nos.', 800000),
    (3, '10GbE Network Switch', 'Managed, 48-port, L3', 4, 'Nos.', 250000),
    (4, 'Server Chassis', 'Dell PowerEdge R750xa, 2U', 2, 'Nos.', 1200000),
    (5, 'Installation & Configuration', 'On-site setup, testing, documentation', 1, 'Lot', 500000),
    (6, 'Annual Maintenance Contract', '24/7 support, 4hr response SLA', 1, 'Year', 300000),
]

data_start = header_row + 1
for i, (sno, desc, spec, qty, unit, rate) in enumerate(items):
    row = data_start + i
    ws.cell(row=row, column=1, value=sno).alignment = Alignment(horizontal='center')
    ws.cell(row=row, column=2, value=desc)
    ws.cell(row=row, column=3, value=spec)
    ws.cell(row=row, column=4, value=qty).alignment = Alignment(horizontal='center')
    ws.cell(row=row, column=5, value=unit).alignment = Alignment(horizontal='center')
    
    rate_cell = ws.cell(row=row, column=6, value=rate)
    rate_cell.number_format = '₹#,##0'
    
    total_cell = ws.cell(row=row, column=7)
    total_cell.value = f'=D{row}*F{row}'  # Qty × Unit Rate
    total_cell.number_format = '₹#,##0'
    
    # Alternating row shading
    if i % 2 == 1:
        for col in range(1, 8):
            ws.cell(row=row, column=col).fill = PatternFill('solid', fgColor='F7FAFC')
    
    # Apply font and borders to all cells in row
    for col in range(1, 8):
        cell = ws.cell(row=row, column=col)
        cell.font = Font(name='Arial', size=10)
        cell.border = Border(
            left=Side(style='thin', color='E2E8F0'),
            right=Side(style='thin', color='E2E8F0'),
            bottom=Side(style='thin', color='E2E8F0'),
        )
        cell.alignment = Alignment(wrap_text=True, vertical='top')
    
    ws.row_dimensions[row].height = 28
```

## Subtotal, Tax, and Grand Total — ALL as Formulas

```python
last_item_row = data_start + len(items) - 1

# Subtotal
sub_row = last_item_row + 2
ws.merge_cells(f'A{sub_row}:E{sub_row}')
ws[f'A{sub_row}'] = 'SUBTOTAL'
ws[f'A{sub_row}'].font = Font(name='Arial', bold=True, size=11)
ws[f'A{sub_row}'].alignment = Alignment(horizontal='right')
ws[f'G{sub_row}'] = f'=SUM(G{data_start}:G{last_item_row})'
ws[f'G{sub_row}'].number_format = '₹#,##0'
ws[f'G{sub_row}'].font = Font(name='Arial', bold=True, size=11)
ws[f'G{sub_row}'].border = Border(top=Side(style='medium'))

# CGST (9%)
cgst_row = sub_row + 1
ws.merge_cells(f'A{cgst_row}:E{cgst_row}')
ws[f'A{cgst_row}'] = 'CGST @ 9%'
ws[f'A{cgst_row}'].alignment = Alignment(horizontal='right')
ws[f'G{cgst_row}'] = f'=G{sub_row}*0.09'
ws[f'G{cgst_row}'].number_format = '₹#,##0'

# SGST (9%)
sgst_row = sub_row + 2
ws.merge_cells(f'A{sgst_row}:E{sgst_row}')
ws[f'A{sgst_row}'] = 'SGST @ 9%'
ws[f'A{sgst_row}'].alignment = Alignment(horizontal='right')
ws[f'G{sgst_row}'] = f'=G{sub_row}*0.09'
ws[f'G{sgst_row}'].number_format = '₹#,##0'

# Total Tax
tax_row = sub_row + 3
ws.merge_cells(f'A{tax_row}:E{tax_row}')
ws[f'A{tax_row}'] = 'Total GST (18%)'
ws[f'A{tax_row}'].alignment = Alignment(horizontal='right')
ws[f'A{tax_row}'].font = Font(name='Arial', bold=True)
ws[f'G{tax_row}'] = f'=G{cgst_row}+G{sgst_row}'
ws[f'G{tax_row}'].number_format = '₹#,##0'
ws[f'G{tax_row}'].font = Font(name='Arial', bold=True)

# Grand Total
grand_row = sub_row + 4
ws.merge_cells(f'A{grand_row}:E{grand_row}')
ws[f'A{grand_row}'] = 'GRAND TOTAL (INCLUSIVE OF GST)'
ws[f'A{grand_row}'].font = Font(name='Arial', bold=True, size=12, color='1A202C')
ws[f'A{grand_row}'].alignment = Alignment(horizontal='right')
ws[f'A{grand_row}'].fill = PatternFill('solid', fgColor='EBF8FF')
ws[f'G{grand_row}'] = f'=G{sub_row}+G{tax_row}'
ws[f'G{grand_row}'].number_format = '₹#,##0'
ws[f'G{grand_row}'].font = Font(name='Arial', bold=True, size=12, color='1A202C')
ws[f'G{grand_row}'].fill = PatternFill('solid', fgColor='EBF8FF')
ws[f'G{grand_row}'].border = Border(
    top=Side(style='double', color='000000'),
    bottom=Side(style='double', color='000000')
)
ws.row_dimensions[grand_row].height = 30
```

### For IGST (inter-state supply) instead of CGST+SGST:
```python
# IGST (18%) — used for inter-state transactions
igst_row = sub_row + 1
ws[f'A{igst_row}'] = 'IGST @ 18%'
ws[f'G{igst_row}'] = f'=G{sub_row}*0.18'
```

### Amount in words (optional — very professional)
```python
# Add amount in words below grand total
words_row = grand_row + 2
ws.merge_cells(f'A{words_row}:G{words_row}')
ws[f'A{words_row}'] = 'Amount in Words: Nineteen Crore Twelve Lakh Fifty Thousand Rupees Only'
ws[f'A{words_row}'].font = Font(name='Arial', size=10, italic=True, color='4A5568')
```

## Terms & Conditions Section

```python
terms_start = grand_row + 4
ws.merge_cells(f'A{terms_start}:G{terms_start}')
ws[f'A{terms_start}'] = 'Terms & Conditions'
ws[f'A{terms_start}'].font = Font(name='Arial', bold=True, size=12, color='2D3748')
ws[f'A{terms_start}'].border = Border(bottom=Side(style='thin', color='2D3748'))

terms = [
    'Payment Terms: 50% advance upon order confirmation, 40% on delivery, 10% post-installation.',
    'Delivery: 4-6 weeks from order confirmation, subject to hardware availability.',
    'Warranty: 3-year manufacturer warranty on all hardware. AMC available thereafter.',
    'Quote Validity: This quotation is valid for 30 days from the date of issue.',
    'Taxes: All prices are exclusive of GST unless stated otherwise. GST as applicable.',
    'Cancellation: Orders once confirmed cannot be cancelled. Custom configurations are non-refundable.',
    'Intellectual Property: All configurations and architectures designed by CoLeads remain IP of CoLeads.',
]

for i, term in enumerate(terms):
    row = terms_start + 1 + i
    ws.merge_cells(f'A{row}:G{row}')
    ws[f'A{row}'] = f'{i+1}. {term}'
    ws[f'A{row}'].font = Font(name='Arial', size=9, color='4A5568')
    ws[f'A{row}'].alignment = Alignment(wrap_text=True, vertical='top')
    ws.row_dimensions[row].height = 28
```

## Signature Block

```python
sig_row = terms_start + len(terms) + 3
ws.merge_cells(f'A{sig_row}:C{sig_row}')
ws[f'A{sig_row}'] = 'For CoLeads Edgeworks LLP'
ws[f'A{sig_row}'].font = Font(name='Arial', bold=True, size=10)

ws.merge_cells(f'E{sig_row}:G{sig_row}')
ws[f'E{sig_row}'] = 'Client Acceptance'
ws[f'E{sig_row}'].font = Font(name='Arial', bold=True, size=10)

sig_line_row = sig_row + 3
ws[f'A{sig_line_row}'] = '________________________'
ws[f'A{sig_line_row+1}'] = 'Authorized Signatory'
ws[f'A{sig_line_row+1}'].font = Font(name='Arial', size=9, color='718096')

ws[f'E{sig_line_row}'] = '________________________'
ws[f'E{sig_line_row+1}'] = 'Name, Title, Date'
ws[f'E{sig_line_row+1}'].font = Font(name='Arial', size=9, color='718096')
```

## Multi-Tier Comparison

For quotations with multiple options (like the CoLeads multi-campus vs single-campus):

```python
# Summary sheet — side by side comparison
summary = wb.create_sheet('Comparison', 0)  # Insert as first sheet

summary['A1'] = 'Quotation Summary — Tier Comparison'
summary['A1'].font = Font(name='Arial', bold=True, size=14)

# Headers
summary['B3'] = 'Tier 1: Multi-Campus'
summary['C3'] = 'Tier 2: Single Campus'
summary['D3'] = 'Difference'

# Line items pulling from tier sheets
summary['A5'] = 'GPU Cards'
summary['B5'] = "='Tier 1'!G{gpu_row}"
summary['C5'] = "='Tier 2'!G{gpu_row}"
summary['D5'] = "=B5-C5"

# ... more line items ...

# Totals
summary[f'B{total}'] = "='Tier 1'!G{grand_total_row}"
summary[f'C{total}'] = "='Tier 2'!G{grand_total_row}"
summary[f'D{total}'] = f"=B{total}-C{total}"

# All cross-sheet references in GREEN text
for cell in green_cells:
    cell.font = Font(name='Arial', color='008000')
```

## Print Setup — CRITICAL for Quotations

```python
# Page setup
ws.page_setup.orientation = 'portrait'
ws.page_setup.paperSize = ws.PAPERSIZE_A4
ws.page_setup.fitToPage = True
ws.page_setup.fitToWidth = 1
ws.page_setup.fitToHeight = 0  # Auto height

# Margins (inches)
ws.page_margins.left = 0.5
ws.page_margins.right = 0.5
ws.page_margins.top = 0.5
ws.page_margins.bottom = 0.5

# Print area
ws.print_area = f'A1:G{sig_line_row + 1}'

# Header/footer
ws.oddHeader.center.text = 'CONFIDENTIAL'
ws.oddFooter.center.text = 'Page &P of &N'
ws.oddFooter.right.text = f'QT-2026-0042 | {datetime.date.today().strftime("%d-%b-%Y")}'
```

## Recalculation — MANDATORY

Quotations MUST be recalculated. A client receiving a quote where the Grand Total shows `=G18+G21` instead of `₹19,12,50,000` is unacceptable.

```bash
python scripts/recalc.py output.xlsx 30
```

### Verification checklist (CRITICAL — client-facing):
- [ ] Every line item total = Qty × Unit Rate
- [ ] Subtotal = Sum of all line item totals
- [ ] CGST = Subtotal × 9%
- [ ] SGST = Subtotal × 9%
- [ ] Grand Total = Subtotal + CGST + SGST
- [ ] Grand Total cross-check: Subtotal × 1.18 (for 18% GST)
- [ ] No formula errors anywhere
- [ ] Currency format is consistent (₹ with commas in Indian numbering: ₹19,12,50,000)
- [ ] Amount in words matches the Grand Total number
- [ ] Quote date and validity date are correct
- [ ] Client name is spelled correctly
- [ ] Print preview shows the entire quotation fitting on the expected number of pages

## Real-World Examples

### Example 1: CoLeads AI Infrastructure Quotation
A technology consulting firm quotes a GPU cluster deployment:
- Two tiers: Multi-campus (~₹19Cr) and Single-campus (~₹14Cr)
- Hardware: GPUs, NAS, switches, servers, cabling
- Services: Installation, configuration, training, AMC
- GST: 18% (CGST 9% + SGST 9% for intra-state, Karnataka)
- Terms: 50/40/10 payment schedule, 4-6 week delivery

### Example 2: Consulting Rate Card
A staffing firm provides rates for different roles:
- Roles: AI Engineer, ML Ops Engineer, Data Scientist, Project Manager
- Rates: Monthly rate, daily rate, hourly rate
- Volume discounts: 1-2 resources (standard), 3-5 (5% discount), 6+ (10% discount)
- Comparison: Market benchmark rates alongside quoted rates
- Like the Quantum Networks consulting quote — identifying underpriced roles

### Example 3: Software Development Project Estimate
A dev agency quotes a web application build:
- Phases: Discovery, Design, Development, Testing, Launch, Post-Launch Support
- Per phase: Hours × rate per role (Frontend, Backend, Design, PM, QA)
- Fixed costs: Hosting, domain, third-party APIs, licenses
- Payment milestones: 20% kickoff, 30% at design approval, 30% at beta, 20% at launch
- Optional add-ons: SEO setup, analytics, additional pages

### Example 4: Hardware Procurement Quotation
An IT vendor quotes office equipment:
- Line items: Laptops (5 models × quantities), monitors, peripherals, networking
- Per-item: Brand, model, specs, MRP, discount %, net price, quantity, total
- Warranty: Standard vs extended warranty costs as optional line items
- Delivery: Item-wise lead time column
- Bulk discount: Auto-calculated based on total order value thresholds

## Common Pitfalls

- **GST type**: CGST+SGST for intra-state (same state), IGST for inter-state. NEVER apply both.
- **Indian number formatting**: ₹19,12,50,000 (Indian) vs $19,125,000 (Western). Use the correct comma grouping for the currency.
- **Amount in words**: Must exactly match the Grand Total. If the total changes, the words must update (or be manually corrected).
- **Validity period**: Always state it. Without it, a client could accept a year-old quote at outdated prices.
- **Version control**: Include quote reference number and version (QT-2026-0042-v2) when revising.
- **Rounding**: Tax calculations may produce fractional paisa. Round each line to nearest rupee. Verify grand total still adds up.
- **Print area**: Test print preview before delivering. Long terms sections may spill to a second page awkwardly.

## Code Style

- Build the quotation top-to-bottom in code (header → details → items → totals → terms → signature)
- Use row offset variables so inserting/removing items doesn't break total formulas
- Define all tax rates in variables at the top of the script (GST_RATE = 0.18, CGST_RATE = 0.09, SGST_RATE = 0.09)
- Format currency immediately after setting the value — don't do formatting in a separate pass
- Set print area as the LAST step after all content is in place
