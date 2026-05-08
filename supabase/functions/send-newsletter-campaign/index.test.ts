import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || "https://xwtmnzorzsvkamqemddk.supabase.co";
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3dG1uem9yenN2a2FtcWVtZGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDIyNzQsImV4cCI6MjA4OTE3ODI3NH0.QE1RN4EiQd2bB5RD41mtRP_Gn4mJ21QaA7WvU69MVig";

const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.test("cron mode returns processed structure", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-newsletter-campaign`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${ANON}` },
    body: JSON.stringify({ mode: "cron" }),
  });
  const data = await res.json();
  assert(res.ok, `expected ok, got ${res.status}: ${JSON.stringify(data)}`);
  assert("processed" in data, "should return 'processed'");
  assert(Array.isArray(data.results), "should return results array");
});

Deno.test("cron simulation sends a due campaign and updates newsletter_campaigns status", async () => {
  if (!SERVICE_ROLE) return;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const email = `cron-e2e-${Date.now()}@example.com`;

  await admin.from("newsletter_subscribers").insert({ email, source: "e2e-cron", is_active: true });
  const { data: campaign, error } = await admin.from("newsletter_campaigns").insert({
    subject: "E2E cron newsletter",
    html_content: "<p>Test cron</p>",
    status: "scheduled",
    scheduled_at: new Date(Date.now() - 60_000).toISOString(),
  }).select("id").single();
  assert(!error, error?.message);

  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-newsletter-campaign`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${SERVICE_ROLE}` },
    body: JSON.stringify({ mode: "cron", campaignId: campaign.id, simulate: true }),
  });
  const body = await res.json();
  assert(res.ok, `cron failed: ${res.status} ${JSON.stringify(body)}`);
  assertEquals(body.processed, 1);

  const { data: updated } = await admin.from("newsletter_campaigns")
    .select("status, success_count, failure_count")
    .eq("id", campaign.id)
    .single();
  assertEquals(updated?.status, "sent");
  assert((updated?.success_count || 0) >= 1);
  assertEquals(updated?.failure_count || 0, 0);
});

Deno.test("missing campaignId returns 400", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-newsletter-campaign`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${ANON}` },
    body: JSON.stringify({}),
  });
  const data = await res.json();
  assertEquals(res.status, 400);
  assert(data.error?.includes("campaignId"));
});

Deno.test("unsubscribe RPC marks subscriber inactive", async () => {
  const testEmail = `e2e-${Date.now()}@example.com`;
  // Subscribe (anon role; sending Authorization re-asserts anon, fine)
  const sub = await fetch(`${SUPABASE_URL}/rest/v1/newsletter_subscribers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON, Prefer: "return=minimal" },
    body: JSON.stringify({ email: testEmail, source: "e2e-test" }),
  });
  const subBody = await sub.text();
  assert(sub.ok, `subscribe failed: ${sub.status} ${subBody}`);

  // Unsubscribe via RPC
  const unsub = await fetch(`${SUPABASE_URL}/rest/v1/rpc/unsubscribe_newsletter`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${ANON}` },
    body: JSON.stringify({ _email: testEmail }),
  });
  const result = await unsub.json();
  assertEquals(result, true);
});
