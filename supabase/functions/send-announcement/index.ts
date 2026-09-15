import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(
  Deno.env.get("RESEND_API_KEY") ?? Deno.env.get("RESEND_DOMAIN_KEY") ?? "",
);

const FROM = Deno.env.get("RESEND_FROM") ?? "Grabbys <onboarding@resend.dev>";
const SITE = "https://grabbys-kitchen.lovable.app";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const buildHtml = (title: string, body: string) => {
  const paragraphs = body
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155">${escapeHtml(
          p,
        ).replace(/\n/g, "<br/>")}</p>`,
    )
    .join("");

  return `<!doctype html><html><body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="background:linear-gradient(135deg,#eaf2ff,#ffffff);border:1px solid #dbe7f5;border-radius:16px;padding:28px">
      <div style="text-align:center;margin-bottom:20px">
        <img src="${SITE}/grabbys-logo.jpeg" alt="Grabbys" width="64" height="64" style="border-radius:14px" />
        <h1 style="margin:14px 0 0;font-size:22px;color:#12325c">${escapeHtml(title)}</h1>
      </div>
      ${paragraphs}
      <div style="text-align:center;margin-top:24px">
        <a href="${SITE}" style="display:inline-block;background:#2b6fd1;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:999px;font-weight:bold">Open Grabbys</a>
      </div>
    </div>
    <p style="text-align:center;font-size:12px;color:#94a3b8;margin-top:18px">
      Grabbys &middot; Maseno, Kenya &middot; +254 752 140 592
    </p>
  </div>
</body></html>`;
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admins only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json().catch(() => null);
    const title = typeof payload?.title === "string" ? payload.title.trim() : "";
    const body = typeof payload?.body === "string" ? payload.body.trim() : "";
    const testEmail =
      typeof payload?.testEmail === "string" ? payload.testEmail.trim() : "";

    if (title.length < 3 || title.length > 150) {
      return new Response(
        JSON.stringify({ error: "Title must be 3-150 characters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (body.length < 20 || body.length > 8000) {
      return new Response(
        JSON.stringify({ error: "Message must be 20-8000 characters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const html = buildHtml(title, body);

    let recipients: string[] = [];
    if (testEmail) {
      recipients = [testEmail];
    } else {
      const service = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data: profiles, error: profileError } = await service
        .from("profiles")
        .select("email")
        .not("email", "is", null)
        .limit(5000);
      if (profileError) throw profileError;
      recipients = Array.from(
        new Set(
          (profiles ?? [])
            .map((p: { email: string | null }) => (p.email ?? "").trim())
            .filter((e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)),
        ),
      );
    }

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid recipients found" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < recipients.length; i += 25) {
      const batch = recipients.slice(i, i + 25);
      const results = await Promise.allSettled(
        batch.map((to) =>
          resend.emails.send({ from: FROM, to: [to], subject: title, html }),
        ),
      );
      for (const r of results) {
        if (r.status === "fulfilled" && !(r.value as { error?: unknown }).error) {
          sent += 1;
        } else {
          failed += 1;
        }
      }
      if (i + 25 < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }

    return new Response(
      JSON.stringify({ success: true, total: recipients.length, sent, failed }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
