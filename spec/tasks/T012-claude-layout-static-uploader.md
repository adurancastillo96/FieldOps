# T012 — Claude-Style UI/UX and Static Photo Uploader

## Status
- [ ] Pending  /  [ ] In Progress  /  [ ] Completed

## Description
Redesign the Right panel tabs of the Claude layout to replace real-time streaming camera controls with a static photo file uploader, file drag-and-drop zone, and captured photo preview overlay. The interface must remain strictly in English and provide clean visual feedback.

## Acceptance Criteria (DoD)
- **UI Grid Adjustments**:
  - The right-hand column contains the new tabs: "Camera / Upload", "Captured Photo", "Route Map", "Audit Verdicts", and "Markdown Report".
- **Step-by-Step Guided Uploader**:
  - Displays the current step name (Fiber Bend Radius, OPM, Device Label, Labeling/Enclosure) and instructions.
  - Houses a drag-and-drop file uploader zone and a standard `<input type="file" accept="image/*">` file input selector.
  - Displays a progress bar and navigation buttons (Next/Back), where "Next" is locked until the step passes audit or a justification is registered.

## Scope
- Modify: `src/static/index.html` (Re-label tabs, update uploader HTML nodes)
- Modify: `src/static/css/styles.css` (Style the file uploader drop-zone, pass/fail badge, and report container)
- Modify: `src/static/js/app.js` (Track step upload state, handle files selection, update tab displays)

## Constraints
- Follow conventions in `.agents/rules/coding.md`
- UI must follow premium, responsive glassmorphism styles.
