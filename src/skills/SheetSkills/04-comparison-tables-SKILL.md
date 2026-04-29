---
name: xlsx-comparison-tables
description: "Use this skill when the user asks to compare products, vendors, tools, services, technologies, plans, options, or any set of items across multiple dimensions. Trigger on keywords: 'compare', 'comparison table', 'vs', 'versus', 'side by side', 'which is better', 'pros and cons', 'feature matrix', 'vendor comparison', 'tool comparison', 'pricing comparison', 'benchmark', 'competitive analysis', 'evaluation matrix', 'decision matrix', 'scorecard', 'ranking'. Also trigger when the user lists multiple options and asks 'help me choose', 'which should I pick', or 'evaluate these options'."
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


# Comparison Tables — Complete Skill

## Skills Chain (read these BEFORE starting)

1. **PRIMARY**: `/mnt/skills/public/xlsx/SKILL.md` — Read FIRST. Base spreadsheet rules.
2. **RECOMMENDED**: `/mnt/skills/user/deep-research/SKILL.md` — Read this to research the items being compared. Most comparison tables require accurate, up-to-date data about products/tools/vendors. Do NOT rely on training data alone for pricing, features, or specifications that change frequently.

## Library Selection

**Use openpyxl** — comparison tables are formatting-heavy with minimal formulas. The visual presentation is critical for decision-making.

```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.formatting.rule import CellIsRule
from openpyxl.utils import get_column_letter
```

Use pandas ONLY if the user provides raw data that needs restructuring into comparison format.

## Sheet Architecture

### Horizontal comparison (items as columns)
Best when comparing 2-5 items across many dimensions:

```
         |  Option A  |  Option B  |  Option C  |
Feature 1|    value    |    value   |    value   |
Feature 2|    value    |    value   |    value   |
...      |    ...      |    ...     |    ...     |
```

### Vertical comparison (items as rows)
Best when comparing 6+ items across fewer dimensions:

```
Item Name | Feature 1 | Feature 2 | Feature 3 | Feature 4 | Score
Option A  |   value   |   value   |   value   |   value   |  =formula
Option B  |   value   |   value   |   value   |   value   |  =formula
...
```

### Multi-sheet comparison
For complex evaluations:

| Sheet Name | Purpose |
|---|---|
| Overview | Summary comparison with scores and recommendation |
| Feature Matrix | Detailed feature-by-feature breakdown |
| Pricing | Cost comparison with TCO calculations |
| Scoring | Weighted scoring methodology |

## Formatting Standards

### Headers — Items being compared
```python
ITEM_HEADER_FONT = Font(name='Arial', bold=True, color='FFFFFF', size=12)
ITEM_HEADER_FILL = PatternFill('solid', fgColor='2D3748')
ITEM_HEADER_ALIGN = Alignment(horizontal='center', vertical='center', wrap_text=True)
```

### Row labels — Comparison dimensions
```python
ROW_LABEL_FONT = Font(name='Arial', bold=True, size=10, color='2D3748')
ROW_LABEL_FILL = PatternFill('solid', fgColor='EDF2F7')
```

### Category separators — Group related features
```python
CATEGORY_FONT = Font(name='Arial', bold=True, size=11, color='FFFFFF')
CATEGORY_FILL = PatternFill('solid', fgColor='4A5568')
```

### Data cells
```python
DATA_FONT = Font(name='Arial', size=10)
ALT_ROW_FILL = PatternFill('solid', fgColor='F7FAFC')
CELL_BORDER = Border(
    left=Side(style='thin', color='E2E8F0'),
    right=Side(style='thin', color='E2E8F0'),
    top=Side(style='thin', color='E2E8F0'),
    bottom=Side(style='thin', color='E2E8F0'),
)
WRAP_ALIGN = Alignment(wrap_text=True, vertical='top')
CENTER_ALIGN = Alignment(horizontal='center', vertical='top', wrap_text=True)
```

### Winner/Best highlighting
```python
WINNER_FILL = PatternFill('solid', fgColor='C6F6D5')     # Light green for best-in-class
WINNER_FONT = Font(name='Arial', size=10, bold=True, color='276749')
LOSER_FILL = PatternFill('solid', fgColor='FED7D7')      # Light red for worst-in-class
NEUTRAL_FILL = PatternFill('solid', fgColor='FEFCBF')    # Light yellow for middle
```

## Conditional Formatting for Comparisons

### Boolean features (Yes/No, ✓/✗)
```python
# Green for Yes/✓
ws.conditional_formatting.add(
    f'B5:D{last_row}',
    CellIsRule(operator='equal', formula=['"✓"'],
               fill=PatternFill('solid', fgColor='C6F6D5'),
               font=Font(color='276749', bold=True))
)

# Red for No/✗
ws.conditional_formatting.add(
    f'B5:D{last_row}',
    CellIsRule(operator='equal', formula=['"✗"'],
               fill=PatternFill('solid', fgColor='FED7D7'),
               font=Font(color='9B2C2C'))
)
```

### Numeric ratings (1-5 or 1-10)
```python
from openpyxl.formatting.rule import ColorScaleRule

# Color scale: red (1) → yellow (3) → green (5)
ws.conditional_formatting.add(
    f'B5:D{last_row}',
    ColorScaleRule(
        start_type='num', start_value=1, start_color='FC8181',
        mid_type='num', mid_value=3, mid_color='FEFCBF',
        end_type='num', end_value=5, end_color='68D391'
    )
)
```

### Price comparison (lower is better)
```python
from openpyxl.formatting.rule import ColorScaleRule

# Reverse scale: green (low price) → red (high price)
ws.conditional_formatting.add(
    f'B{price_row}:D{price_row}',
    ColorScaleRule(
        start_type='min', start_color='C6F6D5',
        end_type='max', end_color='FED7D7'
    )
)
```

## Scoring System (Optional but Powerful)

### Weighted scoring matrix
Add a scoring sheet that calculates an overall score for each option:

```python
# Scoring sheet structure
# Column A: Criteria
# Column B: Weight (must sum to 100%)
# Columns C-E: Score per option (1-5 scale)
# Columns F-H: Weighted score = weight × raw score

scoring = wb.create_sheet('Scoring')
criteria = [
    ('Price', 0.25),
    ('Performance', 0.20),
    ('Ease of Use', 0.15),
    ('Support Quality', 0.10),
    ('Scalability', 0.15),
    ('Security', 0.15),
]

# Headers
scoring['A1'] = 'Criteria'
scoring['B1'] = 'Weight'
scoring['C1'] = 'Option A (Raw)'
scoring['D1'] = 'Option B (Raw)'
scoring['E1'] = 'Option C (Raw)'
scoring['F1'] = 'Option A (Weighted)'
scoring['G1'] = 'Option B (Weighted)'
scoring['H1'] = 'Option C (Weighted)'

for i, (name, weight) in enumerate(criteria, 2):
    scoring[f'A{i}'] = name
    scoring[f'B{i}'] = weight
    scoring[f'B{i}'].number_format = '0%'
    # Weighted score formulas
    scoring[f'F{i}'] = f'=$B{i}*C{i}'
    scoring[f'G{i}'] = f'=$B{i}*D{i}'
    scoring[f'H{i}'] = f'=$B{i}*E{i}'

# Total weighted scores
total_row = len(criteria) + 2
scoring[f'A{total_row}'] = 'TOTAL SCORE'
scoring[f'A{total_row}'].font = Font(bold=True)
scoring[f'B{total_row}'] = f'=SUM(B2:B{total_row-1})'  # Should = 100%
scoring[f'F{total_row}'] = f'=SUM(F2:F{total_row-1})'
scoring[f'G{total_row}'] = f'=SUM(G2:G{total_row-1})'
scoring[f'H{total_row}'] = f'=SUM(H2:H{total_row-1})'

# Rank
rank_row = total_row + 1
scoring[f'A{rank_row}'] = 'RANK'
scoring[f'F{rank_row}'] = f'=RANK(F{total_row},F{total_row}:H{total_row})'
scoring[f'G{rank_row}'] = f'=RANK(G{total_row},F{total_row}:H{total_row})'
scoring[f'H{rank_row}'] = f'=RANK(H{total_row},F{total_row}:H{total_row})'
```

## Formula Patterns

### Winner identification per row
```python
# Highlight the best value in each row (assuming higher is better)
'=IF(B5=MAX($B5:$D5),"★ BEST","")'

# For price rows (lower is better)
'=IF(B{row}=MIN($B{row}:$D{row}),"★ CHEAPEST","")'
```

### Total cost of ownership (TCO)
```python
# Monthly cost × 12 months × years + setup fee
'=B{monthly_row}*12*B{years_row}+B{setup_row}'
```

### Price per unit/seat
```python
'=IF(B{total_row}=0,"-",B{total_row}/B{seats_row})'
```

### Feature coverage percentage
```python
# Count of ✓ values out of total features
'=COUNTIF(B5:B{last_feature_row},"✓")/COUNTA(A5:A{last_feature_row})'
```

## Freeze Panes and Auto-Filter

```python
# Horizontal layout: freeze row labels and header
ws.freeze_panes = 'B2'

# Vertical layout: freeze header row
ws.freeze_panes = 'A2'

# Auto-filter (vertical layout only — horizontal layout doesn't benefit from filtering)
ws.auto_filter.ref = f'A1:{get_column_letter(ws.max_column)}{ws.max_row}'
```

## Hyperlinks for Source URLs

```python
from openpyxl.styles import Font

# Add clickable links to product/vendor pages
cell = ws.cell(row=2, column=2)
cell.value = 'OpenRouter'
cell.hyperlink = 'https://openrouter.ai'
cell.font = Font(name='Arial', size=10, color='2B6CB0', underline='single')
```

## Step-by-Step Workflow

### Step 1: Research the items (if needed)
If the user doesn't provide the data, use deep-research skill to gather accurate, current information about each item being compared. NEVER guess at pricing or specifications.

### Step 2: Define comparison dimensions
Group features into categories (Pricing, Performance, Features, Support, etc.). Order categories by importance to the user's decision.

### Step 3: Choose layout
2-5 items → Horizontal (items as columns). 6+ items → Vertical (items as rows).

### Step 4: Build the comparison
Populate all data. Use ✓/✗ for boolean features, numeric values for measurable dimensions, short text for qualitative assessments.

### Step 5: Apply formatting
Headers, category separators, alternating rows, conditional formatting, winner highlighting.

### Step 6: Add scoring (if requested or if the comparison is complex)
Weighted scoring with =SUMPRODUCT for total scores and =RANK for ranking.

### Step 7: Add hyperlinks
Link product names to their official pages for easy reference.

### Step 8: Freeze panes and auto-filter

### Step 9: Save and recalculate (if scoring formulas exist)
```bash
python scripts/recalc.py output.xlsx 30
```

## Recalculation

**Required only if the table includes scoring formulas, TCO calculations, or other computed fields.** Pure static comparison tables with no formulas can skip recalculation.

```bash
python scripts/recalc.py output.xlsx 30
```

Verify:
- [ ] Scoring totals match manual calculation
- [ ] RANK values are correct
- [ ] TCO formulas compute properly
- [ ] Winner identification formulas fire correctly

## Real-World Examples

### Example 1: LLM Model Comparison
A developer asks: "Compare Claude, GPT-4, and Gemini for my use case"
- Categories: Pricing (per 1M input/output tokens), Context Window, Benchmarks (MMLU, HumanEval, MATH), Speed (tokens/sec), Features (vision, function calling, streaming), API Quality
- Scoring: Weighted by developer priorities (price 25%, speed 20%, quality 30%, features 25%)
- Hyperlinks to API docs for each model

### Example 2: GPU Vendor Comparison for AI Infrastructure
A CTO asks: "Compare vendors for our GPU cluster — Dart Frog vs alternatives"
- Categories: Hardware (GPU model, VRAM, TDP), Pricing (per unit, bulk discount, total), Warranty, Lead Time, Support SLA, References
- TCO calculation: Hardware cost + power cost/year + cooling + support contract × 3 years
- Winner highlight per category

### Example 3: VPS Hosting Comparison
A developer asks: "Compare Hostinger, Hetzner, and DigitalOcean for running my AI agent"
- Categories: Pricing (monthly, annual), CPU cores, RAM, Storage, Bandwidth, GPU availability, Data centers, Docker support, API quality
- Conditional formatting: Green for best price, features
- Hyperlinks to pricing pages

### Example 4: SaaS Tool Evaluation Matrix
A team lead asks: "We're choosing between Slack, Teams, and Discord for internal comms"
- Categories: Pricing/seat, Message search, File sharing limits, Video calls, Integrations, Security (SOC2, SSO), Mobile app quality, Admin controls
- Feature matrix with ✓/✗ and ratings (1-5)
- Weighted scoring with team-specific weights
- Recommendation callout at top

## Common Pitfalls

- **Stale data**: Product pricing and features change frequently. Always note the date of comparison and suggest the user verify current pricing.
- **Apples to oranges**: Ensure comparison dimensions are equivalent across items (e.g., same billing period for pricing, same benchmark version for performance)
- **Too many dimensions**: Focus on the dimensions that matter for the user's decision. A 50-row comparison is noise — prioritize the top 15-20 differentiating features.
- **Missing "it depends"**: Some comparisons don't have a clear winner. Use the scoring system to let users weight what matters to THEM.
- **Merged cells**: Don't merge data cells — breaks sorting. Only merge category separator rows.

## Code Style

- Define all style constants at the top
- Use descriptive row labels — the user should understand each dimension without explanation
- Group related features under category headers with distinct formatting
- Add a "Last Updated" date in the header area
- Include source URLs as hyperlinks, not plain text
