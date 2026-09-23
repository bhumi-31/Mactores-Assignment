import { describe, expect, it, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/jobs/route";
import { issueToken } from "@/lib/server/auth";
import { __resetStore } from "@/lib/server/store";

describe("jobs API routes", () => {
  beforeEach(() => {
    __resetStore();
  });

  const validToken = issueToken("u_demo");

  it("GET /api/jobs returns 401 when unauthenticated", async () => {
    const req = new Request("http://localhost/api/jobs");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("GET /api/jobs returns list of jobs when authenticated", async () => {
    const req = new Request("http://localhost/api/jobs", {
      headers: { authorization: `Bearer ${validToken}` },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(0);
  });

  it("POST /api/jobs returns 422 for invalid URL", async () => {
    const req = new Request("http://localhost/api/jobs", {
      method: "POST",
      headers: {
        authorization: `Bearer ${validToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ sourceUrl: "not-a-url" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.fieldErrors).toBeDefined();
    expect(body.fieldErrors.sourceUrl).toBeDefined();
  });

  it("POST /api/jobs creates job and returns 201 on valid input", async () => {
    const req = new Request("http://localhost/api/jobs", {
      method: "POST",
      headers: {
        authorization: `Bearer ${validToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sourceUrl: "https://cdn.example.com/videos/test.mp4",
        title: "Test Job",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.title).toBe("Test Job");
    expect(body.sourceUrl).toBe("https://cdn.example.com/videos/test.mp4");
    expect(body.status).toBe("NEW");
  });
});
