---
name: doc-financial
description: >-
  Build professional 816x1056px HTML financial documents from any budget,
  forecast, invoice, or accounting data. Each section becomes a separate page
  created via the create_page tool. Designed for budgets, balance sheets, income
  statements, cash flow statements, invoices, receipts, expense reports, financial
  models, and tax summaries. Trigger when docsMode is active and the user mentions
  budget, invoice, balance sheet, P&L, income statement, expense report, financial
  summary, cash flow, forecast, or provides numerical or accounting data.
---


# Financial Document HTML Page Builder

## Base Design System

This skill inherits the **full doc-business design system and page library** (`01-Business-DOCX/references/`). Read those files first — they define colors, typography, page structure, HTML shell, headers, footers, and all base patterns (P1–P8).

This file documents **only the additions** specific to financial documents. Everything below overrides or extends the business base.

---

## Financial Number Formatting (CRITICAL — applies to every number on every page)

### Format Rules

| Type | Format | Example | Alignment |
|---|---|---|---|
| Currency | `$#,##0` | `$1,234,567` | Right |
| Currency abbreviated | `$#.#M` / `$#.#K` | `$1.2M` | Right |
| Currency negative | `($#,##0)` in `color:#C0504D` | `($45,230)` | Right |
| Percentage | `#.0%` | `12.5%` | Right |
| Percentage negative | `(#.0%)` in `color:#C0504D` | `(3.2%)` | Right |
| Positive variance | `+#.#%` in `color:#2D7D46` | `+5.2%` | Right |
| Negative variance | `(#.#%)` in `color:#C0504D` | `(3.1%)` | Right |
| Integer | `#,##0` | `1,234` | Right |
| Ratio | `#.#x` | `3.2x` | Right |

### Hard Rules
- **Negatives = parentheses + red** — never minus sign. `(1,234)` not `-1,234`
- **Currency symbol in column header only** — not in every cell
- **Consistent decimals within a column** — don't mix `$1,234` and `$1,234.56`
- **Thousands separator always** — never `1234567`
- **Right-align all numbers** — left-align labels only
- **Positive variance gets `+` prefix** — `+5.2%` in green

---

## Financial Table Hierarchy (extends base P3 table pattern)

Financial tables have 4 row types that the base business tables don't:

### Regular Row
```html
<tr style="border-bottom:1px solid #F3F4F6;">
  <td style="padding:9px 14px;font-size:12px;color:#4B5563;">SaaS Revenue</td>
  <td style="padding:9px 14px;font-size:12px;color:#4B5563;text-align:right;">1,234,567</td>
</tr>
```

### Indented Sub-Item Row
```html
<tr style="background:#F9FAFB;border-bottom:1px solid #F3F4F6;">
  <td style="padding:9px 14px 9px 32px;font-size:12px;color:#6B7280;">Enterprise</td>
  <td style="padding:9px 14px;font-size:12px;color:#6B7280;text-align:right;">890,000</td>
</tr>
```

### Subtotal Row (accounting single underline)
```html
<tr style="background:#F3F4F6;border-top:2px solid #1A1A1A;">
  <td style="padding:10px 14px;font-size:12px;font-weight:600;color:#1A1A1A;">Total Revenue</td>
  <td style="padding:10px 14px;font-size:12px;font-weight:600;color:#1A1A1A;text-align:right;">2,456,789</td>
</tr>
```

### Grand Total Row (accounting double underline)
```html
<tr style="background:#E5E7EB;border-top:3px double #1A1A1A;">
  <td style="padding:11px 14px;font-size:13px;font-weight:700;color:#1A1A1A;">Net Income</td>
  <td style="padding:11px 14px;font-size:13px;font-weight:700;color:#1A1A1A;text-align:right;">456,789</td>
</tr>
```

---

## Invoice-Specific Components

### Bill-To / From Header (replaces standard P1 metadata table for invoices)
```html
<div style="display:flex;justify-content:space-between;margin-bottom:28px;">
  <div>
    <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#9CA3AF;margin:0 0 8px;">From</p>
    <p style="font-size:14px;font-weight:700;color:#1A1A1A;margin:0 0 4px;">[COMPANY_NAME]</p>
    <p style="font-size:12px;color:#4B5563;line-height:1.6;margin:0;">[ADDRESS_LINE_1]<br>[ADDRESS_LINE_2]<br>[EMAIL] · [PHONE]</p>
  </div>
  <div style="text-align:right;">
    <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#9CA3AF;margin:0 0 8px;">Bill To</p>
    <p style="font-size:14px;font-weight:700;color:#1A1A1A;margin:0 0 4px;">[CLIENT_NAME]</p>
    <p style="font-size:12px;color:#4B5563;line-height:1.6;margin:0;">[CLIENT_ADDRESS]</p>
  </div>
</div>
```

### Invoice Metadata Row
```html
<div style="display:flex;gap:24px;padding:14px 18px;background:#F9FAFB;border-radius:6px;margin-bottom:20px;">
  <div>
    <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#9CA3AF;margin:0 0 4px;">Invoice #</p>
    <p style="font-size:13px;font-weight:600;color:#1A1A1A;margin:0;">[INVOICE_NUM]</p>
  </div>
  <div>
    <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#9CA3AF;margin:0 0 4px;">Date</p>
    <p style="font-size:13px;font-weight:600;color:#1A1A1A;margin:0;">[DATE]</p>
  </div>
  <div>
    <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#9CA3AF;margin:0 0 4px;">Due Date</p>
    <p style="font-size:13px;font-weight:600;color:#C0504D;margin:0;">[DUE_DATE]</p>
  </div>
  <div style="margin-left:auto;text-align:right;">
    <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#9CA3AF;margin:0 0 4px;">Amount Due</p>
    <p style="font-size:18px;font-weight:700;color:#1A1A1A;margin:0;letter-spacing:-0.5px;">[TOTAL]</p>
  </div>
</div>
```

### Line Item Table (with totals footer)
```html
<table style="width:100%;border-collapse:collapse;">
  <thead>
    <tr style="border-bottom:2px solid #E5E7EB;">
      <th style="padding:10px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#6B7280;text-align:left;width:6%;">#</th>
      <th style="padding:10px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#6B7280;text-align:left;width:44%;">Description</th>
      <th style="padding:10px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#6B7280;text-align:right;width:10%;">Qty</th>
      <th style="padding:10px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#6B7280;text-align:right;width:20%;">Rate ($)</th>
      <th style="padding:10px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#6B7280;text-align:right;width:20%;">Amount ($)</th>
    </tr>
  </thead>
  <tbody>
    <!-- rows -->
  </tbody>
  <tfoot>
    <tr style="border-top:1px solid #E5E7EB;">
      <td colspan="4" style="padding:8px 14px;font-size:12px;color:#6B7280;text-align:right;">Subtotal</td>
      <td style="padding:8px 14px;font-size:12px;color:#4B5563;text-align:right;">[SUBTOTAL]</td>
    </tr>
    <tr>
      <td colspan="4" style="padding:8px 14px;font-size:12px;color:#6B7280;text-align:right;">Tax ([RATE])</td>
      <td style="padding:8px 14px;font-size:12px;color:#4B5563;text-align:right;">[TAX]</td>
    </tr>
    <tr style="background:#E5E7EB;border-top:3px double #1A1A1A;">
      <td colspan="4" style="padding:11px 14px;font-size:14px;font-weight:700;color:#1A1A1A;text-align:right;">Total Due</td>
      <td style="padding:11px 14px;font-size:14px;font-weight:700;color:#1A1A1A;text-align:right;">[TOTAL]</td>
    </tr>
  </tfoot>
</table>
```

### Summary Metric Boxes (for budget/statement cover pages)
```html
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;">
  <div style="border:1px solid #E5E7EB;border-radius:6px;padding:12px 14px;">
    <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#9CA3AF;margin:0 0 6px;">[LABEL]</p>
    <p style="font-size:22px;font-weight:700;color:#1A1A1A;margin:0;letter-spacing:-0.5px;">[VALUE]</p>
    <p style="font-size:11px;font-weight:600;color:#2D7D46;margin:4px 0 0;">[VARIANCE]</p>
  </div>
</div>
```

### Payment Terms Box
```html
<div style="background:#F9FAFB;border-radius:6px;padding:16px 20px;margin-top:20px;">
  <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#9CA3AF;margin:0 0 10px;">Payment Terms</h3>
  <p style="font-size:12px;color:#4B5563;line-height:1.6;margin:0 0 6px;"><strong style="color:#1A1A1A;">Due:</strong> [TERMS — e.g., Net 30 from invoice date]</p>
  <p style="font-size:12px;color:#4B5563;line-height:1.6;margin:0 0 6px;"><strong style="color:#1A1A1A;">Method:</strong> [PAYMENT_METHOD]</p>
  <p style="font-size:12px;color:#4B5563;line-height:1.6;margin:0;"><strong style="color:#1A1A1A;">Account:</strong> [BANK_DETAILS]</p>
</div>
```

---

## Document Type → Page Pattern Mapping

Uses base patterns P1–P8 from business. Financial-specific guidance:

| Doc Type | Structure |
|---|---|
| Invoice | P1 cover (bill-to/from header variant) → Line item table → Payment terms (P7 callout) |
| Budget | P1 cover → Summary metrics + P3 revenue table → P3 expense table → P3 cash flow → P2 assumptions |
| Income Statement | P1 cover → P3 Revenue→Gross Profit → P3 OpEx→Net Income → P2 notes |
| Balance Sheet | P1 cover → P3 Assets → P3 Liabilities + Equity → P2 notes |
| Cash Flow Statement | P1 cover → P3 Operating → P3 Investing + Financing → P2 summary |
| Expense Report | P1 cover → Summary metrics → P3 line items → P5 approval signatures |

---

## Anti-Patterns

| What | Why |
|---|---|
| Minus sign for negatives | Parentheses: `(1,234)` — accounting convention |
| Numbers without commas | Unreadable: `1234567` → `1,234,567` |
| Mixed decimal precision in a column | All cells in a column must match |
| Currency symbol in every cell | Once in the column header |
| Left-aligned numbers | Always right-align |
| Missing totals | Every number column needs a sum |
| Missing accounting underlines | Subtotals: `2px solid`. Grand totals: `3px double` |
| Card layouts for financial data | Tables only — cards are for slides |
