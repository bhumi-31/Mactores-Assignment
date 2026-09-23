import { describe, expect, it } from "vitest";
import { sourceUrlSchema } from "@/lib/schemas";

describe("sourceUrlSchema", () => {
  it("accepts valid http and https URLs with a pathname", () => {
    expect(sourceUrlSchema.safeParse("https://cdn.example.com/videos/clip.mp4").success).toBe(true);
    expect(sourceUrlSchema.safeParse("http://media.example.com/a/b/movie.mov").success).toBe(true);
  });

  it("rejects empty string with required message", () => {
    const res = sourceUrlSchema.safeParse("");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toBe("Source URL is required");
    }
  });

  it("rejects malformed URLs with valid URL message", () => {
    const res = sourceUrlSchema.safeParse("not a url");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toBe("Enter a valid URL (e.g. https://example.com/video.mp4)");
    }
  });

  it("rejects non-http(s) protocols", () => {
    const res = sourceUrlSchema.safeParse("ftp://cdn.example.com/clip.mp4");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toBe("Only http and https URLs are supported");
    }
  });

  it("rejects URLs without a path segment", () => {
    const res1 = sourceUrlSchema.safeParse("https://cdn.example.com");
    expect(res1.success).toBe(false);
    if (!res1.success) {
      expect(res1.error.issues[0].message).toBe("URL must include a file path to encode");
    }

    const res2 = sourceUrlSchema.safeParse("https://cdn.example.com/");
    expect(res2.success).toBe(false);
    if (!res2.success) {
      expect(res2.error.issues[0].message).toBe("URL must include a file path to encode");
    }
  });
});
