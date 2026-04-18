/**
 * Properties 714 — AI Proxy Edge Function
 * Forwards requests to the Anthropic Claude API server-side.
 * API key stored as Supabase secret: ANTHROPIC_API_KEY
 *
 * Deploy: supabase functions deploy ai-proxy --no-verify-jwt
 * Secret: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    console.error("[ai-proxy] ANTHROPIC_API_KEY secret not set");
    return new Response(
      JSON.stringify({
        error: { type: "api_error", message: "AI service not configured. Contact your administrator." },
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: { type: "invalid_request_error", message: "Invalid JSON body" } }),
      { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();

    return new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (err) {
    console.error("[ai-proxy] Upstream error:", err);
    return new Response(
      JSON.stringify({ error: { type: "api_error", message: "Failed to reach AI service" } }),
      { status: 502, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }
});
