import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Safaricom Daraja API endpoints
const DARAJA_AUTH_URL = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
const DARAJA_STK_URL = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

interface STKPushRequest {
  phoneNumber: string;
  amount: number;
  reference: string;
  description?: string;
}

async function getDarajaAccessToken(consumerKey: string, consumerSecret: string): Promise<string> {
  console.log("Fetching Daraja access token...");

  const credentials = btoa(`${consumerKey}:${consumerSecret}`);

  const response = await fetch(DARAJA_AUTH_URL, {
    method: "GET",
    headers: {
      "Authorization": `Basic ${credentials}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Daraja auth failed:", response.status, errorText);
    throw new Error(`Daraja authentication failed: ${response.status}`);
  }

  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    const textResponse = await response.text();
    console.error("Daraja auth returned non-JSON:", textResponse.substring(0, 200));
    throw new Error("Daraja API returned an invalid response during authentication.");
  }

  const data = await response.json();
  console.log("Daraja access token obtained successfully");
  return data.access_token;
}

function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function generatePassword(shortcode: string, passkey: string, timestamp: string): string {
  const rawPassword = `${shortcode}${passkey}${timestamp}`;
  return btoa(rawPassword);
}

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\s+/g, "").replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.substring(1);
  } else if (cleaned.startsWith("+254")) {
    cleaned = cleaned.substring(1);
  } else if (!cleaned.startsWith("254")) {
    cleaned = "254" + cleaned;
  }
  return cleaned;
}

async function initiateSTKPush(
  accessToken: string,
  shortcode: string,
  passkey: string,
  accountNumber: string,
  request: STKPushRequest
) {
  console.log("Initiating M-Pesa STK Push for phone:", request.phoneNumber);

  const timestamp = generateTimestamp();
  const password = generatePassword(shortcode, passkey, timestamp);
  const formattedPhone = formatPhoneNumber(request.phoneNumber);

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.ceil(request.amount),
    PartyA: formattedPhone,
    PartyB: shortcode,
    PhoneNumber: formattedPhone,
    CallBackURL: "https://mydomain.com/path", // Placeholder - ideally a webhook
    AccountReference: accountNumber,
    TransactionDesc: request.description || "Grabbys Kitchen Order",
  };

  console.log("STK Push payload:", JSON.stringify({ ...payload, Password: "[REDACTED]" }, null, 2));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch(DARAJA_STK_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      const textResponse = await response.text();
      console.error("Daraja STK Push returned non-JSON:", textResponse.substring(0, 200));
      throw new Error("M-Pesa API returned an invalid response. Please try again.");
    }

    let responseData;
    try {
      responseData = await response.json();
    } catch (parseError) {
      console.error("Failed to parse Daraja response:", parseError);
      throw new Error("M-Pesa API returned malformed JSON response");
    }

    console.log("STK Push response:", JSON.stringify(responseData, null, 2));

    if (responseData.ResponseCode === "0") {
      return {
        success: true,
        transactionId: responseData.CheckoutRequestID || responseData.MerchantRequestID,
        message: "STK Push initiated. Please enter your M-Pesa PIN on your phone.",
      };
    } else {
      console.error("STK Push failed:", responseData);
      return {
        success: false,
        error: responseData.errorMessage || responseData.ResponseDescription || "STK Push failed. Please try again.",
      };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("M-Pesa request timed out. Please try again.");
    }
    throw error;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MPESA_CONSUMER_KEY = Deno.env.get("MPESA_CONSUMER_KEY");
    const MPESA_CONSUMER_SECRET = Deno.env.get("MPESA_CONSUMER_SECRET");
    const MPESA_PASSKEY = Deno.env.get("MPESA_PASSKEY");
    const MPESA_SHORTCODE = Deno.env.get("MPESA_SHORTCODE");
    const MPESA_ACCOUNT_NUMBER = Deno.env.get("MPESA_ACCOUNT_NUMBER");

    if (!MPESA_CONSUMER_KEY) {
      throw new Error("MPESA_CONSUMER_KEY is not configured. Add in Lovable Cloud > Secrets.");
    }
    if (!MPESA_CONSUMER_SECRET) {
      throw new Error("MPESA_CONSUMER_SECRET is not configured. Add in Lovable Cloud > Secrets.");
    }
    if (!MPESA_PASSKEY) {
      throw new Error("MPESA_PASSKEY is not configured. Add in Lovable Cloud > Secrets.");
    }
    if (!MPESA_SHORTCODE) {
      throw new Error("MPESA_SHORTCODE is not configured. Add in Lovable Cloud > Secrets.");
    }
    if (!MPESA_ACCOUNT_NUMBER) {
      throw new Error("MPESA_ACCOUNT_NUMBER is not configured. Add in Lovable Cloud > Secrets.");
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

    console.log(`Processing M-Pesa STK Push: Phone=${phoneNumber}, Amount=${amount}, Ref=${reference}`);

    // Get Daraja access token
    const accessToken = await getDarajaAccessToken(MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET);

    // Initiate STK Push
    const result = await initiateSTKPush(
      accessToken,
      MPESA_SHORTCODE,
      MPESA_PASSKEY,
      MPESA_ACCOUNT_NUMBER,
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
    console.error("M-Pesa STK Push error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
