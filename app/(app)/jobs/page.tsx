"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useJobs, useCreateJob } from "@/lib/client/hooks";
import { createJobSchema, type CreateJobInput } from "@/lib/schemas";
import { ApiError } from "@/lib/client/api";
import { StatusBadge } from "@/components/status-badge";
import { formatRelativeTime } from "@/lib/client/format-time";

export default function JobsPage() {
  const jobs = useJobs();
  const createJobMutation = useCreateJob();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateJobInput>({
    resolver: zodResolver(createJobSchema),
    defaultValues: { sourceUrl: "", title: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createJobMutation.mutateAsync(values);
      reset();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        for (const [field, messages] of Object.entries(err.fieldErrors)) {
          if (messages && messages.length > 0) {
            setError(field as keyof CreateJobInput, { message: messages[0] });
          }
        }
      }
    }
  });

  const isPending = isSubmitting || createJobMutation.isPending;

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-xl font-semibold">New encode job</h1>
        <p className="mb-4 text-xs text-neutral-500">
          Enter a media source URL to create a new transcoding job.
        </p>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="sourceUrl" className="mb-1 block text-sm font-medium text-neutral-800">
              Source URL <span className="text-red-500">*</span>
            </label>
            <input
              id="sourceUrl"
              {...register("sourceUrl")}
              type="url"
              placeholder="https://cdn.example.com/videos/clip.mp4"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              aria-invalid={!!errors.sourceUrl}
              aria-describedby={errors.sourceUrl ? "sourceUrl-error" : undefined}
            />
            {errors.sourceUrl && (
              <p id="sourceUrl-error" className="mt-1 text-xs font-medium text-red-600">
                {errors.sourceUrl.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-neutral-800">
              Title <span className="text-xs font-normal text-neutral-500">(optional)</span>
            </label>
            <input
              id="title"
              {...register("title")}
              type="text"
              placeholder="e.g. 1080p Trailer Render"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "title-error" : undefined}
            />
            {errors.title && (
              <p id="title-error" className="mt-1 text-xs font-medium text-red-600">
                {errors.title.message}
              </p>
            )}
          </div>

          {createJobMutation.isError && !createJobMutation.error?.fieldErrors && (
            <p className="text-xs text-red-600">
              {createJobMutation.error?.message || "Failed to create job"}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
          >
            {isPending ? "Creating job…" : "Create job"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Jobs</h2>

        {jobs.isLoading && <p className="text-sm text-neutral-500">Loading jobs…</p>}

        {jobs.isError && (
          <div className="text-sm text-red-600">
            Couldn’t load jobs — is GET /api/jobs implemented?{" "}
            <button onClick={() => jobs.refetch()} className="underline">
              Retry
            </button>
          </div>
        )}

        {jobs.data?.length === 0 && (
          <p className="rounded-md border border-neutral-200 p-4 text-sm text-neutral-500">
            No jobs yet. Create one above to get started.
          </p>
        )}

        {jobs.data && jobs.data.length > 0 && (
          <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200">
            {jobs.data.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-50"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{job.title}</p>
                      <span className="text-xs text-neutral-400">
                        • {formatRelativeTime(job.createdAt)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-neutral-500">{job.sourceUrl}</p>
                  </div>
                  <StatusBadge value={job.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

