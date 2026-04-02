# Flash — Architecture Decisions

## ADR-001: Vanilla HTML/CSS/JS, no framework, no bundler

**Decision:** Plain HTML, CSS, and JS. No React, Vue, Svelte, or build tooling.

**Reasoning:** The MVP is a small, single-screen app with no complex state management. A framework adds dependency surface area and build complexity without buying anything at this scale.

**Revisit when:** the app grows to multiple routes, shared state becomes hard to manage, or a backend integration makes a framework's ecosystem valuable.

---

## ADR-002: Hand-rolled CSS, no utility framework

**Decision:** One `style.css` file, written by hand.

**Reasoning:** Visual design is a first-class concern (Anki's poor UX is the reason this app exists). Hand-rolled CSS gives full control with zero build step. Tailwind via CDN would add a network dependency and restrict design flexibility.

**Revisit when:** the stylesheet grows unwieldy or a design system is needed across multiple surfaces.

---

## ADR-003: Google Sheets as data source via `gviz/tq`

**Decision:** Fetch data from public Google Sheets using the unauthenticated `gviz/tq` endpoint.

**Reasoning:** No API key, no backend, no OAuth flow. The sheet owner controls the data and can update decks without touching the app. One Sheets file, one tab per deck.

**Expected URL shape:**
```
https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:json&sheet={tabName}
```

**Revisit when:** Google deprecates the endpoint, or decks need to be private (requires OAuth).

---

## ADR-004: Monorepo

**Decision:** Frontend and future backend live in one repository.

**Reasoning:** Features that span frontend and backend (e.g. spaced repetition) can be delivered in a single PR. Separate repos add coordination overhead with no benefit for a small project.

**Structure:**
```
flash/
  frontend/    ← current MVP
  backend/     ← placeholder, not yet implemented
  docs/
```

---

## ADR-005: GitHub Pages + GitHub Actions for hosting and CI/CD

**Decision:** Static frontend hosted on GitHub Pages, deployed via GitHub Actions from the `frontend/` folder on push to `main`.

**Reasoning:** Zero infrastructure to manage, free for public repos, deploy in ~30 seconds. Fits a no-build-step static site perfectly.

**Revisit when:** a backend is introduced — at that point CloudFront + S3 (AWS) or Vercel/Netlify become more natural fits.

---

## ADR-006: Backend — Supabase

**Decision:** Supabase for database, auth, and API when the backend is built.

**Reasoning:**
- Postgres handles spaced repetition queries (e.g. cards due before date X) trivially, without the composite index workarounds Firestore requires
- Auth is significantly better DX than Cognito, which has been painful in other contexts
- Auto-generated REST API means no API Gateway / Lambda layer needed for standard CRUD
- CLI-based migration workflow keeps schema changes in git
- Local Docker stack (`supabase start`) provides a proper dev environment without a second cloud project, working around the free tier's 2-project limit
- Flat monthly cost ($25/month Pro if needed) scales comfortably to hundreds of users without surprise bills; free tier is viable while the course is actively running
- Media (images, audio) will be hosted on S3 + CloudFront and referenced by URL, keeping Supabase storage usage minimal

**Data model:** `collections → decks → cards`, with a separate `reviews` table for per-user spaced repetition state (interval, ease factor, due date).

**Ruled out:**
- AWS (Lambda + API Gateway + DynamoDB + Cognito) — familiar but Cognito DX is a known pain point; no meaningful cost advantage at this scale
- Firebase — Firestore query limitations for date-range queries; no SQL experience gained
- Long-running servers (Heroku, Render, Fly.io) — unnecessary for this workload

**Triggers for revisiting:** Supabase pricing changes materially, or the project scales beyond what the Pro tier handles comfortably.

---

## ADR-007: No tests for MVP

**Decision:** No test suite in the MVP.

**Reasoning:** The app is small, visual, and has no backend logic to unit test. The cost of setting up a test framework outweighs the benefit at this stage.

**Revisit when:** the app is stable enough that regressions become a real concern. Playwright E2E is the preferred path — no bundler required, tests the real browser experience.
