# Verification · course v2

Verified locally on 2026-09-09 after the final source changes:

- `npx tsc --noEmit` and `npm run build` passed.
- `python3 checks/textbook.py`: 24 delivered lessons, 48 answered self-test questions, consistent tables, working offline fragment targets and 3 embedded source-attributed images. The compiled text contains 28,153 Chinese characters. Print hooks expand answers; print layout has not been visually tested.
- `node checks/photo-math.mjs`: exposure equivalence, print dimensions, crop boundaries, identity adjustment, histogram and grayscale passed.
- `python3 checks/persistence.py`: local authentication rejection, cross-origin write rejection, invalid week, missing evidence rejection, old-record create/read, stale revision conflict, invalid lesson number rejection, new lesson/version edit/read and restoration of original local state passed. Production learner data was not used for synthetic tests.
- Local root HTTP returned 200. No browser UI testing was requested or performed. Photo import/download and page layout were reviewed in source, not exercised through browser UI.
- `git diff --check` passed. Database schema and existing migration remain unchanged.

## Scope and remaining limits

Course text, practice, self-assessment and correction instructions are available without external courses. Skill acquisition still requires actual shooting and project work; 24 weeks is a suggested first cycle.

Text progress and image references persist per account. Images in the lab are temporary browser data; download before leaving. Editing uses JPEG/PNG/WebP copies up to 2400 pixels on the long edge; sequence images use 720-pixel thumbnails. The lab does not decode RAW/HEIC or produce professionally color-managed print masters. AI critique is optional in conversation, not an in-site automatic feature. JSON export includes state and unsaved forms; automatic import is not implemented.

Optional read-only WebMCP progress tool is feature-detected. No supported WebMCP execution context was available, so registration and execution remain unverified; the user interface does not require it.

Publication status and exact deployed source are recorded in the parent workspace's RESUME-COURSE-V2.md after deployment completes.

## Interactive learning additions · 2026-09-14

- Added six-branch course mind map covering all 24 lessons, searchable 28-term table with examples/misconceptions and lesson links, 28 flashcards, 12 scenario decisions and a sourced-photo composition observation tool.
- `checks/learning-progress.mjs` passes spaced review scheduling, lapse reset, interval cap and malformed progress rejection. `checks/persistence.py` additionally verifies flashcard and scenario history save/read, rejects impossible scores and negative intervals, and restores the local original archive.
- TypeScript and final production build passed; local `/?view=learning` returned HTTP 200. The preview handoff was queued by the app. No browser interaction or visual QA was requested or performed.
- Existing records require no migration: learning progress is an optional field within the existing per-user JSON record. Flashcard ratings are self-assessment, not practical-skill certification. Guest practice, recall drafts and observation markers are explicitly temporary. Saving still uses account-scoped revision checking and readback.
