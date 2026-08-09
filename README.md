# ABC Insurance — Claims Processing UI

> **RFC / System Design Document** for a scalable, high-performance claims
> processing front-end. This is a Proof of Concept (PoC): the React UI is
> real and runnable, backed by a bundled lightweight Express BFF (mock backend).

**Status:** PoC · **Author:** Siva Rama Krishna · **Last updated:** 2026-08-08

---

## Problem Statement

ABC Insurance is modernizing a legacy claims system. The front-end must:

1. Display and manipulate **20,000+ claim records** with sorting, filtering, and
   row actions — without lag.
2. Enforce **role-based access control (RBAC)** on UI actions.
3. Let users open a **document workspace** to view and manipulate
   **100 MB – 1 GB** files without freezing the tab.
4. Match the provided **Figma** design language.

See [`docs/architecture.md`](docs/architecture.md) for diagrams.

---

## Section A — Component & Application Architecture

### A.1 Tech Stack Choice

| Concern        | Choice                      | Justification                                                                            |
| :------------- | :-------------------------- | :--------------------------------------------------------------------------------------- |
| Framework      | **React 18**                | Concurrent rendering, huge ecosystem, worker-friendly.                                   |
| Language       | **TypeScript**              | Type-safe worker message contracts and RBAC actions.                                     |
| Tooling        | **Vite**                    | Instant HMR, first-class `new URL(...)` **Web Worker** bundling, fast module resolution. |
| Styling        | **Tailwind CSS**            | Rapid, token-driven styling that maps 1:1 to Figma.                                      |
| Virtualization | **@tanstack/react-virtual** | Headless, tiny, keeps ~30 rows in the DOM.                                               |
| Server cache   | **@tanstack/react-query**   | Backs the grid via an infinite query over cursor-paginated pages.                        |
| Backend (mock) | **Express + TypeScript**    | Bundled BFF: pagination, RBAC-shaped routes, Range streaming, split jobs.                |
| Persistence    | **IndexedDB**               | Caches streamed 1 GB-file page chunks off the JS heap.                                   |
| Icons          | **lucide-react**            | Consistent, tree-shakeable icon set.                                                     |
| Routing        | **react-router-dom**        | Full-page workspace route unmounts the grid to free memory.                              |

> **Why not Next.js?** SSR adds little for an authenticated internal tool behind
> a login; the heavy lifting is client-side interactivity (virtualization,
> workers). Vite's SPA model keeps the mental model and bundle simple. If a
> public, SEO-sensitive landing page were prioritized, Next.js would be revisited.

### A.2 State Management Strategy

State is deliberately split by **ownership and lifetime** to avoid global
re-renders — critical when 20k rows are in memory.

| Tier             | Tool                                                                     | Owns                                                                                                                  |
| :--------------- | :----------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------- |
| **Global**       | Context/Store ([`src/store/RBACContext.tsx`](src/store/RBACContext.tsx)) | Current user role + `hasPermission`. In production: also active Claim Case ID and app config (Zustand/Redux Toolkit). |
| **Server cache** | React Query                                                              | Claims pages via `useInfiniteQuery` over the BFF (cursor pagination).                                                 |
| **Local**        | React state                                                              | Grid **viewport** (virtualizer), `search`/`sortKey`, workspace page/zoom/tab, optimistic comments.                    |

Keeping the grid **viewport** local means scrolling never touches global state,
so no unrelated component re-renders.

### A.3 RBAC (Role-Based Access Control)

- **Frontend enforcer (UI masking):** declarative wrapper
  [`<AuthorizedView action="delete">`](src/store/RBACContext.tsx) and the
  [`usePermissions()`](src/store/RBACContext.tsx) hook conditionally render/disable
  grid actions (Edit/Assign/Delete) and heavy document operations. A live role
  toggle (Adjudicator ↔ Viewer) demonstrates instant masking.
- **Backend as truth:** the frontend only hides pixels. The API **must**
  validate the JWT/session and the caller's role on **every** read/write. A
  masked button is a UX affordance, not a security boundary.

```tsx
// Adjudicator → all actions; Viewer → read-only
<AuthorizedView action='delete'>
  <DeleteButton claimId={claim.id} />
</AuthorizedView>
```

---

## Section B — Performance & Large Dataset Strategy (20,000+ Records)

### B.1 Grid Rendering — Virtualization

Rendering 20k rows = 20k × N DOM nodes → hundreds of thousands of nodes →
memory blowup and jank. We **virtualize**: only the ~30 rows intersecting the
viewport exist in the DOM ([`ClaimsDataGrid.tsx`](src/components/dashboard/ClaimsDataGrid.tsx)
via `useVirtualizer`). Memory footprint stays near-constant regardless of row
count.

### B.2 Where the Heavy Work Runs

Sorting/filtering 20k objects on the main thread drops frames — so the client
doesn't do it at all. **Search, filter and sort run on the server** (the bundled
Express BFF); the grid consumes them through a React Query **infinite query**
([`useClaims`](src/hooks/useClaims.ts)) and only ever holds the pages it has
scrolled. Search is debounced (300 ms); the main thread never touches 20k rows.

### B.3 Data Fetching (Implemented)

Cursor-style **server-side pagination** (`page`/`limit`) with server-side search
and sort, consumed via `useInfiniteQuery` and fed into the virtualizer — the
next page is fetched as the last row scrolls into view. Row actions still mask
in the UI via RBAC while the backend remains the source of truth.

### B.4 Trade-Offs Analysis

| Strategy            | Memory Footprint                  | Search & Filter Speed | User Experience                      |
| :------------------ | :-------------------------------- | :-------------------- | :----------------------------------- |
| **Virtualization**  | **Extremely Low** (~30 DOM nodes) | Instant (client-side) | Fluid scroll, single-page feel       |
| **Pagination**      | Low                               | Fast (server-side)    | Segmented, native browser behavior   |
| **Infinite Scroll** | High (if not virtualized)         | Medium                | Hard to reach footer, DOM bloat risk |

**Decision:** Virtualization for in-memory PoC; layer server-side cursor
pagination behind it for production scale.

---

## Section C — Massive Document Strategy (100 MB – 1 GB Files)

Loading a 1 GB file into memory freezes the tab. Strategy:

1. **Chunked loading & streaming (implemented)** — [`useDocumentStream`](src/hooks/useDocumentStream.ts)
   issues **HTTP Range requests** (`Range: bytes=…`) to the BFF, one ~1 MB slice
   per page, receiving `206 Partial Content`.
2. **IndexedDB cache (implemented)** — streamed chunks are stored in
   **IndexedDB** ([`idbCache.ts`](src/lib/idbCache.ts)); revisited pages load
   from cache, keeping large binary data off the JS heap.
3. **Web Workers (implemented)** — Merge/Rotate/Delete run in a background worker
   ([`documentProcessor.worker.ts`](src/workers/documentProcessor.worker.ts)),
   while **Split** runs as a real server job (`POST …/split` + poll `/jobs/:id`).
   The main thread stays at 60 FPS.
4. **Client-side PDF rendering (planned)** — with PDF.js + Canvas, render pages
   **lazily**; only viewport pages render. The PoC renders a styled mock page.
5. **Optimistic vs. Pessimistic updates**:
   - **Pessimistic** for Split/Merge/Delete — real progress bars, actions blocked
     until completion ([`PageActionsPanel.tsx`](src/components/workspace/PageActionsPanel.tsx)).
   - **Optimistic** for Comments/Annotations — the UI updates instantly and
     rolls back on failure ([`CommentsPanel.tsx`](src/components/workspace/CommentsPanel.tsx)).

**Memory note:** selecting a row navigates to a dedicated full-page route
(`/claims/:claimId/workspace`), which **unmounts the 20k grid**, freeing memory
and giving document operations the full viewport.

---

## Proof of Concept — What's Implemented

- ✅ Virtualized 20k-row grid backed by a **server-side paginated** API (React
  Query infinite query) with debounced server search/sort.
- ✅ RBAC masking with a live Adjudicator/Viewer toggle.
- ✅ Full-page master–detail Document Workspace with a smooth route transition.
- ✅ Document pages streamed via **HTTP Range requests** and cached in
  **IndexedDB** (off-heap).
- ✅ **Split** as a real server job; Merge/Rotate/Delete in a Web Worker;
  optimistic comments with rollback.
- ✅ Bundled **Express BFF** (pagination, Range streaming, split jobs).
- ✅ Tailwind styling mapped to the Figma design language.

---

## Repository Structure

```text
abc-insurance-claims/
├── .github/                # CI workflow + PR template
├── docs/                   # Architecture diagrams (Mermaid)
├── server/                 # Express BFF (pagination, Range streaming, jobs)
├── src/
│   ├── components/         # UI (layout, dashboard, workspace)
│   ├── hooks/              # useClaims, useDocumentStream
│   ├── lib/                # API client + IndexedDB cache
│   ├── pages/              # DashboardPage, DocumentWorkspace
│   ├── store/              # RBAC context / access control
│   ├── workers/            # documentProcessor.worker
│   ├── data/               # Mock claim/document generators + types
│   └── types/              # Shared types
├── README.md               # This document
└── package.json
```

## Getting Started

```bash
# API — terminal 1
cd server && npm install && npm run dev   # http://localhost:3001

# App — terminal 2
npm install
npm run dev      # http://localhost:5173  (proxies /api → :3001)
npm run lint
npm run build
```

---

## Future Work

- Serve a real linearized PDF and render it with **PDF.js + Canvas** (viewport
  page virtualization) instead of the mock page.
- Real auth: issue/verify **JWTs** and enforce RBAC on every BFF route.
- Push **job completion over WebSockets** instead of polling `/jobs/:id`.
- Promote the RBAC context to Zustand and add the global active Claim Case ID.
