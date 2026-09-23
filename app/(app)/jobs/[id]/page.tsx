"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useJob, useStartRun } from "@/lib/client/hooks";
import { useRunPolling } from "@/lib/client/use-run-polling";
import { StatusBadge } from "@/components/status-badge";
import { ProgressBar } from "@/components/progress-bar";
import { formatRelativeTime } from "@/lib/client/format-time";

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const jobQuery = useJob(id);
  const startRunMutation = useStartRun(id);

  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  const job = jobQuery.data;

  // Initialize activeRunId from job's latestRunId if present and no active run set yet
  const effectiveRunId = activeRunId ?? job?.latestRunId ?? null;

  const pollingState = useRunPolling(effectiveRunId, () => {
    jobQuery.refetch();
  });

  const { run, polling, fetchError, log } = pollingState;

  const handleStartRun = async () => {
    try {
      const res = await startRunMutation.mutateAsync();
      setActiveRunId(res.runId);
    } catch {
      // Error is accessible via startRunMutation.error
    }
  };

  if (jobQuery.isLoading) {
    return <p className="text-sm text-neutral-500">Loading job…</p>;
  }

  if (jobQuery.isError || !job) {
    return (
      <div className="text-sm text-red-600">
        Job not found.{" "}
        <Link href="/jobs" className="underline">
          Back to jobs
        </Link>
      </div>
    );
  }

  const isFailed = run?.stage === "FAILED" || job.status === "FAILED";
  const isCompleted = run?.stage === "COMPLETED" || job.status === "COMPLETED";

  return (
    <div className="space-y-6">
      <Link href="/jobs" className="text-sm text-neutral-500 hover:underline">
        ← All jobs
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-semibold">{job.title}</h1>
            <span className="text-xs text-neutral-400">• {formatRelativeTime(job.createdAt)}</span>
          </div>
          <p className="truncate text-sm text-neutral-500">{job.sourceUrl}</p>
        </div>
        <StatusBadge value={job.status} />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm space-y-6">
        {!effectiveRunId && (
          <div className="flex flex-col items-start gap-4">
            <p className="text-sm text-neutral-600">
              This job has not been run yet. Click below to start the media transcoding pipeline.
            </p>
            <button
              onClick={handleStartRun}
              disabled={startRunMutation.isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
            >
              {startRunMutation.isPending ? "Starting encode…" : "Start encode"}
            </button>
          </div>
        )}

        {effectiveRunId && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-700">Stage:</span>
                  {run?.stage && <StatusBadge value={run.stage} />}
                </div>
                <span className="text-sm font-semibold text-neutral-700">
                  {run ? `${Math.round(run.progressPct)}%` : "0%"}
                </span>
              </div>

              <ProgressBar
                value={run?.progressPct ?? 0}
                failed={isFailed}
              />
            </div>

            {isFailed && (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 space-y-3">
                <div className="flex items-start gap-2 text-red-800">
                  <span className="font-semibold text-sm">Transcoding Error:</span>
                  <span className="text-sm">{run?.error || "Media stream processing failed"}</span>
                </div>
                <button
                  onClick={handleStartRun}
                  disabled={startRunMutation.isPending}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:opacity-50"
                >
                  {startRunMutation.isPending ? "Retrying…" : "Retry encode"}
                </button>
              </div>
            )}

            {fetchError && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Warning: {fetchError}. Retrying connection...
              </div>
            )}

            <div className="space-y-2">
              <h2 className="text-sm font-medium text-neutral-700">Live Log</h2>
              <div
                className="max-h-48 overflow-y-auto rounded-md bg-neutral-900 p-3 text-xs font-mono text-neutral-200 space-y-1"
                aria-live="polite"
                aria-atomic="false"
              >
                {log.length === 0 ? (
                  <p className="text-neutral-500">Connecting to run runner…</p>
                ) : (
                  log.map((entry, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-neutral-500 select-none">&gt;</span>
                      <span>{entry}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {isCompleted && run?.result && (
              <div className="space-y-4 pt-2 border-t border-neutral-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-neutral-900">Output Renditions</h2>
                  <span className="text-xs text-neutral-500">
                    Duration: {run.result.durationSec}s
                  </span>
                </div>

                <div className="overflow-x-auto rounded-md border border-neutral-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 text-xs font-medium text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
                      <tr>
                        <th className="px-4 py-2.5">Resolution / Label</th>
                        <th className="px-4 py-2.5">Dimensions</th>
                        <th className="px-4 py-2.5">File Size</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 bg-white">
                      {run.result.renditions.map((r) => (
                        <tr key={r.label} className="hover:bg-neutral-50">
                          <td className="px-4 py-2.5 font-medium text-neutral-900">{r.label}</td>
                          <td className="px-4 py-2.5 text-neutral-600">
                            {r.width} × {r.height}
                          </td>
                          <td className="px-4 py-2.5 text-neutral-600">{r.sizeMb.toFixed(1)} MB</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

