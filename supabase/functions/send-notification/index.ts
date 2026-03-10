import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAIL = "grabbysapp@gmail.com";
const LOGO_URL = "https://grabbys-kitchen.lovable.app/grabbys-logo.jpeg";

// Simple HTML escaping to prevent XSS in emails
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Validate string input
function sanitizeStr(val: unknown, maxLen = 500): string {
  if (typeof val !== "string") return "";
  return escapeHtml(val.slice(0, maxLen).trim());
}

const getEmailHeader = () => `
  <div style="background: linear-gradient(135deg, #d4652a 0%, #e8a64c 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <img src="${LOGO_URL}" alt="Grabbys" style="height: 60px; width: auto; margin-bottom: 10px; border-radius: 8px;" />
    <p style="color: white; margin: 0; font-size: 14px; font-weight: bold;">— Get it fast. —</p>
  </div>
`;

interface NotificationRequest {
  type: "order" | "reservation" | "order_update" | "reservation_update" | "rider_assignment";
  customerEmail: string;
  customerName: string;
  details: {
    orderId?: string;
    items?: Array<{ name: string; quantity: number; price: number }>;
    totalAmount?: number;
    reservationDate?: string;
    reservationTime?: string;
    numberOfGuests?: number;
    specialRequests?: string;
    status?: string;
    transactionCode?: string;
    deliveryAddress?: string;
    deliveryPhone?: string;
    deliveryLatitude?: number;
    deliveryLongitude?: number;
    riderEmail?: string;
    riderName?: string;
  };
}

const getStatusEmoji = (status: string): string => {
  switch (status) {
    case 'pending': return '⏳';
    case 'preparing': return '👨‍🍳';
    case 'ready': return '✅';
    case 'delivering': return '🚴';
    case 'delivered': return '🎉';
    case 'cancelled': return '❌';
    default: return '📦';
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'pending': return 'Order Received';
    case 'preparing': return 'Being Prepared';
    case 'ready': return 'Ready for Pickup';
    case 'delivering': return 'Out for Delivery';
    case 'delivered': return 'Delivered';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawBody: NotificationRequest = await req.json();

    // Validate required fields
    const validTypes = ["order", "reservation", "order_update", "reservation_update", "rider_assignment"];
    if (!validTypes.includes(rawBody.type)) {
      return new Response(
        JSON.stringify({ error: "Invalid notification type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!rawBody.customerEmail || !emailRegex.test(rawBody.customerEmail) || rawBody.customerEmail.length > 255) {
      return new Response(
        JSON.stringify({ error: "Valid customer email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize all user-provided strings
    const type = rawBody.type;
    const customerEmail = rawBody.customerEmail.trim().slice(0, 255);
    const customerName = sanitizeStr(rawBody.customerName, 100) || "Customer";
    const details = rawBody.details || {};
    const orderId = sanitizeStr(details.orderId, 50);
    const transactionCode = sanitizeStr(details.transactionCode, 50);
    const deliveryAddress = sanitizeStr(details.deliveryAddress, 500);
    const deliveryPhone = sanitizeStr(details.deliveryPhone, 20);
    const specialRequests = sanitizeStr(details.specialRequests, 500);
    const status = sanitizeStr(details.status, 30);
    const riderName = sanitizeStr(details.riderName, 100);
    const riderEmail = details.riderEmail && emailRegex.test(details.riderEmail) ? details.riderEmail.trim().slice(0, 255) : "";
    const reservationDate = sanitizeStr(details.reservationDate, 30);
    const reservationTime = sanitizeStr(details.reservationTime, 20);
    const numberOfGuests = typeof details.numberOfGuests === "number" ? Math.min(Math.max(1, Math.floor(details.numberOfGuests)), 100) : 0;
    const totalAmount = typeof details.totalAmount === "number" ? details.totalAmount : 0;
    const deliveryLatitude = typeof details.deliveryLatitude === "number" ? details.deliveryLatitude : null;
    const deliveryLongitude = typeof details.deliveryLongitude === "number" ? details.deliveryLongitude : null;

    // Sanitize items
    const items = Array.isArray(details.items) ? details.items.slice(0, 100).map(item => ({
      name: sanitizeStr(item.name, 100),
      quantity: typeof item.quantity === "number" ? Math.min(Math.max(1, Math.floor(item.quantity)), 1000) : 1,
      price: typeof item.price === "number" ? item.price : 0,
    })) : [];

    console.log(`Sending ${type} notification to ${customerEmail} and admin`);

    let customerSubject: string;
    let customerHtml: string;
    let adminHtml: string;

    if (type === "order") {
      const itemsList = items.map(item => 
        `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">x${item.quantity}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">KSh ${item.price.toLocaleString()}</td></tr>`
      ).join("");

      customerSubject = "Order Confirmation - Grabbys";
      customerHtml = `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #faf8f5; padding: 20px;">
          ${getEmailHeader()}
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #2d3d2f;">Thank you for your order, ${customerName}!</h2>
            <p style="color: #5d6d5f;">Your order has been received and is being prepared with care. 🚀</p>
            <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
              <thead><tr style="background: #faf8f5;"><th style="padding: 12px; text-align: left;">Item</th><th style="padding: 12px; text-align: left;">Qty</th><th style="padding: 12px; text-align: left;">Price</th></tr></thead>
              <tbody>${itemsList}</tbody>
            </table>
            <div style="background: #2d3d2f; color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <strong>Total: KSh ${totalAmount.toLocaleString()}</strong>
            </div>
            ${transactionCode ? `<p style="color: #5d6d5f; font-size: 14px; margin-top: 15px;">Payment: M-Pesa Code <strong>${transactionCode}</strong></p>` : ''}
            <p style="color: #8b8b8b; font-size: 14px; margin-top: 20px;">Order ID: ${orderId}</p>
            <p style="color: #8b8b8b; font-size: 14px;">Track your order in the app! 📍</p>
          </div>
        </div>
      `;

      adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d4652a;">New Order Received! 💰</h2>
          <p><strong>Customer:</strong> ${customerName} (${escapeHtml(customerEmail)})</p>
          <p><strong>Order ID:</strong> ${orderId}</p>
          ${transactionCode ? `<p><strong>M-Pesa Code:</strong> ${transactionCode}</p>` : ''}
          ${deliveryPhone ? `<p><strong>Phone:</strong> ${deliveryPhone}</p>` : ''}
          ${deliveryAddress ? `<p><strong>Delivery:</strong> ${deliveryAddress}</p>` : ''}
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead><tr style="background: #f5f5f5;"><th style="padding: 10px; border: 1px solid #ddd;">Item</th><th style="padding: 10px; border: 1px solid #ddd;">Qty</th><th style="padding: 10px; border: 1px solid #ddd;">Price</th></tr></thead>
            <tbody>${itemsList}</tbody>
          </table>
          <p style="font-size: 18px;"><strong>Total: KSh ${totalAmount.toLocaleString()}</strong></p>
        </div>
      `;
    } else if (type === "rider_assignment") {
      if (!riderEmail) {
        return new Response(
          JSON.stringify({ error: "Valid rider email required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const itemsList = items.map(item => 
        `<li style="margin: 5px 0;">${item.quantity}x ${item.name} - KSh ${(item.price * item.quantity).toLocaleString()}</li>`
      ).join("");

      const googleMapsLink = deliveryLatitude && deliveryLongitude 
        ? `https://www.google.com/maps/dir/?api=1&destination=${deliveryLatitude},${deliveryLongitude}`
        : '';

      customerSubject = "🚴 New Delivery Assignment - Grabbys";
      customerHtml = `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #faf8f5; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0;">🚴 New Delivery Assignment!</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #2d3d2f;">You have been assigned a new delivery!</h2>
            <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0; font-weight: bold; font-size: 14px;">Order #${orderId.slice(0, 8)}</p>
              <p style="margin: 5px 0 0 0; font-size: 28px; color: #2e7d32; font-weight: bold;">KSh ${totalAmount.toLocaleString()}</p>
            </div>
            <h3 style="color: #2d3d2f;">👤 Customer Details:</h3>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
              <table style="width: 100%;">
                <tr><td style="padding: 5px 0; color: #666;">Name:</td><td style="padding: 5px 0; font-weight: bold;">${customerName}</td></tr>
                ${deliveryPhone ? `<tr><td style="padding: 5px 0; color: #666;">Phone:</td><td style="padding: 5px 0; font-weight: bold;">${deliveryPhone}</td></tr>` : ''}
              </table>
            </div>
            <h3 style="color: #2d3d2f;">📦 Order Items:</h3>
            <ul style="color: #5d6d5f; background: #fafafa; border-radius: 8px; padding: 15px 15px 15px 35px;">${itemsList}</ul>
            <h3 style="color: #2d3d2f;">📍 Delivery Location:</h3>
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3;">
              <p style="margin: 0; font-weight: bold;">${deliveryAddress || 'See app for location'}</p>
            </div>
            ${googleMapsLink ? `<a href="${googleMapsLink}" style="display: block; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 18px; text-align: center; border-radius: 8px; margin-top: 25px; text-decoration: none; font-weight: bold; font-size: 16px;">🗺️ Navigate with Google Maps</a>` : ''}
          </div>
        </div>
      `;

      adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Rider Assigned to Order</h2>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Rider:</strong> ${riderName} (${escapeHtml(riderEmail)})</p>
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Delivery Address:</strong> ${deliveryAddress || 'N/A'}</p>
        </div>
      `;

      // Send to rider
      const riderResponse = await resend.emails.send({
        from: "Grabbys <onboarding@resend.dev>",
        to: [riderEmail],
        subject: customerSubject,
        html: customerHtml,
      });
      console.log("Rider email sent:", riderResponse);

      // Send to admin
      const adminResponse = await resend.emails.send({
        from: "Grabbys <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `🚴 Rider Assigned: Order #${orderId.slice(0, 8)}`,
        html: adminHtml,
      });
      console.log("Admin email sent:", adminResponse);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } else if (type === "order_update") {
      const statusEmoji = getStatusEmoji(status);
      const statusText = getStatusText(status);
      
      customerSubject = `Order Update: ${statusText} - Grabbys`;
      customerHtml = `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #faf8f5; padding: 20px;">
          ${getEmailHeader()}
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #2d3d2f;">Order Status Update ${statusEmoji}</h2>
            <p style="color: #5d6d5f;">Hi ${customerName}!</p>
            <div style="background: #faf8f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="font-size: 48px; margin: 0;">${statusEmoji}</p>
              <h3 style="color: #d4652a; margin: 10px 0;">${statusText}</h3>
              <p style="color: #5d6d5f; margin: 0;">Order #${orderId.slice(0, 8)}</p>
            </div>
            ${status === 'delivering' ? `<div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 15px 0;"><p style="margin: 0; color: #2e7d32;">🚴 Your order is on its way!</p></div>` : ''}
            ${status === 'delivered' ? `<div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 15px 0;"><p style="margin: 0; color: #2e7d32;">🎉 Your order has been delivered! Enjoy your meal!</p></div>` : ''}
            <p style="color: #8b8b8b; font-size: 14px; margin-top: 20px;">Thank you for choosing Grabbys! 🙏</p>
          </div>
        </div>
      `;

      adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d4652a;">Order Status Changed</h2>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Customer:</strong> ${customerName} (${escapeHtml(customerEmail)})</p>
          <p><strong>New Status:</strong> ${statusEmoji} ${statusText}</p>
        </div>
      `;
    } else if (type === "reservation_update") {
      customerSubject = `Reservation Update - Grabbys`;
      customerHtml = `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #faf8f5; padding: 20px;">
          ${getEmailHeader()}
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #2d3d2f;">Reservation Update</h2>
            <p style="color: #5d6d5f;">Hi ${customerName}!</p>
            <div style="background: #faf8f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #d4652a; margin: 10px 0; text-transform: capitalize;">${status}</h3>
            </div>
            <p style="color: #8b8b8b; font-size: 14px;">Questions? Contact us at ${ADMIN_EMAIL}</p>
          </div>
        </div>
      `;

      adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d4652a;">Reservation Status Changed</h2>
          <p><strong>Customer:</strong> ${customerName} (${escapeHtml(customerEmail)})</p>
          <p><strong>New Status:</strong> ${status}</p>
        </div>
      `;
    } else {
      customerSubject = "Reservation Confirmation - Grabbys";
      customerHtml = `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #faf8f5; padding: 20px;">
          ${getEmailHeader()}
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #2d3d2f;">Reservation Confirmed, ${customerName}!</h2>
            <p style="color: #5d6d5f;">We're looking forward to hosting you. 🎉</p>
            <div style="background: #faf8f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 8px 0;"><strong>📅 Date:</strong> ${reservationDate}</p>
              <p style="margin: 8px 0;"><strong>🕐 Time:</strong> ${reservationTime}</p>
              <p style="margin: 8px 0;"><strong>👥 Guests:</strong> ${numberOfGuests}</p>
              ${specialRequests ? `<p style="margin: 8px 0;"><strong>📝 Special Requests:</strong> ${specialRequests}</p>` : ""}
            </div>
            <p style="color: #8b8b8b; font-size: 14px;">Need to make changes? Contact us at ${ADMIN_EMAIL}</p>
          </div>
        </div>
      `;

      adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d4652a;">New Reservation!</h2>
          <p><strong>Customer:</strong> ${customerName} (${escapeHtml(customerEmail)})</p>
          <p><strong>Date:</strong> ${reservationDate}</p>
          <p><strong>Time:</strong> ${reservationTime}</p>
          <p><strong>Guests:</strong> ${numberOfGuests}</p>
          ${specialRequests ? `<p><strong>Special Requests:</strong> ${specialRequests}</p>` : ""}
        </div>
      `;
    }

    // Send to customer
    const customerResponse = await resend.emails.send({
      from: "Grabbys <onboarding@resend.dev>",
      to: [customerEmail],
      subject: customerSubject,
      html: customerHtml,
    });
    console.log("Customer email sent:", JSON.stringify(customerResponse));

    // Send to admin
    const adminResponse = await resend.emails.send({
      from: "Grabbys <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: type === "order" 
        ? `🛒 New Order from ${customerName}` 
        : type === "order_update"
        ? `📦 Order Status Update: ${status}`
        : type === "reservation_update"
        ? `📅 Reservation Update: ${status}`
        : `📅 New Reservation from ${customerName}`,
      html: adminHtml,
    });
    console.log("Admin email sent:", JSON.stringify(adminResponse));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Notification error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send notification" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
