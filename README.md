# ABC Insurance — Claims Processing UI

> **RFC / System Design Document** for a scalable, high-performance claims
> processing front-end. This is a Proof of Concept (PoC): the UI and
> client-side architecture are real and runnable; the backend is mocked.

**Status:** PoC · **Author:** Senior UI/Frontend Architect · **Last updated:** 2026-08-08

---

## 0. Problem Statement

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
| Server cache   | **@tanstack/react-query**   | Cursor pagination + caching (wired for the real API).                                    |
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
| **Server cache** | React Query                                                              | Claims pages, claim detail — cursor-based pagination cache.                                                           |
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

### B.2 Avoiding Main-Thread Jank

Sorting/filtering 20k objects (`localeCompare`, etc.) on the main thread drops
frames. We offload **search + filter + sort** to a **Web Worker**
([`claimsWorker.ts`](src/workers/claimsWorker.ts)) behind the
[`useClaimsProcessor`](src/hooks/useClaimsProcessor.ts) hook, using a typed
request/response contract and a monotonic `requestId` to discard stale results.
The UI stays at 60 FPS while typing.

### B.3 Data Fetching (Production)

Propose **cursor-based server-side pagination** + **infinite scroll** feeding
the virtualizer (windowed rendering), cached by React Query. The same
`ProcessRequest` worker contract can be swapped for an API call with **zero grid
changes**.

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

1. **Chunked loading & streaming** — fetch via **HTTP Range Requests**
   (`Range: bytes=0-1048576`), pulling only what the viewport needs.
2. **Web Workers** — offload parse/split/merge of binary data to a background
   thread ([`documentProcessor.worker.ts`](src/workers/documentProcessor.worker.ts)),
   keeping the main thread at 60 FPS. The PoC simulates a 1 GB job streaming
   progress ticks back to the UI.
3. **Client-side PDF rendering** — with PDF.js + Canvas, render pages **lazily**;
   only pages in the viewport render (page-level virtualization). The PoC mocks
   the page canvas + Page X of Y + zoom.
4. **Optimistic vs. Pessimistic updates**:
   - **Pessimistic** for Split/Merge/Delete — real progress bars, actions blocked
     until the worker completes ([`PageActionsPanel.tsx`](src/components/workspace/PageActionsPanel.tsx)).
   - **Optimistic** for Comments/Annotations — the UI updates instantly and
     rolls back on failure ([`CommentsPanel.tsx`](src/components/workspace/CommentsPanel.tsx)).

**Memory note:** selecting a row navigates to a dedicated full-page route
(`/claims/:claimId/workspace`), which **unmounts the 20k grid**, freeing memory
and giving document operations the full viewport.

---

## Proof of Concept — What's Implemented

- ✅ Virtualized 20k-row claims grid with instant search/sort (worker-powered).
- ✅ RBAC masking with a live Adjudicator/Viewer toggle.
- ✅ Full-page master–detail Document Workspace with a smooth route transition.
- ✅ Two Web Workers (dataset processing + 1 GB document processing) sharing a
  typed message contract.
- ✅ Optimistic comments + pessimistic page operations with progress.
- ✅ Tailwind styling mapped to the Figma design language.

---

## Repository Structure

```text
abc-insurance-claims-ui/
├── .github/                # CI workflow + PR template
├── docs/                   # Architecture diagrams (Mermaid)
├── src/
│   ├── components/         # UI (layout, dashboard, workspace)
│   ├── hooks/              # useClaimsProcessor (worker bridge)
│   ├── pages/              # DashboardPage, DocumentWorkspace
│   ├── store/             # RBAC context / access control
│   ├── workers/            # claimsWorker + documentProcessor.worker
│   ├── data/               # Mock claims + document generators
│   └── types/              # Shared types
├── README.md               # This document
└── package.json
```

## Getting Started

```bash
npm install
npm run dev      # http://localhost:5173
npm run lint
npm run build
```

---

## Future Work

- Replace mock generators with React Query + cursor pagination against the real
  API.
- Integrate PDF.js Canvas rendering with viewport page virtualization.
- Wire Range-request streaming into the document worker.
- Promote the RBAC context to Zustand and add the global active Claim Case ID.
