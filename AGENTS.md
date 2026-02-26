# AGENTS.md — HeavyOps ERP

> Universal agent context file. Read this before touching any file in this repo.
> Works with: Cursor, Claude Code, GitHub Copilot, ChatGPT (with file context), Windsurf.

---

## What This System Does

Multi-tenant SaaS ERP for Saudi construction and heavy equipment contractors.
Core value: real-time project P&L visibility — revenue minus equipment, diesel, and labor costs — updated on every daily log save.

Previous workflow: paper cards → WhatsApp → manual Excel at month-end.
This system replaces all of that.

---

## Domain Vocabulary (Use These Terms Exactly)

| Term | Meaning |
|---|---|
| `Shield` / `Loader` | Shield brand wheel loader. 700 SAR/day, 70 SAR/hr. Billed by actual hours. |
| `Backhoe` / `Excavator` | 600 SAR/day, 60 SAR/hr. Billed by actual hours. |
| `Crusher` | Rock crushing machine. 2,000 SAR/day (incl. generator, excl. diesel). Also billable per m³. |
| `Dump Truck` / `Trailer` | Has a cubic box. Revenue = loads per day × price per load. |
| `Daily Log` | One record per equipment unit per day. Contains: start/end hour meter, loads (trucks), diesel liters. |
| `Hour Meter` | Physical odometer on equipment. End reading must always > start reading. |
| `Billing Type` | Enum: `HOURLY` | `MONTHLY` | `CUBIC_METER` |
| `P&L Snapshot` | Calculated record stored per project, updated on every log save. Never computed ad-hoc in queries. |
| `Tenant` | One contracting company. Full data isolation. Each tenant sets its own rates. |
| `Iqama` | Saudi residence permit. A worker document type. |
| `TUV` | Safety/competency certificate. A worker document type. |
| `Quotation` | Has two PDF outputs: Client version (no costs) and Management version (with margin). |

---

## Tech Stack

```
Frontend:   React 18 + TypeScript + Tailwind CSS
Backend:    Node.js + Express (or Next.js API routes — TBD per lead dev)
Database:   PostgreSQL (multi-tenant via schema-per-tenant)
ORM:        Prisma
Auth:       JWT, role-based (RBAC), 8-hour session expiry
OCR:        Google Vision API (Arabic + English)
PDF:        Puppeteer (server-side HTML → PDF)
Storage:    S3-compatible (worker photos, document scans)
Hosting:    TBD — design for Docker/containerized deployment
```

---

## Monorepo Structure

```
/
├── apps/
│   ├── web/              # React frontend (desktop-first)
│   └── api/              # Express backend
├── packages/
│   ├── db/               # Prisma schema + migrations
│   ├── shared/           # Types, enums, constants shared FE+BE
│   └── pdf-templates/    # Quotation HTML templates (Client + Management)
├── AGENTS.md             # ← you are here
└── docs/
    └── PRD.md
```

---

## Data Model (Canonical — Match This Exactly)

### Core Entities

```prisma
// Tenant (one per company)
model Tenant {
  id            String    @id @default(cuid())
  name          String
  logoUrl       String?
  // Rate config (overridable per project)
  loaderDayRate    Decimal @default(700)
  loaderHourRate   Decimal @default(70)
  backhoeDay Rate  Decimal @default(600)
  backhoeHourRate  Decimal @default(60)
  crusherDayRate   Decimal @default(2000)
  workingHoursPerDay Int  @default(10)
  overtimeMultiplier Decimal @default(1.5)
  projects      Project[]
  workers       Worker[]
  equipment     Equipment[]
}

// Project
model Project {
  id          String      @id @default(cuid())
  tenantId    String
  name        String
  clientName  String
  location    String?
  billingType BillingType // HOURLY | MONTHLY | CUBIC_METER
  contractValue Decimal?
  startDate   DateTime
  endDate     DateTime?
  dieselIncluded Boolean  @default(false)
  status      ProjectStatus // ACTIVE | CLOSED | DRAFT
  plSnapshot  PLSnapshot?
  logs        DailyLog[]
  quotations  Quotation[]
  assignments EquipmentAssignment[]
}

// Equipment
model Equipment {
  id           String        @id @default(cuid())
  tenantId     String
  name         String
  type         EquipmentType // LOADER | BACKHOE | DUMP_TRUCK | CRUSHER
  plateOrCode  String
  cubicBoxM3   Decimal?      // Dump trucks only
  currentHours Decimal       @default(0) // Running hour meter total
  lastServiceAt Decimal      @default(0) // Hour meter at last 300h service
  dailyLogs    DailyLog[]
  maintenance  MaintenanceRecord[]
  expenses     ExpenseRecord[]
}

// Daily Log (core transactional record)
model DailyLog {
  id            String    @id @default(cuid())
  projectId     String
  equipmentId   String
  date          DateTime  @db.Date
  startHours    Decimal   // Hour meter start
  endHours      Decimal   // Hour meter end — MUST be > startHours
  actualHours   Decimal   // Computed: endHours - startHours
  loads         Int?      // Dump trucks only
  dieselLiters  Decimal?
  dieselCost    Decimal?
  operatorId    String?   // Worker reference
  notes         String?
  // Triggers PLSnapshot recalculation on save
}

// P&L Snapshot (pre-calculated, updated on every log save)
model PLSnapshot {
  id              String  @id @default(cuid())
  projectId       String  @unique
  totalRevenue    Decimal
  totalCostEquip  Decimal
  totalCostDiesel Decimal
  totalCostLabor  Decimal
  totalCostMaint  Decimal
  grossProfit     Decimal
  grossMarginPct  Decimal
  lastCalculatedAt DateTime @updatedAt
}

// Worker
model Worker {
  id          String    @id @default(cuid())
  tenantId    String
  fullName    String
  nationality String?
  jobTitle    String
  phone       String?
  photoUrl    String?
  baseSalary  Decimal
  overtimeRate Decimal?
  documents   WorkerDocument[]
  payroll     PayrollRecord[]
}

// Worker Document
model WorkerDocument {
  id           String       @id @default(cuid())
  workerId     String
  type         DocType      // IQAMA | PASSPORT | DRIVER_LICENSE | TUV
  docNumber    String
  expiryDate   DateTime
  scanUrl      String?
  ocrConfidence Decimal?    // 0-1, extracted from OCR response
  verifiedBy   String?      // User ID who confirmed OCR data
}

// Expense Record
model ExpenseRecord {
  id          String      @id @default(cuid())
  tenantId    String
  projectId   String?
  equipmentId String?     // NULL = unallocated (shows in admin review queue)
  date        DateTime
  type        ExpenseType // DIESEL | ENGINE_OIL | GREASE | OTHER
  quantity    Decimal
  unitCost    Decimal
  totalCost   Decimal
}

// Maintenance Record
model MaintenanceRecord {
  id          String   @id @default(cuid())
  equipmentId String
  date        DateTime
  hourMeterAt Decimal  // Hour meter reading at time of service
  nextDueAt   Decimal  // hourMeterAt + 300
  type        String   // "OIL_CHANGE" | "FILTER" | "GREASE"
  partsCost   Decimal
  technicianName String?
}

// Quotation
model Quotation {
  id          String   @id @default(cuid())
  projectId   String
  version     Int      @default(1)
  clientPdfUrl String?
  mgmtPdfUrl   String?
  lineItems   Json     // Array of { label, qty, unit, rate, total }
  estimatedMarginPct Decimal?
  createdAt   DateTime @default(now())
}
```

### Enums

```typescript
// packages/shared/enums.ts
export enum BillingType {
  HOURLY = 'HOURLY',
  MONTHLY = 'MONTHLY',
  CUBIC_METER = 'CUBIC_METER',
}

export enum EquipmentType {
  LOADER = 'LOADER',
  BACKHOE = 'BACKHOE',
  DUMP_TRUCK = 'DUMP_TRUCK',
  CRUSHER = 'CRUSHER',
}

export enum DocType {
  IQAMA = 'IQAMA',
  PASSPORT = 'PASSPORT',
  DRIVER_LICENSE = 'DRIVER_LICENSE',
  TUV = 'TUV',
}

export enum ExpenseType {
  DIESEL = 'DIESEL',
  ENGINE_OIL = 'ENGINE_OIL',
  GREASE = 'GREASE',
  OTHER = 'OTHER',
}

export enum ProjectStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',   // Anthropic-level, manages tenants
  TENANT_ADMIN = 'TENANT_ADMIN', // Company admin
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  SITE_SUPERVISOR = 'SITE_SUPERVISOR',
  ACCOUNTANT = 'ACCOUNTANT',
  HR_OFFICER = 'HR_OFFICER',
}
```

---

## Business Logic Rules (Never Violate These)

### Daily Log Validation
- `endHours` MUST be > `startHours`. Reject with 400 if not.
- `actualHours` = `endHours - startHours`. Never accept this from client — always compute server-side.
- If `actualHours > 12`, flag as warning in response but do not reject.
- If `actualHours > 24`, reject with 400.

### Billing Calculation (per log save)
```
HOURLY:
  if actualHours >= workingHoursPerDay → revenue = dayRate
  if actualHours < workingHoursPerDay  → revenue = actualHours × hourRate

MONTHLY:
  revenue = 0 on each log (billed as monthly fixed)
  hours still logged for maintenance tracking

CUBIC_METER (Crusher):
  revenue = m3Produced × agreedRatePerM3

DUMP_TRUCK (load-based):
  revenue = loads × pricePerLoad (set per project assignment)
```

### P&L Snapshot Update
- Triggered automatically after every `DailyLog` INSERT or UPDATE.
- Triggered after every `ExpenseRecord` INSERT linked to a project.
- Use a database trigger or a post-save service hook — never update inline in the API handler.
- Formula:
```
grossProfit = totalRevenue - totalCostEquip - totalCostDiesel - totalCostLabor - totalCostMaint
grossMarginPct = (grossProfit / totalRevenue) * 100
```

### Maintenance Alert
- Trigger warning when: `equipment.currentHours >= equipment.lastServiceAt + 280`
- Trigger critical when: `equipment.currentHours >= equipment.lastServiceAt + 300`
- On `MaintenanceRecord` save: set `equipment.lastServiceAt = hourMeterAt`
- `equipment.currentHours` updates on every `DailyLog` save: `currentHours += actualHours`

### Document Expiry Alerts
```
daysUntilExpiry = expiryDate - today

daysUntilExpiry <= 0   → status: EXPIRED   (critical, blocks payroll flag)
daysUntilExpiry <= 30  → status: WARNING
daysUntilExpiry <= 90  → status: NOTICE
else                   → status: OK
```

### Expense Allocation Rule
- Every `ExpenseRecord` with `equipmentId = NULL` is "unallocated."
- Unallocated expenses appear in an admin review queue.
- They are excluded from equipment-level P&L until assigned.
- They are included in project-level P&L as "unallocated overhead."

### OCR Intake Flow
1. Client uploads image → POST `/api/ocr/extract` with `workerId` + file
2. Server sends to Google Vision API
3. Extract: `docNumber`, `fullName`, `expiryDate`, `ocrConfidence`
4. If `ocrConfidence < 0.75` → return extracted fields with `requiresReview: true`
5. Client shows review UI for user to confirm/correct fields
6. On confirm → POST `/api/workers/:id/documents` with final data + `verifiedBy: userId`

---

## API Route Conventions

```
Base URL: /api/v1

Auth header: Authorization: Bearer <jwt>
Tenant resolved from JWT claim: tenantId

Naming:
  GET    /projects              → list (tenant-scoped)
  POST   /projects              → create
  GET    /projects/:id          → single
  PATCH  /projects/:id          → update (never PUT)
  DELETE /projects/:id          → soft delete only (set status=DELETED)

  GET    /projects/:id/pl       → P&L snapshot for project
  GET    /equipment/:id/pl      → P&L for one equipment unit

  POST   /daily-logs            → create log (triggers P&L recalc)
  GET    /daily-logs?projectId=&date=   → filtered list

  POST   /ocr/extract           → upload + extract document data
  POST   /quotations/:id/pdf    → generate both PDF versions, return URLs
```

Error format:
```json
{ "error": "VALIDATION_ERROR", "message": "endHours must be greater than startHours", "field": "endHours" }
```

---

## PDF Quotation Rules

Two versions generated from the same data. Both use company logo + branding from `Tenant.logoUrl`.

**Client PDF** contains:
- Project name, client name, date, validity period
- Equipment list: name, quantity, unit rate, subtotal
- Labor estimate: days × rate
- Total contract value
- Terms section
- NO cost data, NO margin

**Management PDF** adds:
- Cost breakdown per line item
- Estimated diesel cost
- Gross margin %
- Header: "CONFIDENTIAL — INTERNAL USE ONLY" in red

Templates live in `/packages/pdf-templates/`. Rendered via Puppeteer. Never use client-side PDF libs.

---

## Frontend Screens (V1)

| Screen | Route | Primary Role |
|---|---|---|
| Login | `/login` | All |
| Dashboard | `/` | All |
| Projects List | `/projects` | PM, Admin |
| Project Detail + P&L | `/projects/:id` | PM, Admin |
| Quotation Builder | `/projects/:id/quotation` | PM, Admin |
| Equipment Registry | `/equipment` | Admin |
| Daily Log Entry | `/logs/new` | Supervisor |
| Daily Log List | `/logs` | PM, Admin |
| Crusher Production Log | `/crusher/:id/logs` | Supervisor, PM |
| Worker List | `/workers` | HR, Admin |
| Worker Profile | `/workers/:id` | HR, Admin |
| Document Upload (OCR) | `/workers/:id/documents/upload` | HR, Admin |
| Payroll | `/payroll` | Accountant, Admin |
| Expense Entry | `/expenses/new` | Accountant, Supervisor |
| Maintenance Log | `/maintenance` | Admin |
| P&L Report — Project | `/reports/pl/project/:id` | PM, Accountant |
| P&L Report — Equipment | `/reports/pl/equipment` | Admin, Accountant |
| Tenant Settings | `/settings` | Tenant Admin |

---

## Role Permission Matrix

| Action | SUPER_ADMIN | TENANT_ADMIN | PROJECT_MANAGER | SITE_SUPERVISOR | ACCOUNTANT | HR_OFFICER |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Manage tenants | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create project | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View P&L | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Enter daily log | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Enter expenses | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Manage workers | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Run payroll | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Generate quotation PDF | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tenant settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Multi-Tenant Rules

- Every DB query MUST include `WHERE tenantId = :tenantId` (resolved from JWT).
- Prisma middleware enforces this globally — never bypass it.
- No cross-tenant data access, ever.
- Super admin accesses tenant data only via explicit tenant-switch with audit log.

---

## What NOT To Do

- Never compute P&L inline in a GET request. Always read from `PLSnapshot`.
- Never accept `actualHours` from the client. Always compute from `endHours - startHours`.
- Never hard-code rates. Always read from `Tenant` config or `EquipmentAssignment` override.
- Never soft-delete by setting a `deleted` boolean. Use `status = 'DELETED'` on entities that have a status field; add `deletedAt` timestamp on others.
- Never return unallocated expenses in equipment-level P&L.
- Never generate PDF on the client side. Always server-side via Puppeteer.
- Never send the Management PDF URL to anyone without `PROJECT_MANAGER` role or above.
- Never skip the OCR review step if `ocrConfidence < 0.75`.

---

## Open Questions (Unresolved — Do Not Implement These Until Decided)

1. **Owned vs rented equipment** — does the system model equipment the tenant owns (no rental cost) vs. equipment rented from a third party? Affects `ExpenseRecord` and `PLSnapshot` cost buckets.
2. **Quotation approval workflow** — internal approval before PDF is sent to client, or ad-hoc?
3. **Payroll output** — report-only, or push to external accounting system (Odoo / QuickBooks)?
4. **OCR provider** — Google Vision API vs AWS Textract. Evaluate Arabic accuracy with real Iqama samples before committing.