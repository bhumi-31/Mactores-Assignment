import { clsx } from "clsx";
import type { JobStatus, Stage } from "@/lib/types";

// PROVIDED. Renders a job status or a run stage as a high-contrast coloured pill.
const STYLES: Record<string, string> = {
  NEW: "bg-neutral-200 text-neutral-900",
  QUEUED: "bg-neutral-200 text-neutral-900",
  RUNNING: "bg-blue-100 text-blue-900",
  DOWNLOADING: "bg-blue-100 text-blue-900",
  TRANSCODING: "bg-indigo-100 text-indigo-900",
  COMPLETED: "bg-emerald-100 text-emerald-950",
  FAILED: "bg-rose-100 text-rose-950",
};

export function StatusBadge({ value }: { value: JobStatus | Stage }) {
  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-center rounded-md border-2 border-black px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
        STYLES[value] ?? "bg-neutral-200 text-neutral-900",
      )}
    >
      {value}
    </span>
  );
}

