# BITVERSE — Product Requirements Doc

## Problem Statement
Build BITVERSE — a premium, futuristic full-stack digital academic library exclusively for First Year students of Birla Institute of Technology, Mesra. Dark cyber-academic theme with neon cyan identity (#00E5D4) inspired by the BITVERSE logo (open book + rising triangles).

## Users
- **First Year BITians** — browse notes, PYQs, syllabus and resources with zero friction (no login)
- **Content maintainers** — upload files & links via the open Admin panel

## Tech Stack (delivered)
- Frontend: React 19 + Tailwind + Framer/CSS animations + shadcn primitives
- Backend: FastAPI + MongoDB (Motor)
- Storage: Emergent Object Storage (via EMERGENT_LLM_KEY)
- Fonts: Chakra Petch (display), Outfit (body), JetBrains Mono (accent)

## Implemented (2026-02)
- Backend REST API (all `/api/*`):
  - Meta: `GET /`, `GET /stats`
  - Subjects: list/create/get/delete + cascade
  - Modules: list/create/get/delete per subject
  - Files: upload (multipart), list with rich filters (category, subject_id, module_id, semester, pyq_type, resource_type), view (inline), download (attachment), rename (PATCH), soft-delete
  - Resources: list/create/delete (external links: books/YouTube/coding/semester/importantLink)
  - Startup auto-seed of 20 subjects (10 per semester) × 5 modules each
- Frontend pages:
  - `/` Home with animated logo glow, hero, animated counters, 4 quick-access glass cards, highlight strip
  - `/notes` semester picker → `/notes/sem/:sem` → `/notes/subject/:id` → `/notes/module/:id`
  - `/pyqs` subject grid → `/pyqs/subject/:id` with Mid/End/Solutions tabs
  - `/syllabus` full first-year curriculum with credits + downloadable syllabi
  - `/resources` 5-tab library (Books/YouTube/Coding/Semester/Links) + file uploads per category
  - `/about` and open `/admin` dashboard with 5 tabs (Notes upload, PYQ upload, Syllabus upload, Resources upload+link, Manage subjects/modules) and inline file/link management
  - `/viewer/:fileId` in-browser viewer (PDF iframe, Office Online for PPT/DOC, native image viewer)
- Global: fixed glass navbar, sticky mobile bottom nav (🏠 📚 📄 📖 🎥), animated starfield + floating triangles + aurora blur + mouse-follow spotlight backdrop, glass footer with GitHub/contact
- All interactive elements carry unique `data-testid`s

## Testing (iteration_1.json)
- Backend: 13/13 pytest tests passed (100%)
- Frontend: full e2e navigation + upload flows verified (100%)
- No blocking issues.

## P1 / Next
- Search + tag filtering across files
- Bulk upload + drag-and-drop in Admin
- Optional simple password gate on `/admin`
- Analytics (most-downloaded, trending subjects)
- Announcements / "What's new" strip
- Dark/Light theme toggle (currently dark-only per spec)

## P2 / Later
- Contributor credits + upload attribution
- File versioning (replace-while-keeping-history)
- CDN caching layer for large PDFs
