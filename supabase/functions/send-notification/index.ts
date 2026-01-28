import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAIL = "grabbysapp@gmail.com";

interface NotificationRequest {
  type: "order" | "reservation" | "order_update" | "reservation_update";
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
    const { type, customerEmail, customerName, details }: NotificationRequest = await req.json();
    
    console.log(`Sending ${type} notification to ${customerEmail} and admin`);

    let customerSubject: string;
    let customerHtml: string;
    let adminHtml: string;

    if (type === "order") {
      const itemsList = details.items?.map(item => 
        `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">x${item.quantity}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">KSh ${item.price.toLocaleString()}</td></tr>`
      ).join("") || "";

      customerSubject = "Order Confirmation - Grabbys";
      customerHtml = `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #faf8f5; padding: 20px;">
          <div style="background: linear-gradient(135deg, #d4652a 0%, #e8a64c 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-family: 'Playfair Display', serif;">Grabbys 🍽️🥕🏪🍾</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #2d3d2f;">Thank you for your order, ${customerName}!</h2>
            <p style="color: #5d6d5f;">Your order has been received and is being prepared with care. 🚀</p>
            <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
              <thead>
                <tr style="background: #faf8f5;">
                  <th style="padding: 12px; text-align: left;">Item</th>
                  <th style="padding: 12px; text-align: left;">Qty</th>
                  <th style="padding: 12px; text-align: left;">Price</th>
                </tr>
              </thead>
              <tbody>${itemsList}</tbody>
            </table>
            <div style="background: #2d3d2f; color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <strong>Total: KSh ${details.totalAmount?.toLocaleString()}</strong>
            </div>
            <p style="color: #8b8b8b; font-size: 14px; margin-top: 20px;">Order ID: ${details.orderId}</p>
            <p style="color: #8b8b8b; font-size: 14px;">Track your order in the app! 📍</p>
          </div>
        </div>
      `;

      adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d4652a;">New Order Received!</h2>
          <p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
          <p><strong>Order ID:</strong> ${details.orderId}</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead><tr style="background: #f5f5f5;"><th style="padding: 10px; border: 1px solid #ddd;">Item</th><th style="padding: 10px; border: 1px solid #ddd;">Qty</th><th style="padding: 10px; border: 1px solid #ddd;">Price</th></tr></thead>
            <tbody>${itemsList}</tbody>
          </table>
          <p style="font-size: 18px;"><strong>Total: KSh ${details.totalAmount?.toLocaleString()}</strong></p>
        </div>
      `;
    } else if (type === "order_update") {
      const statusEmoji = getStatusEmoji(details.status || '');
      const statusText = getStatusText(details.status || '');
      
      customerSubject = `Order Update: ${statusText} - Grabbys`;
      customerHtml = `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #faf8f5; padding: 20px;">
          <div style="background: linear-gradient(135deg, #d4652a 0%, #e8a64c 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-family: 'Playfair Display', serif;">Grabbys 🍽️</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #2d3d2f;">Order Status Update ${statusEmoji}</h2>
            <p style="color: #5d6d5f;">Hi ${customerName}!</p>
            <div style="background: #faf8f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="font-size: 48px; margin: 0;">${statusEmoji}</p>
              <h3 style="color: #d4652a; margin: 10px 0;">${statusText}</h3>
              <p style="color: #5d6d5f; margin: 0;">Order #${details.orderId?.slice(0, 8)}</p>
            </div>
            ${details.status === 'delivering' ? `
              <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="margin: 0; color: #2e7d32;">🚴 Your order is on its way! Track your rider in the app.</p>
              </div>
            ` : ''}
            ${details.status === 'delivered' ? `
              <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="margin: 0; color: #2e7d32;">🎉 Your order has been delivered! Enjoy your meal!</p>
                <p style="margin: 5px 0 0 0; color: #5d6d5f; font-size: 14px;">We'd love to hear your feedback!</p>
              </div>
            ` : ''}
            <p style="color: #8b8b8b; font-size: 14px; margin-top: 20px;">Thank you for choosing Grabbys! 🙏</p>
          </div>
        </div>
      `;

      adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d4652a;">Order Status Changed</h2>
          <p><strong>Order ID:</strong> ${details.orderId}</p>
          <p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
          <p><strong>New Status:</strong> ${statusEmoji} ${statusText}</p>
        </div>
      `;
    } else if (type === "reservation_update") {
      customerSubject = `Reservation Update - Grabbys`;
      customerHtml = `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #faf8f5; padding: 20px;">
          <div style="background: linear-gradient(135deg, #d4652a 0%, #e8a64c 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-family: 'Playfair Display', serif;">Grabbys 🍽️</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #2d3d2f;">Reservation Update</h2>
            <p style="color: #5d6d5f;">Hi ${customerName}!</p>
            <div style="background: #faf8f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #d4652a; margin: 10px 0; text-transform: capitalize;">${details.status}</h3>
            </div>
            <p style="color: #8b8b8b; font-size: 14px;">Questions? Contact us at ${ADMIN_EMAIL}</p>
          </div>
        </div>
      `;

      adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d4652a;">Reservation Status Changed</h2>
          <p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
          <p><strong>New Status:</strong> ${details.status}</p>
        </div>
      `;
    } else {
      // Reservation confirmation
      customerSubject = "Reservation Confirmation - Grabbys";
      customerHtml = `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #faf8f5; padding: 20px;">
          <div style="background: linear-gradient(135deg, #d4652a 0%, #e8a64c 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-family: 'Playfair Display', serif;">Grabbys 🍽️</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #2d3d2f;">Reservation Confirmed, ${customerName}!</h2>
            <p style="color: #5d6d5f;">We're looking forward to hosting you. 🎉</p>
            <div style="background: #faf8f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 8px 0;"><strong>📅 Date:</strong> ${details.reservationDate}</p>
              <p style="margin: 8px 0;"><strong>🕐 Time:</strong> ${details.reservationTime}</p>
              <p style="margin: 8px 0;"><strong>👥 Guests:</strong> ${details.numberOfGuests}</p>
              ${details.specialRequests ? `<p style="margin: 8px 0;"><strong>📝 Special Requests:</strong> ${details.specialRequests}</p>` : ""}
            </div>
            <p style="color: #8b8b8b; font-size: 14px;">Need to make changes? Contact us at ${ADMIN_EMAIL}</p>
          </div>
        </div>
      `;

      adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d4652a;">New Reservation!</h2>
          <p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
          <p><strong>Date:</strong> ${details.reservationDate}</p>
          <p><strong>Time:</strong> ${details.reservationTime}</p>
          <p><strong>Guests:</strong> ${details.numberOfGuests}</p>
          ${details.specialRequests ? `<p><strong>Special Requests:</strong> ${details.specialRequests}</p>` : ""}
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
    console.log("Customer email sent:", customerResponse);

    // Send to admin
    const adminResponse = await resend.emails.send({
      from: "Grabbys <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: type === "order" 
        ? `🛒 New Order from ${customerName}` 
        : type === "order_update"
        ? `📦 Order Status Update: ${details.status}`
        : type === "reservation_update"
        ? `📅 Reservation Update: ${details.status}`
        : `📅 New Reservation from ${customerName}`,
      html: adminHtml,
    });
    console.log("Admin email sent:", adminResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
