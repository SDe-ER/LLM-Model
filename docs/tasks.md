# HeavyOps ERP — Project Milestones & Tasks

---

## M1: Foundation

### Database & Architecture
- [ ] Set up PostgreSQL with schema-per-tenant isolation
- [ ] Create Prisma schema with all entities (Tenant, User, Project, Equipment, Worker, DailyLog, etc.)
- [ ] Implement Prisma middleware for automatic tenantId filtering
- [ ] Create migration scripts for initial schema

### Authentication & Authorization
- [ ] Implement JWT authentication with 8-hour expiry
- [ ] Build role-based access control (RBAC) middleware
- [ ] Create user registration/login API endpoints
- [ ] Implement tenant resolution from JWT claims

### UI Shell
- [ ] Set up Next.js project with Tailwind CSS
- [ ] Create base layout with sidebar navigation
- [ ] Build login page with tenant selector
- [ ] Implement protected route guards
- [ ] Create loading states and error boundaries

---

## M2: Core Entities

### Projects
- [ ] Project CRUD API (list, create, update, soft-delete)
- [ ] Project list view with filters (status, billing type)
- [ ] Project detail page with tabs
- [ ] Project status management (DRAFT → ACTIVE → CLOSED)

### Equipment
- [ ] Equipment CRUD API
- [ ] Equipment registry view with type filters
- [ ] Equipment detail page showing: current hours, last service, maintenance status
- [ ] Equipment type handling (LOADER, BACKHOE, DUMP_TRUCK, CRUSHER)
- [ ] Cubic box volume field for dump trucks

### Workers
- [ ] Worker CRUD API
- [ ] Worker list view with search
- [ ] Worker profile page with photo upload
- [ ] Salary fields: base, overtime rate, allowances

### Assignments
- [ ] Project-equipment assignment with rate overrides
- [ ] Project-worker assignment
- [ ] Assignment conflict detection

---

## M3: Daily Operations

### Daily Log Entry
- [ ] Daily log API with validation (endHours > startHours, hours ≤ 24)
- [ ] Server-side actualHours calculation (never from client)
- [ ] Daily log entry form (date, equipment, start/end meter, loads, diesel)
- [ ] Warning display if hours > 12
- [ ] Hour meter validation UI feedback

### Diesel & Expenses
- [ ] Expense CRUD API with equipment/project allocation
- [ ] Expense entry form with type selection
- [ ] Unallocated expense queue for admin review
- [ ] Diesel consumption per equipment report

### Maintenance
- [ ] Maintenance record API
- [ ] Maintenance log entry form
- [ ] 300-hour trigger logic (warning at 280h, critical at 300h)
- [ ] Maintenance alert badges on equipment records
- [ ] Equipment currentHours auto-update on log save

### Crusher Management
- [ ] Crusher production log (m³, operating hours, diesel, generator hours)
- [ ] Diesel cost split between crusher and generator

---

## M4: Worker Compliance

### Document Management
- [ ] Document upload API with S3 storage
- [ ] Document types: IQAMA, PASSPORT, DRIVER_LICENSE, TUV
- [ ] Document list view on worker profile

### OCR Integration
- [ ] Google Vision API integration
- [ ] OCR extraction endpoint (docNumber, fullName, expiryDate)
- [ ] Confidence score storage
- [ ] Manual review UI for low-confidence extractions (< 0.75)
- [ ] Verified-by tracking

### Expiry Alerts
- [ ] Expiry calculation job (daily)
- [ ] 90-day notice alerts on dashboard
- [ ] 30-day warning notifications
- [ ] Expired worker flag on payroll screen

---

## M5: Financial Engine

### Payroll
- [ ] Payroll record API
- [ ] Monthly payroll cycle screen
- [ ] Overtime calculation (hours × overtime rate × multiplier)
- [ ] Deductions entry (absence, advances)
- [ ] Bonus entry
- [ ] Payslip generation

### P&L Calculation
- [ ] PLSnapshot model and update triggers
- [ ] Revenue calculation by billing type:
  - HOURLY: hours × rate or day rate
  - MONTHLY: fixed (hours for tracking only)
  - CUBIC_METER: m³ × rate
  - DUMP_TRUCK: loads × pricePerLoad
- [ ] Cost aggregation (equipment, diesel, labor, maintenance)
- [ ] Gross profit and margin calculation

### Dashboard KPIs
- [ ] Active projects count
- [ ] Total revenue MTD
- [ ] Total cost MTD
- [ ] Gross margin % MTD
- [ ] Overdue maintenance count
- [ ] Expiring documents count

---

## M6: Quotations & Reports

### Quotation Builder
- [ ] Quotation API linked to project
- [ ] Line items management (equipment, labor, diesel, crusher)
- [ ] Version tracking
- [ ] Quotation builder UI

### PDF Generation
- [ ] Puppeteer setup for server-side PDF
- [ ] Client PDF template (no costs/margin)
- [ ] Management PDF template (full costs + margin + CONFIDENTIAL header)
- [ ] Company branding injection (logo, colors)
- [ ] PDF storage and URL generation

### Reports
- [ ] Project P&L report view
- [ ] Equipment P&L report (ranked by profitability)
- [ ] Fuel consumption report (liters/hour)
- [ ] Monthly consumables cost report

---

## M7: Polish & Ship

### Tenant Settings
- [ ] Tenant settings API
- [ ] Rate configuration UI (loader, backhoe, crusher day/hour rates)
- [ ] Working hours per day setting
- [ ] Overtime multiplier setting
- [ ] Company branding upload (logo)

### Internationalization
- [ ] Arabic RTL layout support
- [ ] English/Arabic toggle
- [ ] Arabic date/number formatting

### Performance & Deployment
- [ ] Database indexing (tenantId, projectId, date)
- [ ] API response caching
- [ ] Docker containerization
- [ ] CI/CD pipeline setup
- [ ] Production deployment
- [ ] Daily backup automation

---

## Deferred (Post-V1)

- Mobile app for site supervisors
- Client portal for quotation approval
- Accounting software integrations (Odoo, QuickBooks)
- ML-based fuel anomaly detection
