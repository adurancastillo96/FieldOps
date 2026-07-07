# T017 — Markdown Report Compilation & Download

## Status
- [ ] Pending  /  [ ] In Progress  /  [ ] Completed

## Description
Implement the client-side and server-side logic to compile completed/justified steps, audit results, coordinates, and serial numbers into a single Markdown-formatted installation report. Provide a local file-download mechanism directly in the PWA browser.

## Acceptance Criteria (DoD)
- **Report Generation**:
  - Compiles a formatted Markdown document showing work order ID, address, technician, overall verdict, and a checklist of steps with photo metadata, audit verdicts, and deviation logs.
- **Local Download**:
  - Tapping "Download Markdown Report" in the "Markdown Report" PWA tab triggers a local download of `{work_order_id}_report.md` with the compiled content.

## Scope
- Modify: `src/routes/work_orders.py` (Add `/api/v1/work-orders/{id}/report` endpoint)
- Modify: `src/static/js/app.js` (Render live report draft, implement local download trigger)

## Constraints
- Reports must be compiled in English.
