import cors from 'cors';
import express, { type Request, type Response } from 'express';
import { randomUUID } from 'crypto';
import { claims, type Claim } from './data';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Restrict CORS to the deployed frontend when FRONTEND_URL is set; allow all in dev.
const frontend = process.env.FRONTEND_URL;
const allowedOrigin = frontend
  ? /^https?:\/\//.test(frontend)
    ? frontend
    : `https://${frontend}`
  : undefined;
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : {}));
app.use(express.json());

// ---------------------------------------------------------------------------
// Endpoint 1 — Server-side pagination, search & sorting
// GET /api/claims?page=1&limit=50&search=&sortBy=amount&sortOrder=desc
// ---------------------------------------------------------------------------
type SortOrder = 'asc' | 'desc';
const SORTABLE_FIELDS: (keyof Claim)[] = [
  'id',
  'customerName',
  'company',
  'email',
  'type',
  'amount',
  'status',
];

app.get('/api/claims', (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 50));
  const search = String(req.query.search ?? '')
    .trim()
    .toLowerCase();
  const sortBy = req.query.sortBy as keyof Claim | undefined;
  const sortOrder: SortOrder = req.query.sortOrder === 'desc' ? 'desc' : 'asc';

  // Filter
  let result = search
    ? claims.filter(
        (c) =>
          c.customerName.toLowerCase().includes(search) ||
          c.company.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search) ||
          c.id.toLowerCase().includes(search),
      )
    : claims;

  // Sort
  if (sortBy && SORTABLE_FIELDS.includes(sortBy)) {
    const dir = sortOrder === 'desc' ? -1 : 1;
    result = [...result].sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      if (typeof av === 'number' && typeof bv === 'number') {
        return (av - bv) * dir;
      }
      return String(av).localeCompare(String(bv)) * dir;
    });
  }

  const total = result.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const data = result.slice(start, start + limit);

  // Simulate network latency
  setTimeout(() => {
    res.json({ data, total, page, totalPages });
  }, 400);
});

// ---------------------------------------------------------------------------
// Endpoint 2 — Simulated HTTP Range requests for a 1 GB document
// GET /api/documents/:id/stream   (Range: bytes=0-1048576)
// ---------------------------------------------------------------------------
const TOTAL_FILE_SIZE = 1_073_741_824; // 1 GB
const MAX_CHUNK = 16 * 1024 * 1024; // safety cap per response (16 MB)

app.get('/api/documents/:id/stream', (req: Request, res: Response) => {
  const range = req.headers.range;

  if (!range) {
    // No Range header: advertise support and the full size.
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Length', TOTAL_FILE_SIZE);
    res.status(200).json({
      message: 'Send a Range header to stream a chunk',
      totalSize: TOTAL_FILE_SIZE,
    });
    return;
  }

  const match = /bytes=(\d+)-(\d*)/.exec(range);
  if (!match) {
    res.setHeader('Content-Range', `bytes */${TOTAL_FILE_SIZE}`);
    res.status(416).end();
    return;
  }

  const start = Number(match[1]);
  let end = match[2] ? Number(match[2]) : start + 1024 * 1024 - 1;

  if (start >= TOTAL_FILE_SIZE || start > end) {
    res.setHeader('Content-Range', `bytes */${TOTAL_FILE_SIZE}`);
    res.status(416).end();
    return;
  }

  // Clamp to the file end and the per-response safety cap.
  end = Math.min(end, TOTAL_FILE_SIZE - 1, start + MAX_CHUNK - 1);
  const chunkSize = end - start + 1;

  // Deterministic dummy bytes for the requested slice.
  const buffer = Buffer.alloc(chunkSize);
  for (let i = 0; i < chunkSize; i++) buffer[i] = (start + i) % 251;

  res.status(206);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Range', `bytes ${start}-${end}/${TOTAL_FILE_SIZE}`);
  res.setHeader('Content-Length', chunkSize);
  res.end(buffer);
});

// ---------------------------------------------------------------------------
// Endpoint 3 — Long-running job simulation
// POST /api/documents/:id/split -> 202 { jobId }
// GET  /api/jobs/:jobId         -> progress 0..100 over 5s, then COMPLETED
// ---------------------------------------------------------------------------
const JOB_DURATION_MS = 5000;

interface Job {
  id: string;
  documentId: string;
  startedAt: number;
}

const jobs = new Map<string, Job>();

app.post('/api/documents/:id/split', (req: Request, res: Response) => {
  const job: Job = {
    id: randomUUID(),
    documentId: req.params.id,
    startedAt: Date.now(),
  };
  jobs.set(job.id, job);
  res.status(202).json({ jobId: job.id, status: 'PROCESSING' });
});

app.get('/api/jobs/:jobId', (req: Request, res: Response) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  const elapsed = Date.now() - job.startedAt;
  const progress = Math.min(100, Math.round((elapsed / JOB_DURATION_MS) * 100));
  const status = progress >= 100 ? 'COMPLETED' : 'PROCESSING';

  res.json({
    jobId: job.id,
    documentId: job.documentId,
    progress,
    status,
    ...(status === 'COMPLETED' ? { resultFiles: 12 } : {}),
  });
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, claims: claims.length });
});

app.listen(PORT, () => {
  console.log(`Claims BFF listening on port ${PORT}`);
});
