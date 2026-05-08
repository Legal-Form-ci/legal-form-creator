import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Profile from "@/pages/client/Profile";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "test@test.com", user_metadata: { full_name: "Jean Test" } },
    loading: false,
  }),
}));

const renderProfile = () =>
  render(
    <HelmetProvider>
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    </HelmetProvider>
  );

describe("Client Profile - validation", () => {
  it("affiche les champs principaux", async () => {
    renderProfile();
    await waitFor(() => expect(screen.getByLabelText(/Nom complet/i)).toBeInTheDocument());
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Téléphone/i)).toBeInTheDocument();
  });

  it("rejette un email invalide", async () => {
    renderProfile();
    const email = await screen.findByLabelText(/Email/i);
    fireEvent.change(email, { target: { value: "pas-un-email" } });
    fireEvent.click(screen.getByRole("button", { name: /Enregistrer/i }));
    await waitFor(() => expect(screen.getByText(/Adresse email invalide/i)).toBeInTheDocument());
  });

  it("rejette un téléphone invalide", async () => {
    renderProfile();
    const phone = await screen.findByLabelText(/Téléphone/i);
    fireEvent.change(phone, { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: /Enregistrer/i }));
    await waitFor(() => expect(screen.getByText(/Numéro de téléphone invalide/i)).toBeInTheDocument());
  });
});
