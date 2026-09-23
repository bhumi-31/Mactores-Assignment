import { clsx } from "clsx";

// PROVIDED. A percentage bar with high-contrast borders, hard-offset shadow, and smooth progress transitions.
export function ProgressBar({ value, failed }: { value: number; failed?: boolean }) {
  return (
    <div
      className="h-3.5 w-full overflow-hidden rounded-md border-2 border-black bg-neutral-100 p-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={clsx(
          "h-full rounded-sm transition-all duration-500 ease-out",
          failed ? "bg-rose-600" : "bg-blue-600",
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

