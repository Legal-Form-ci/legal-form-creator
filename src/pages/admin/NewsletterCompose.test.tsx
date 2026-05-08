import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock heavy WYSIWYG dep
vi.mock("@/components/WysiwygEditor", () => ({
  default: ({ value }: any) => <div data-testid="wysiwyg">{value}</div>,
}));
vi.mock("@/pages/admin/AdminLayout", () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

import NewsletterCompose from "@/pages/admin/NewsletterCompose";

describe("NewsletterCompose", () => {
  it("affiche le titre et l'éditeur WYSIWYG", async () => {
    render(
      <MemoryRouter>
        <NewsletterCompose />
      </MemoryRouter>
    );
    expect(await screen.findByText(/Composer la newsletter/i)).toBeInTheDocument();
    expect(screen.getByTestId("wysiwyg")).toBeInTheDocument();
  });

  it("affiche le bouton Envoyer maintenant", async () => {
    render(
      <MemoryRouter>
        <NewsletterCompose />
      </MemoryRouter>
    );
    expect(await screen.findByRole("button", { name: /Envoyer maintenant/i })).toBeInTheDocument();
  });
});
