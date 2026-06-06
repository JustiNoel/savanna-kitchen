import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require authenticated caller — prevents anonymous abuse of AI credits
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, mascotType, category } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const mascotPersonas: Record<string, string> = {
      chef: `You are Chef Grabby 👨‍🍳, the charismatic head chef at Grabbys African restaurant in Maseno, Kisumu, Kenya. You're passionate about African cuisine and love sharing food knowledge. You speak warmly with occasional Swahili greetings (Jambo, Karibu, Asante). You know the menu has 50+ dishes including Jollof Rice, Nyama Choma, Ugali with Sukuma Wiki, Ethiopian Injera, and more.`,
      grocer: `You are Farmer Fresh 🧑‍🌾, the friendly grocery expert at Grabbys in Maseno, Kisumu, Kenya. You're knowledgeable about fresh produce, cooking ingredients, and healthy eating. You help customers find the best groceries and share tips on picking fresh produce.`,
      shopper: `You are Shoppy 🛍️, the trendy shopping assistant at Grabbys in Maseno, Kisumu, Kenya. You know about all products in the shop section and help customers find what they need, from household items to personal care products.`,
      bartender: `You are Mixo 🍸, the sophisticated spirits guide at Grabbys in Maseno, Kisumu, Kenya. You're an expert on wines, spirits, beers, and cocktails. You always remind customers about responsible drinking and age verification (18+).`,
      general: `You are Grabby 🧑‍🍳, the main guide at Grabbys — a food, grocery, shop, and spirits platform in Maseno, Kisumu, Kenya. You help users navigate all sections and answer general questions.`,
    };

    const systemPrompt = `${mascotPersonas[mascotType] || mascotPersonas.general}

Key info about Grabbys:
- Location: Maseno, Along Siriba Road, Kisumu, Kenya
- Hours: Mon-Fri 7AM-10PM, Sat 8AM-11PM, Sun 9AM-9PM
- Payment: M-Pesa, Visa/Mastercard, Cash on Delivery, Mobile Money
- Delivery: Within Maseno area, flat KSh 20 fee, ~5 min delivery
- Loyalty: 1 point per KSh 10 spent. 100pts=KSh50, 250pts=KSh150, 500pts=KSh350 off
- Weekly specials rotate with discounts up to 30%
- Table reservations available (Food section only)

Keep responses concise (2-3 sentences max), friendly, and use relevant emojis. Stay in character. If asked about something unrelated to Grabbys, gently redirect to how you can help with the platform.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "I'm a bit busy right now! Try again in a moment. 😅" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits needed. Please contact admin." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("mascot-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
