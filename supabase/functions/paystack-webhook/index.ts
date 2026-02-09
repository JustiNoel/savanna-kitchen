import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-paystack-signature",
};

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error("PAYSTACK_SECRET_KEY is not configured.");
    }

    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify webhook signature
    if (signature) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(PAYSTACK_SECRET_KEY),
        { name: "HMAC", hash: "SHA-512" },
        false,
        ["sign"]
      );
      const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
      const expectedSignature = toHex(sig);

      if (expectedSignature !== signature) {
        console.error("Invalid webhook signature");
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const event = JSON.parse(body);
    console.log("Paystack webhook event:", event.event, "ref:", event.data?.reference);

    if (event.event === "charge.success") {
      const txn = event.data;
      const reference = txn.reference;

      // Initialize Supabase admin client
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Find order by reference in notes
      const { data: orders, error: findError } = await supabase
        .from("orders")
        .select("id, payment_status")
        .like("notes", `%${reference}%`)
        .limit(1);

      if (findError) {
        console.error("Error finding order:", findError);
      } else if (orders && orders.length > 0) {
        const order = orders[0];
        if (order.payment_status !== "paid") {
          const { error: updateError } = await supabase
            .from("orders")
            .update({ payment_status: "paid" })
            .eq("id", order.id);

          if (updateError) {
            console.error("Error updating order:", updateError);
          } else {
            console.log(`Order ${order.id} marked as paid via webhook`);
          }
        }

        // Record financial transaction server-side (bypasses RLS)
        const amountInKES = txn.amount / 100; // Paystack sends amount in kobo/cents
        const { error: finError } = await supabase
          .from("financial_transactions")
          .insert({
            order_id: order.id,
            type: "income",
            category: "order_payment",
            amount: amountInKES,
            description: `Order #${order.id.slice(0, 8)} - Paystack Payment`,
            payment_method: "paystack",
            reference_number: reference,
          });

        if (finError) {
          console.error("Error recording financial transaction:", finError);
        } else {
          console.log(`Financial transaction recorded for order ${order.id}`);
        }
      } else {
        console.log(`No order found for reference: ${reference}`);
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
