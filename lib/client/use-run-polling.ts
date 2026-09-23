"use client";

import { useEffect, useRef, useState } from "react";
import { fetchRun } from "@/lib/client/hooks";
import { isTerminalStage, type EncodeRun } from "@/lib/types";

export interface RunPollingState {
  /** The latest run state we've received, or null before the first response. */
  run: EncodeRun | null;
  /** True while we're still asking the server for updates. */
  polling: boolean;
  /** A request failed (network, 404, …). Not the same thing as the RUN failing. */
  fetchError: string | null;
  /** Every message we've seen, oldest first — the log the UI renders. */
  log: string[];
}

const initialState: RunPollingState = {
  run: null,
  polling: false,
  fetchError: null,
  log: [],
};

export function useRunPolling(
  runId: string | null,
  onFinished?: () => void,
): RunPollingState {
  const [state, setState] = useState<RunPollingState>(initialState);
  const onFinishedRef = useRef(onFinished);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  useEffect(() => {
    if (!runId) {
      setState(initialState);
      return;
    }

    let cancelled = false;
    let timerId: ReturnType<typeof setInterval> | null = null;

    setState({
      run: null,
      polling: true,
      fetchError: null,
      log: [],
    });

    async function poll() {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }

      try {
        const run = await fetchRun(runId!);
        if (cancelled) return;

        const terminal = isTerminalStage(run.stage);

        setState((prev) => {
          const newLog = [...prev.log];
          if (run.message && (newLog.length === 0 || newLog[newLog.length - 1] !== run.message)) {
            newLog.push(run.message);
          }
          return {
            run,
            polling: !terminal,
            fetchError: null,
            log: newLog,
          };
        });

        if (terminal) {
          if (timerId) clearInterval(timerId);
          onFinishedRef.current?.();
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to fetch run status";
        setState((prev) => ({
          ...prev,
          fetchError: msg,
          polling: false,
        }));
      }
    }

    poll();

    timerId = setInterval(() => {
      poll();
    }, 1000);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && !cancelled) {
        poll();
      }
    }

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      cancelled = true;
      if (timerId) clearInterval(timerId);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [runId]);

  return state;
}

