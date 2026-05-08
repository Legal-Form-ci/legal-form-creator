// Vitest-style E2E test for fedapay-webhook
// Note: This uses Deno test runner via supabase--test_edge_functions
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const FN_URL = `${Deno.env.get("SUPABASE_URL") || "http://localhost:54321"}/functions/v1/fedapay-webhook`;

async function post(body: unknown) {
  const r = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let json: any = {};
  try { json = JSON.parse(text); } catch {}
  return { status: r.status, json };
}

Deno.test("fedapay-webhook rejects payload without entity", async () => {
  const { status, json } = await post({ event: "transaction.approved" });
  assertEquals(status, 400);
  assertEquals(json.error, "No entity");
});

Deno.test("fedapay-webhook rejects entity without transaction id", async () => {
  const { status, json } = await post({
    event: "transaction.approved",
    entity: { status: "approved" },
  });
  assertEquals(status, 400);
  assertEquals(json.error, "Missing transaction id");
});

Deno.test("fedapay-webhook ignores unknown transaction gracefully", async () => {
  const { status, json } = await post({
    event: "transaction.approved",
    entity: { id: "tx_does_not_exist_" + Date.now(), status: "approved" },
  });
  assertEquals(status, 200);
  assertEquals(json.received, true);
  assertEquals(json.ignored, true);
});

Deno.test("fedapay-webhook accepts pending status without error", async () => {
  const { status } = await post({
    event: "transaction.pending",
    entity: { id: "tx_pending_" + Date.now(), status: "pending" },
  });
  assertEquals(status, 200);
});
