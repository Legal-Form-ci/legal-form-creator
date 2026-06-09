// Centralized helpers for in-app + email notifications.
// Safe to fail silently: notifications are best-effort.
import { supabase } from "@/integrations/supabase/client";

export async function notifyStatusChange(opts: {
  requestId: string;
  requestType: "company" | "service";
  newStatus: string;
}) {
  try {
    await supabase.functions.invoke("send-status-notification", {
      body: { requestId: opts.requestId, requestType: opts.requestType, newStatus: opts.newStatus },
    });
  } catch (e) {
    console.warn("[notify] status fallback", e);
    try {
      await supabase.functions.invoke("send-notification", {
        body: { requestId: opts.requestId, type: "status_change", newStatus: opts.newStatus },
      });
    } catch (e2) {
      console.error("[notify] status failed", e2);
    }
  }
}

export async function notifyInvoiceCreated(opts: {
  userId: string;
  invoiceNumber: string;
  amount: number;
  requestId?: string | null;
  requestType?: "company" | "service";
}) {
  try {
    const amountFmt = new Intl.NumberFormat("fr-FR").format(opts.amount) + " FCFA";
    // Direct pay link if we know the request, else fall back to dashboard.
    const payLink = opts.requestId
      ? `/payment/${opts.requestId}`
      : "/client/dashboard";
    await supabase.functions.invoke("send-notification", {
      body: {
        userId: opts.userId,
        type: "announcement",
        customTitle: `Nouvelle facture ${opts.invoiceNumber}`,
        customMessage: `Une nouvelle facture <strong>${opts.invoiceNumber}</strong> d'un montant de <strong>${amountFmt}</strong> a été émise.\n\nCliquez sur le bouton ci-dessous pour la régler en un clic via Mobile Money ou carte bancaire. Le paiement sera confirmé automatiquement et votre dossier mis à jour immédiatement.`,
        link: payLink,
        ctaText: "💳 Payer maintenant",
      },
    });
  } catch (e) {
    console.error("[notify] invoice failed", e);
  }
}

export async function notifyRequestMessage(opts: {
  requestId: string;
  requestType: "company" | "service";
  senderRole: "client" | "admin";
  message: string;
  senderName?: string;
}) {
  try {
    await supabase.functions.invoke("notify-message-thread", {
      body: {
        request_id: opts.requestId,
        request_type: opts.requestType,
        sender_role: opts.senderRole,
        message: opts.message,
        sender_name: opts.senderName,
      },
    });
  } catch (e) {
    console.error("[notify] message failed", e);
  }
}
