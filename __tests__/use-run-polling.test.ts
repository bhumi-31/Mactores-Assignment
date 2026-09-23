import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useRunPolling } from "@/lib/client/use-run-polling";
import * as hooks from "@/lib/client/hooks";
import type { EncodeRun } from "@/lib/types";

describe("useRunPolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does nothing when runId is null", () => {
    const { result } = renderHook(() => useRunPolling(null));
    expect(result.current.run).toBeNull();
    expect(result.current.polling).toBe(false);
  });

  it("polls until terminal stage is reached and calls onFinished", async () => {
    const onFinished = vi.fn();

    const queuedRun: EncodeRun = {
      id: "r_1",
      jobId: "j_1",
      stage: "QUEUED",
      progressPct: 0,
      message: "Queued",
    };

    const completedRun: EncodeRun = {
      id: "r_1",
      jobId: "j_1",
      stage: "COMPLETED",
      progressPct: 100,
      message: "Done",
      result: { durationSec: 10, renditions: [] },
    };

    const fetchSpy = vi.spyOn(hooks, "fetchRun")
      .mockResolvedValueOnce(queuedRun)
      .mockResolvedValueOnce(completedRun);

    const { result } = renderHook(() => useRunPolling("r_1", onFinished));

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.run?.stage).toBe("QUEUED");
    expect(result.current.polling).toBe(true);

    // Fast-forward interval
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(result.current.run?.stage).toBe("COMPLETED");
    expect(result.current.polling).toBe(false);
    expect(onFinished).toHaveBeenCalledTimes(1);

    fetchSpy.mockRestore();
  });
});
