import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Jenga API endpoints
const JENGA_AUTH_URL = "https://uat.jengahq.io/identity/v2/token";
const JENGA_STK_URL = "https://uat.jengahq.io/transaction/v2/payments";

interface STKPushRequest {
  phoneNumber: string;
  amount: number;
  reference: string;
  description?: string;
}

interface STKPushResponse {
  success: boolean;
  transactionId?: string;
  message?: string;
  error?: string;
}

async function getJengaAccessToken(apiKey: string, apiSecret: string): Promise<string> {
  console.log("Fetching Jenga access token...");
  
  const credentials = btoa(`${apiKey}:${apiSecret}`);
  
  const response = await fetch(JENGA_AUTH_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Jenga auth failed:", response.status, errorText);
    throw new Error(`Jenga authentication failed: ${response.status}`);
  }

  const data = await response.json();
  console.log("Jenga access token obtained successfully");
  return data.access_token;
}

async function initiateSTKPush(
  accessToken: string,
  merchantCode: string,
  paybillNumber: string,
  accountNumber: string,
  request: STKPushRequest
): Promise<STKPushResponse> {
  console.log("Initiating STK Push for phone:", request.phoneNumber);
  
  // Format phone number (ensure it's in 254XXXXXXXXX format)
  let formattedPhone = request.phoneNumber.replace(/\s+/g, "").replace(/[^0-9]/g, "");
  if (formattedPhone.startsWith("0")) {
    formattedPhone = "254" + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith("254")) {
    formattedPhone = "254" + formattedPhone;
  }

  const payload = {
    customer: {
      mobileNumber: formattedPhone,
      countryCode: "KE",
    },
    transaction: {
      amount: request.amount.toString(),
      description: request.description || "Grabbys Kitchen Order",
      type: "EquityPayment",
      reference: request.reference,
    },
    payment: {
      type: "Paybill",
      paybill: paybillNumber,
      accountNumber: accountNumber,
    },
    metadata: {
      merchantCode: merchantCode,
    },
  };

  console.log("STK Push payload:", JSON.stringify(payload, null, 2));

  const response = await fetch(JENGA_STK_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseData = await response.json();
  console.log("STK Push response:", JSON.stringify(responseData, null, 2));

  if (!response.ok) {
    console.error("STK Push failed:", response.status, responseData);
    return {
      success: false,
      error: responseData.message || responseData.error || "STK Push failed",
    };
  }

  return {
    success: true,
    transactionId: responseData.transactionId || responseData.referenceNumber,
    message: "STK Push initiated. Please enter your Equity Bank PIN on your phone.",
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get required secrets
    const JENGA_API_KEY = Deno.env.get("JENGA_API_KEY");
    const JENGA_API_SECRET = Deno.env.get("JENGA_API_SECRET");
    const JENGA_MERCHANT_CODE = Deno.env.get("JENGA_MERCHANT_CODE");
    const EQUITY_PAYBILL_NUMBER = Deno.env.get("EQUITY_PAYBILL_NUMBER");
    const EQUITY_ACCOUNT_NUMBER = Deno.env.get("EQUITY_ACCOUNT_NUMBER");

    if (!JENGA_API_KEY) {
      throw new Error("JENGA_API_KEY is not configured");
    }
    if (!JENGA_API_SECRET) {
      throw new Error("JENGA_API_SECRET is not configured");
    }
    if (!JENGA_MERCHANT_CODE) {
      throw new Error("JENGA_MERCHANT_CODE is not configured");
    }
    if (!EQUITY_PAYBILL_NUMBER) {
      throw new Error("EQUITY_PAYBILL_NUMBER is not configured");
    }
    if (!EQUITY_ACCOUNT_NUMBER) {
      throw new Error("EQUITY_ACCOUNT_NUMBER is not configured");
    }

    const { phoneNumber, amount, reference, description } = await req.json();

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ success: false, error: "Phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Valid amount is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing STK Push: ${phoneNumber}, Amount: ${amount}, Ref: ${reference}`);

    // Get access token
    const accessToken = await getJengaAccessToken(JENGA_API_KEY, JENGA_API_SECRET);

    // Initiate STK Push
    const result = await initiateSTKPush(
      accessToken,
      JENGA_MERCHANT_CODE,
      EQUITY_PAYBILL_NUMBER,
      EQUITY_ACCOUNT_NUMBER,
      { phoneNumber, amount, reference, description }
    );

    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("STK Push error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
