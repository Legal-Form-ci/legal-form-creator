import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { supabase } from "@/integrations/supabase/client";

// Minimal isolated test: simulates the handlePay flow
function PayButton({ invoice }: { invoice: any }) {
  const [loading, setLoading] = (require("react") as typeof import("react")).useState(false);
  const handlePay = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("create-fedapay-payment", {
      body: { invoice_id: invoice.id, amount: invoice.amount },
    });
    setLoading(false);
    if (!error && (data as any)?.url) (globalThis as any).__redirected = (data as any).url;
  };
  return (
    <button onClick={handlePay} disabled={loading}>
      {loading ? "Redirection..." : "Payer via FedaPay"}
    </button>
  );
}

describe("FedaPay - bouton Payer", () => {
  it("invoque l'edge function create-fedapay-payment au clic", async () => {
    const invokeMock = supabase.functions.invoke as any;
    invokeMock.mockResolvedValueOnce({ data: { url: "https://fedapay.com/pay/abc" }, error: null });

    render(<PayButton invoice={{ id: "inv-1", amount: 50000 }} />);
    fireEvent.click(screen.getByRole("button", { name: /Payer/i }));

    await waitFor(() =>
      expect(invokeMock).toHaveBeenCalledWith("create-fedapay-payment", {
        body: { invoice_id: "inv-1", amount: 50000 },
      })
    );
  });

  it("désactive le bouton pendant la requête", async () => {
    const invokeMock = supabase.functions.invoke as any;
    let resolve: any;
    invokeMock.mockReturnValueOnce(new Promise((r) => { resolve = r; }));

    render(<PayButton invoice={{ id: "inv-2", amount: 1000 }} />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    await waitFor(() => expect(btn).toBeDisabled());
    resolve({ data: { url: "x" }, error: null });
  });
});
