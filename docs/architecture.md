# Architecture Diagrams

Visual companions to the system design in [`../README.md`](../README.md). All
diagrams render natively on GitHub via Mermaid.

---

## 1. System Flow (High Level)

How a request travels from the user through the app shell to the two background
worker threads.

```mermaid
flowchart LR
  subgraph Browser["Browser Tab"]
    subgraph Main["Main Thread (UI, 60 FPS)"]
      UI["React 18 + Router"]
      Grid["Virtualized Claims Grid<br/>(@tanstack/react-virtual)"]
      WS["Document Workspace<br/>(master–detail, full page)"]
      Store["RBAC Store + React Query cache"]
    end
    subgraph Workers["Web Worker Threads"]
      W1["claimsWorker<br/>search / filter / sort 20k"]
      W2["documentProcessor.worker<br/>split / merge / chunk (1 GB)"]
    end
  end

  API["Backend API<br/>(JWT-secured)"]
  Blob["Object Storage<br/>(Range requests)"]

  UI --> Grid
  UI --> WS
  UI --> Store
  Grid <-->|postMessage / onmessage| W1
  WS <-->|postMessage / onmessage| W2
  Store -.->|cursor pagination| API
  WS -.->|Range: bytes=…| Blob
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
  DGrid --> Hook["hooks/useClaimsProcessor"]
  Hook --> CW["workers/claimsWorker"]

  Work --> Viewer["workspace/DocumentViewer"]
  Work --> Comments["workspace/CommentsPanel (optimistic)"]
  Work --> Actions["workspace/PageActionsPanel (pessimistic)"]
  Actions --> DW["workers/documentProcessor.worker"]
```

---

## 4. State Ownership

```mermaid
flowchart LR
  subgraph Global["Global — Context/Store"]
    R["currentRole + hasPermission"]
  end
  subgraph Server["Server Cache — React Query (planned)"]
    Q["claims pages / claim detail"]
  end
  subgraph Local["Local — component state"]
    V["grid viewport (virtualizer)"]
    S["search / sortKey"]
    P["current page / zoom / tab"]
    O["optimistic comments"]
  end

  R --> UI[UI render]
  Q --> UI
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
  participant W as documentProcessor.worker

  U->>C: Click "Split PDF"
  C->>C: setActiveOp, disable siblings (pessimistic)
  C->>W: postMessage { action, fileName, sizeBytes: 1 GB }
  loop every tick
    W-->>C: { status: PROGRESS, progress }
    C->>C: update progress bar
  end
  W-->>C: { status: COMPLETE, payload }
  C->>C: show result, re-enable actions
  Note over C,W: worker.terminate() on unmount
```
