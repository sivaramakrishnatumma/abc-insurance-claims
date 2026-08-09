# Architecture Diagrams

Visual companions to the system design in [`../README.md`](../README.md). All
diagrams render natively on GitHub via Mermaid.

---

## 1. System Flow (High Level)

How a request flows from the UI through the app shell to the Express BFF, the
IndexedDB cache, and the document worker.

```mermaid
flowchart LR
  subgraph Browser["Browser Tab"]
    subgraph Main["Main Thread (UI, 60 FPS)"]
      UI["React 18 + Router"]
      Grid["Virtualized Claims Grid<br/>(react-virtual + React Query)"]
      WS["Document Workspace<br/>(master–detail, full page)"]
      Store["RBAC Store"]
      IDB["IndexedDB<br/>(page-chunk cache)"]
    end
    subgraph Workers["Web Worker Thread"]
      W2["documentProcessor.worker<br/>merge / rotate / delete"]
    end
  end

  BFF["Express BFF (:3001)<br/>/api/claims · /stream · /split · /jobs"]

  UI --> Grid
  UI --> WS
  UI --> Store
  Grid -.->|cursor pagination| BFF
  WS <-->|postMessage| W2
  WS <-->|get / put chunk| IDB
  WS -.->|Range: bytes=…| BFF
  WS -.->|POST /split · poll /jobs| BFF
```

---

## 2. RBAC Decision Flow

Frontend masking is convenience only; the backend remains the source of truth.

```mermaid
flowchart TD
  A[User action requested] --> B{usePermissions.hasPermission action}
  B -- allowed --> C["Render control<br/>(Edit / Assign / Delete / Split)"]
  B -- denied --> D["AuthorizedView renders fallback<br/>(hidden / 'Locked')"]
  C --> E[User clicks]
  E --> F["Backend re-validates JWT + role<br/>on every read/write"]
  F -- authorized --> G[Mutation succeeds]
  F -- rejected --> H[403 → UI rolls back]
```

---

## 3. Component Boundaries

```mermaid
flowchart TB
  main["main.tsx"] --> BR["BrowserRouter"]
  BR --> RBAC["RBACProvider (store)"]
  RBAC --> App["App (Routes)"]

  App --> Dash["pages/DashboardPage"]
  App --> Work["pages/DocumentWorkspace"]

  Dash --> Side["layout/SideNav"]
  Dash --> Head["layout/Header"]
  Dash --> Cards["dashboard/SummaryCards"]
  Dash --> DGrid["dashboard/ClaimsDataGrid"]
  DGrid --> Role["dashboard/RoleSelector"]
  DGrid --> Hook["hooks/useClaims (React Query)"]
  Hook --> BFF["BFF GET /api/claims"]

  Work --> Viewer["workspace/DocumentViewer"]
  Viewer --> Stream["hooks/useDocumentStream"]
  Stream --> IDB["lib/idbCache (IndexedDB)"]
  Stream --> BFFS["BFF /stream (Range)"]
  Work --> Comments["workspace/CommentsPanel (optimistic)"]
  Work --> Actions["workspace/PageActionsPanel (pessimistic)"]
  Actions --> DW["workers/documentProcessor.worker"]
  Actions --> BFFJ["BFF /split + /jobs"]
```

---

## 4. State Ownership

```mermaid
flowchart LR
  subgraph Global["Global — Context/Store"]
    R["currentRole + hasPermission"]
  end
  subgraph Server["Server Cache — React Query"]
    Q["claims pages (infinite query)"]
  end
  subgraph Persist["Persistence — IndexedDB"]
    IDB["document page chunks"]
  end
  subgraph Local["Local — component state"]
    V["grid viewport (virtualizer)"]
    S["search / sortKey"]
    P["current page / zoom / tab"]
    O["optimistic comments"]
  end

  R --> UI[UI render]
  Q --> UI
  IDB --> UI
  V --> UI
  S --> UI
  P --> UI
  O --> UI
```

---

## 5. Large Document Sequence (Split, 1 GB)

```mermaid
sequenceDiagram
  participant U as User
  participant C as PageActionsPanel (Main)
  participant B as Express BFF

  U->>C: Click "Split PDF"
  C->>C: setActiveOp, disable siblings (pessimistic)
  C->>B: POST /api/documents/:id/split
  B-->>C: 202 { jobId }
  loop poll every 400ms
    C->>B: GET /api/jobs/:jobId
    B-->>C: { progress, status }
    C->>C: update progress bar
  end
  B-->>C: { status: COMPLETED, resultFiles }
  C->>C: show result, re-enable actions
  Note over C: Cancel stops polling. Merge, Rotate and Delete use the worker
```
