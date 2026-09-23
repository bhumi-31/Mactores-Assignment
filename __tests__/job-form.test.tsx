import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import JobsPage from "@/app/(app)/jobs/page";
import * as apiModule from "@/lib/client/api";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("JobsPage component form validation", () => {
  it("submitting with an invalid URL shows the error and does NOT call the API", async () => {
    const postSpy = vi.spyOn(apiModule.api, "post");
    vi.spyOn(apiModule.api, "get").mockResolvedValue([]);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <JobsPage />
      </QueryClientProvider>,
    );

    const input = screen.getByLabelText(/Source URL/i);
    const submitBtn = screen.getByRole("button", { name: /Create job/i });

    fireEvent.change(input, { target: { value: "ftp://invalid-domain.com" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Only http and https URLs are supported/i),
      ).toBeInTheDocument();
    });

    expect(postSpy).not.toHaveBeenCalled();

    postSpy.mockRestore();
  });
});
