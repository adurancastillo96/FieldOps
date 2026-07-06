# T003 — PWA Shell & Offline Storage

## Status
- [ ] Pending  /  [ ] In Progress  /  [ ] ✅ Completed

## Description
Design the frontend Progressive Web App shell. Implement Service Worker caching for offline availability and the IndexedDB persistence layer to handle offline workflows and capture queues.

## Acceptance Criteria (DoD)
- [ ] Create HTML shell with CSS styling reflecting rich, premium design (modern styling, clear layout tiles, responsive views).
- [ ] Implement `service-worker.js` caching resources under a Cache-First scheme. App is installable and fully loads offline.
- [ ] Build client-side storage engine using IndexedDB storing local capture records (work orders, steps progress, image blobs, voice parameters).
- [ ] Implement multi-step inspection UI workflow allowing navigation through steps (`site-overview`, `ont-before`, `ont-after-frontal`, `ont-after-closeup`, `power-meter`, `panoramic`).
- [ ] Steps display current status (completed/pending), guide text, and required evidence validation triggers.
- [ ] Implement mock Background Sync triggering queue synchronization when online connection is simulated.

## Dependencies
- `T002 — Mock Data Source & REST APIs`

## Scope
- Create: `src/static/index.html`
- Create: `src/static/css/styles.css`
- Create: `src/static/js/app.js`
- Create: `src/static/js/storage.js`
- Create: `src/static/service-worker.js`
- Modify: `src/main.py` (mount static directory for PWA delivery)

## Constraints
- Do not use bloated JS frameworks (e.g. React/Vue) - use vanilla JS with IIFE modules.
- Ensure all interactive buttons are gloved-hand friendly (minimum size 48x48dp).

## References
- `spec/requirements.md` — FR-001, FR-002, FR-004, FR-005, FR-006, FR-007, FR-008
- `spec/acceptance.md` — AC-001, AC-002, AC-003, AC-004, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012

## Implementation Notes
- Files created:
- Tests added:
- Notes:
