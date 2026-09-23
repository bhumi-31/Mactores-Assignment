# Encodr Lite — Intern Take-Home

**Encodr Lite** is a media-transcoding dashboard built with Next.js (App Router), React, TypeScript, and React Query. A signed-in user creates an encode **job** from a media source URL, presses **Start encode**, watches progress update live, and views the generated renditions or handles errors upon failure.

---

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run test:run     # vitest test suite
npm run typecheck    # tsc --noEmit
npm run build        # production build
```

Requires **Node 20+** (`.nvmrc` specifies 20).

**Demo login:** `demo@encodr.dev` / `password123`

---

# Candidate Write-up

### 1. What's working

All **6 Tasks** are fully implemented, verified, and tested:

- **Task 1 (`lib/schemas.ts`)**: `sourceUrlSchema` strictly enforces valid `http(s)` URLs with non-empty path segments, returning actionable error messages for each error mode (empty string, malformed URL, unsupported protocol like `ftp://`, or root URL missing a file path).
- **Task 2 (`app/api/jobs/route.ts`)**: `GET /api/jobs` and `POST /api/jobs` route handlers implemented with `withAuth` route guards. `POST` validates payloads using `createJobSchema` and returns HTTP 422 with `fieldErrors` on failure, returning HTTP 201 on success.
- **Task 3 (`lib/server/store.ts` → `computeRun()`)**: Pure, deterministic stage calculation derived strictly from elapsed time (`now - record.startedAt`). Implemented using TDD with zero server-side timers.
- **Task 4 (`app/(app)/jobs/page.tsx` & `lib/client/hooks.ts`)**: `useCreateJob()` React Query mutation invalidates cache upon success. The form utilizes React Hook Form with `zodResolver(createJobSchema)`, displaying field errors inline and mapping server 422 `fieldErrors` via `setError()`. Includes relative job creation timestamps ("created 2 minutes ago").
- **Task 5 (`lib/client/use-run-polling.ts` & `app/(app)/jobs/[id]/page.tsx`)**: Polling hook fetches run progress ~1s, halting immediately when terminal stage (`COMPLETED` or `FAILED`) is hit. Robust cleanup handles unmounting and ID changes cleanly. Renders live stage badges, progress bar, deduplicated live event log, failure panel with retry button, and output renditions table.
- **Task 6 (`__tests__/`)**: Comprehensive Vitest test suite with 21 passing tests across 5 files, covering timeline stage boundaries, corrupt source URL failures, schema validation edge cases, hook polling cleanup, and component form submission behavior.

---

### 2. How to see the failure path

1. Sign in with `demo@encodr.dev` / `password123`.
2. Navigate to the **New encode job** form on `/jobs`.
3. Enter the rigged corrupt URL: `https://cdn.example.com/videos/corrupt.mp4` and click **Create job**.
4. Click on the created job to open `/jobs/[id]`.
5. Click **Start encode**.
6. Watch progress advance through `QUEUED` (0-2s) and `DOWNLOADING` (2-6s).
7. At **8 seconds** (during `TRANSCODING`), the run transitions to `FAILED`.
8. The progress bar turns red, a detailed error message panel appears ("Corrupt media file: invalid container header..."), and a working **Retry encode** button is displayed to re-trigger the job.

---

### 3. Decisions and assumptions

- **Detail Page State Modeling**: Modeled the run view cleanly around explicit derived states (`isFailed`, `isCompleted`, `isRunning`), driven by `effectiveRunId` and `useRunPolling`. This prevents contradictory boolean flags (e.g. `isRunning && isFailed` cannot occur).
- **Async Polling Cleanup**: In `useRunPolling`, a `cancelled` boolean guard is set during effect cleanup and checked immediately after every `await fetchRun()` call before touching React state. Combined with `clearInterval`, this guarantees no state is set on unmounted components or stale run IDs.
- **Tab Visibility Handling**: Implemented `document.visibilityState` detection in `useRunPolling`. Polling automatically pauses when the browser tab is hidden to save network resources, and resumes immediately when the tab regains focus.
- **Single Source of Truth Validation**: Shared `sourceUrlSchema` between client-side React Hook Form resolvers and server-side Next.js route handlers. The server never trusts client input.
- **Visual Treatment**: Applied plain Tailwind styling to `StatusBadge` and `ProgressBar` with bold 2px borders (`border-2 border-black`) and hard flat offset shadows (`shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`) without adding new components.

---

### 4. What was hardest

- **Async Correctness & Polling Lifecycle**: Preventing race conditions when navigating away from a run mid-progress or switching between runs quickly was the most subtle challenge. A fetch request initiated just before unmount will resolve after unmount; calling `setState` at that point would attempt state updates on unmounted components. Resolving this required combining `clearInterval` with a `cancelled` flag checked after the asynchronous `await` boundary.
- **Deterministic Stage Boundaries in TDD**: Ensuring `computeRun` handled exact boundary instants (`0ms`, `2000ms`, `6000ms`, `8000ms`, `12000ms`) without off-by-one errors (`<` vs `<=`). Practicing TDD by writing all 9 boundary tests in `compute-run.test.ts` *before* implementing `computeRun()` ensured every edge case was verified deterministically.

---

### 5. What I'd do next

- **Server-Sent Events / WebSockets**: Replace HTTP polling with Server-Sent Events (SSE) or WebSockets for instant, push-based progress streaming from the server.
- **Real Transcoding Pipeline**: Integrate background workers (e.g., BullMQ + Redis) with FFmpeg for real video transcoding and AWS S3 storage for output renditions.
- **User Multi-tenancy & Access Control**: Expand authentication to support multi-tenant organizations, user role permissions, and token refresh mechanisms.

---

### 6. Time spent

Approximately **4 focused hours** total across design, TDD test authoring, feature implementation, and verification.
