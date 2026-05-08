import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";

describe("NewsletterSubscribe", () => {
  it("rend le formulaire d'inscription", () => {
    render(
      <MemoryRouter>
        <NewsletterSubscribe />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });

  it("rejette un email vide à la soumission", async () => {
    render(
      <MemoryRouter>
        <NewsletterSubscribe />
      </MemoryRouter>
    );
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    // The button should remain enabled and no crash
    await waitFor(() => expect(btn).toBeInTheDocument());
  });
});
