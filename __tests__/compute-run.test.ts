import { describe, expect, it } from "vitest";
import { computeRun, FAIL_URL, type RunRecord } from "@/lib/server/store";
import { TIMELINE } from "@/lib/types";

describe("computeRun state machine", () => {
  const startedAt = 1_000_000;

  const normalRecord: RunRecord = {
    id: "r_test1",
    jobId: "j_test1",
    sourceUrl: "https://cdn.example.com/videos/normal.mp4",
    startedAt,
  };

  const corruptRecord: RunRecord = {
    id: "r_test2",
    jobId: "j_test2",
    sourceUrl: FAIL_URL,
    startedAt,
  };

  it("0ms: QUEUED stage at start", () => {
    const run = computeRun(normalRecord, startedAt);
    expect(run.stage).toBe("QUEUED");
    expect(run.progressPct).toBe(0);
    expect(run.error).toBeUndefined();
    expect(run.result).toBeUndefined();
  });

  it("1999ms: QUEUED stage right before boundary", () => {
    const run = computeRun(normalRecord, startedAt + 1999);
    expect(run.stage).toBe("QUEUED");
  });

  it("2000ms: EXACT boundary switches to DOWNLOADING", () => {
    const run = computeRun(normalRecord, startedAt + TIMELINE.queuedEndsMs);
    expect(run.stage).toBe("DOWNLOADING");
    expect(run.progressPct).toBe(17);
  });

  it("5999ms: DOWNLOADING stage right before boundary", () => {
    const run = computeRun(normalRecord, startedAt + 5999);
    expect(run.stage).toBe("DOWNLOADING");
  });

  it("6000ms: EXACT boundary switches to TRANSCODING", () => {
    const run = computeRun(normalRecord, startedAt + TIMELINE.downloadingEndsMs);
    expect(run.stage).toBe("TRANSCODING");
    expect(run.progressPct).toBe(50);
  });

  it("7999ms: corrupt URL is still TRANSCODING before failAtMs boundary", () => {
    const run = computeRun(corruptRecord, startedAt + 7999);
    expect(run.stage).toBe("TRANSCODING");
  });

  it("8000ms: corrupt URL EXACT boundary switches to FAILED", () => {
    const run = computeRun(corruptRecord, startedAt + TIMELINE.failAtMs);
    expect(run.stage).toBe("FAILED");
    expect(run.error).toBeDefined();
    expect(run.error).toContain("Corrupt media");
    expect(run.result).toBeUndefined();
    expect(run.progressPct).toBe(67);
  });

  it("11999ms: normal URL is still TRANSCODING right before boundary", () => {
    const run = computeRun(normalRecord, startedAt + 11999);
    expect(run.stage).toBe("TRANSCODING");
  });

  it("12000ms: EXACT boundary switches to COMPLETED with result", () => {
    const run = computeRun(normalRecord, startedAt + TIMELINE.transcodingEndsMs);
    expect(run.stage).toBe("COMPLETED");
    expect(run.progressPct).toBe(100);
    expect(run.result).toBeDefined();
    expect(run.result?.renditions.length).toBeGreaterThan(0);
    expect(run.error).toBeUndefined();
  });
});
