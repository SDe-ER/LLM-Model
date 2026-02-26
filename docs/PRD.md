# PRD: Heavy Equipment & Construction Project Management ERP

## Summary

SaaS ERP for Saudi construction and crushing contractors. Solves the core problem: operators cannot determine project profitability until weeks after close, because equipment hours, diesel consumption, and rental costs live on paper. The system centralizes daily field logs, auto-calculates P&L per project in real time, manages worker compliance documents with OCR, and generates branded client quotations as PDF. Desktop-first. Multi-tenant with per-tenant pricing configuration.

---

## Problem

- No real-time project P&L visibility
- Equipment hours tracked on paper cards, entered manually at month-end
- Rental cost verification impossible without digital records
- Worker document expiry discovered after fines, not before
- Quotations built manually in Excel with no link to actuals for future estimation

---

## Users

| Role | Responsibility |
|---|---|
| System Admin (Office) | Tenant setup, user management, master data |
| Project Manager | Create projects, quotations, view P&L |
| Site Supervisor | Daily log entry (hours, loads, diesel) |
| Accountant | Payroll, expense allocation, financial reports |
| HR Officer | Worker profiles, document management |

---

## Scope — V1 vs Deferred

### V1 (Must Ship)

- Multi-tenant architecture with per-tenant rate configuration
- Project creation with 3 billing types
- Daily equipment log entry (desktop)
- Real-time project P&L dashboard
- Branded PDF quotation generation
- Worker profiles with OCR document intake + expiry alerts
- Diesel and consumable expense allocation to equipment/crusher
- Preventive maintenance tracker (300-hour trigger)
- Payroll: salary, overtime, deductions

### Deferred (Post-V1)

- Mobile app for site supervisors
- Client portal for quotation approval
- API integrations (accounting software)
- Advanced ML-based fuel anomaly detection

---

## Project Types & Billing Logic

### Type 1 — Hourly Rental

Equipment billed by actual hours logged daily.

| Equipment | Day Rate | Hourly Rate | Billing Basis |
|---|---|---|---|
| Shield (Loader) | 700 SAR / 10hr day | 70 SAR/hr | Actual hours logged |
| Backhoe (Excavator) | 600 SAR / 10hr day | 60 SAR/hr | Actual hours logged |

Rule: if actual hours < 10, bill at hourly rate × actual hours. If ≥ 10, bill full day rate.

### Type 2 — Monthly Rental

Fixed monthly fee per equipment unit. Hours still logged for maintenance tracking and internal cost analysis. No revenue calculation based on hours.

### Type 3 — Per Cubic Meter (Crusher)

| Billing Option | Rate |
|---|---|
| Daily rental | 2,000 SAR/day (includes generator, excludes diesel) |
| Per cubic meter | Configurable per project agreement |

Trailer/Dump Truck sub-type: revenue calculated as number of loads × price per load (configurable per project). Cubic box volume per trailer is stored as a field on the equipment record.

---

## Core Modules

### 1. Projects & Quotations

**Project Record fields:**
- Project name, client, location
- Billing type (Hourly / Monthly / Cubic Meter)
- Start/end date, contract value
- Assigned equipment list (with per-project rate overrides)
- Assigned workers
- Diesel inclusion flag (affects quotation cost model)

**Quotation:**
- Auto-generated from project record
- Two outputs: Client version (no cost breakdown) and Management version (with full cost and margin)
- PDF export with company branding (logo, colors, header/footer)
- Line items: equipment, labor estimate, diesel estimate, crusher rental
- Linked to project actuals post-award for variance tracking

### 2. Equipment Daily Log

One form per equipment unit per day.

**Fields:**
- Date, project, equipment ID
- Start hour meter reading, end hour meter reading
- Calculated hours = end − start
- Number of loads (trailers only)
- Diesel filled (liters), diesel cost
- Operator name
- Notes / downtime reason

**Validations:**
- End reading must be > start reading
- Hours cannot exceed 24
- Warning if hours > 12 (possible entry error)

**Outputs:**
- Daily hours feed into billing calculation automatically
- Hours accumulate toward 300-hour maintenance trigger

### 3. Crusher Management

- Crusher assigned to project with billing type (daily or per m³)
- Daily log: production in m³, operating hours, diesel consumed (liters), generator hours
- Cost allocation: diesel cost split between crusher and generator per hour ratio
- Revenue: if per-m³, revenue = m³ produced × agreed rate

### 4. Worker Profiles & Document Management

**Profile fields:**
- Full name, nationality, job title, phone
- Photo upload
- Salary details: base, overtime rate, allowances

**Document types supported:**
- Iqama (Saudi Residence Permit)
- Passport
- Driver's License
- TUV / Safety Certificate

**OCR intake flow:**
1. User uploads image/scan of document
2. System calls OCR engine, extracts: document number, name, expiry date
3. User reviews and confirms extracted fields
4. Falls back to manual entry if OCR confidence < threshold

**Expiry alert rules:**
- 90 days before expiry: informational alert on dashboard
- 30 days before expiry: warning notification to HR Officer
- 0 days (expired): critical alert, worker flagged on payroll screen

### 5. Payroll & Performance

**Monthly payroll cycle:**
- Base salary
- Overtime: hours × overtime rate (configurable multiplier, default 1.5×)
- Deductions: absence days, advances
- Bonuses: performance-based, manual entry

**Performance evaluation:**
- Rating scale 1–5 per category (attendance, output, safety)
- Evaluation linked to bonus recommendation
- History retained per worker

**Payroll output:** printable payslip per worker, monthly payroll summary report

### 6. Operating Expenses & Fuel

**Expense types:**
- Diesel (linked to equipment log entry)
- Engine oil (allocated to specific equipment)
- Grease (allocated to specific equipment)
- Oil drum tracking: drum opened → assigned to equipment → consumption calculated

**Allocation rules:**
- Every expense record must have: date, equipment/crusher ID, quantity, unit cost, total cost, project
- Expenses with no equipment assignment flag as "unallocated" and appear in admin review queue

**Reports:**
- Fuel consumption per equipment (liters/hour efficiency metric)
- Most fuel-consuming equipment ranking
- Monthly consumables cost per equipment

### 7. Preventive Maintenance

**Trigger:** every 300 operating hours since last service

**Maintenance record fields:**
- Equipment ID, date, hour meter at service
- Service type: oil change, filter change, grease service
- Parts used (quantity + cost)
- Technician name
- Next service due = current hour meter + 300

**Alert behavior:**
- 20 hours before due: warning on dashboard and equipment log screen
- Overdue: critical badge on equipment record, supervisor blocked from logging until acknowledged

### 8. P&L Analytics

**Project P&L — real-time:**

```
Revenue
  + Equipment billing (hours × rate or loads × rate or m³ × rate)
  + Crusher billing (daily or m³)

Direct Costs
  - Equipment rental costs (if rented, not owned)
  - Diesel consumed (all equipment on project)
  - Oil and lubricants allocated to project
  - Labor cost (salaries pro-rated to project by assigned days)
  - Maintenance costs during project period

Gross Profit = Revenue − Direct Costs
Gross Margin % = Gross Profit / Revenue × 100
```

**Equipment-level P&L:**
- Revenue generated by each unit
- Total cost (diesel + maintenance + rental if applicable)
- Net contribution per equipment unit
- Ranked list: most profitable → least profitable equipment

**Dashboard KPIs (main screen):**
- Active projects count
- Total revenue MTD
- Total cost MTD
- Gross margin % MTD
- Equipment with overdue maintenance (count)
- Workers with expiring documents within 30 days (count)

---

## Multi-Tenant Architecture

- Each tenant = isolated data schema
- Tenant admin configures: equipment rates, overtime multiplier, working hours per day, currency display, company branding for PDFs
- Rates configured at tenant level, overridable at project level
- No cross-tenant data access
- Super-admin panel: tenant list, subscription status, usage metrics

---

## Data Model (Key Entities)

```
Tenant
  └── Users (role-based)
  └── Equipment
        └── DailyLogs
        └── MaintenanceRecords
        └── FuelExpenses
  └── Projects
        └── ProjectEquipmentAssignment
        └── Quotations
        └── PLSnapshot (calculated, updated on each log save)
  └── Workers
        └── Documents
        └── PayrollRecords
  └── ExpenseRecords
  └── CrusherProduction
```

---

## Non-Functional Requirements

| Requirement | Target |
|---|---|
| Page load (dashboard) | < 2 seconds |
| PDF generation | < 5 seconds |
| OCR response time | < 10 seconds |
| Uptime | 99.5% monthly |
| Data backup | Daily automated, 30-day retention |
| Languages | Arabic (RTL primary), English toggle |
| Browser support | Chrome, Edge (latest 2 versions) |
| Session security | JWT, 8-hour expiry, role-based route guards |

---

## OCR Technical Requirement

- Arabic and English document support required
- Recommended: Google Vision API or AWS Textract (Arabic support confirmed)
- Minimum extracted fields: document number, full name, expiry date
- Confidence score stored with each extraction; low-confidence fields highlighted for manual review

---

## PDF Quotation Spec

**Client version contains:**
- Company logo and branding
- Project name, client name, date
- Equipment list with quantities and unit rates
- Labor estimate (days × rate)
- Total project value
- Terms and validity period
- No cost/margin data

**Management version adds:**
- Cost breakdown per line item
- Estimated diesel cost
- Estimated gross margin %
- Marked "CONFIDENTIAL — INTERNAL USE ONLY"

---

## Screens List (V1)

1. Login / Tenant selector
2. Main Dashboard (KPIs, alerts)
3. Projects list + Project detail
4. Quotation builder + PDF preview
5. Equipment registry
6. Daily log entry form
7. Crusher production log
8. Worker profile list + profile detail
9. Document upload + OCR review
10. Payroll monthly cycle screen
11. Expense entry + allocation
12. Maintenance log + alert list
13. P&L report (project level)
14. P&L report (equipment level)
15. Tenant settings (rates, branding, users)

---

## Open Questions (Decisions Required Before Build)

1. **OCR provider selection** — Google Vision vs AWS Textract. Cost and Arabic accuracy tradeoff needs evaluation with sample documents.
2. **Owned vs rented equipment** — Does the system need to model equipment the company owns (no rental cost) separately from equipment they rent from third parties? This affects cost calculation logic.
3. **Quotation approval workflow** — Does the client quotation require internal approval before PDF is sent, or is it ad-hoc?
4. **Payroll integration** — Is payroll output a report only, or must it push to an external accounting system (e.g., Odoo, QuickBooks)?