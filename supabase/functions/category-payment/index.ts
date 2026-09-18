import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Not authenticated" }, 401);

    const authed = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: userError,
    } = await authed.auth.getUser();
    if (userError || !user) return json({ error: "Not authenticated" }, 401);

    const payload = await req.json().catch(() => null);
    const slugRaw = typeof payload?.slug === "string" ? payload.slug.trim() : "";
    if (!/^[a-z0-9-]{2,60}$/i.test(slugRaw)) {
      return json({ error: "Invalid category" }, 400);
    }
    const slug = slugRaw.toLowerCase();

    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: category, error: catError } = await service
      .from("categories")
      .select("id, name, slug")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (catError) throw catError;
    if (!category) return json({ error: "Category not found" }, 404);

    const { data: setting, error: payError } = await service
      .from("category_payment_settings")
      .select(
        "provider, account_name, paybill_number, till_number, account_number, bank_name, partner_name, is_active",
      )
      .eq("category_id", category.id)
      .eq("is_active", true)
      .maybeSingle();

    if (payError) throw payError;
    if (!setting) {
      return json({
        category: { name: category.name, slug: category.slug },
        payment: null,
      });
    }

    // Only the payment details of THIS category are ever returned.
    return json({
      category: { name: category.name, slug: category.slug },
      payment: {
        provider: setting.provider,
        account_name: setting.account_name,
        paybill_number: setting.paybill_number,
        till_number: setting.till_number,
        account_number: setting.account_number,
        bank_name: setting.bank_name,
        partner_name: setting.partner_name,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return json({ error: message }, 500);
  }
});
