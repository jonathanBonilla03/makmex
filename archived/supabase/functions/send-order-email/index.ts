import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend";

const supabaseUrl = Deno.env.get("PROJECT_URL")!;
const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

const supabase = createClient(supabaseUrl, serviceRoleKey);
const resend = new Resend(resendApiKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email template function (embedded to avoid import issues)
function generateOrderConfirmationEmail({
  customerName,
  orderNumber,
  items,
  total,
  customerEmail,
}) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Order Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #333333; text-align: center; margin-bottom: 20px;">Order Confirmation</h1>
        
        <p style="font-size: 16px; line-height: 1.5; color: #555555;">Hi ${customerName},</p>
        
        <p style="font-size: 16px; line-height: 1.5; color: #555555;">Thank you for your order! Your order has been received and is being processed.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <p style="font-size: 18px; font-weight: bold; color: #333333; margin-bottom: 10px;">Order #${orderNumber}</p>
            <p style="font-size: 14px; color: #666666; margin-bottom: 5px;">Email: ${customerEmail}</p>
            <p style="font-size: 14px; color: #666666;">Date: ${new Date().toLocaleDateString()}</p>
        </div>

        <h2 style="font-size: 18px; color: #333333; margin-bottom: 15px;">Order Details</h2>
        
        <div style="margin-bottom: 20px;">
            ${items.map((item, i) => `
                <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: ${i < items.length - 1 ? '1px solid #eeeeee' : 'none'};">
                    <p style="font-size: 16px; font-weight: bold; color: #333333; margin: 0 0 5px 0;">${item.name}</p>
                    <p style="font-size: 14px; color: #666666; margin: 0 0 5px 0;">SKU: ${item.sku || 'N/A'} | Type: ${item.type}</p>
                    <p style="font-size: 14px; color: #666666; margin: 0;">Quantity: ${item.quantity} × $${item.price.toFixed(2)} = $${(item.quantity * item.price).toFixed(2)}</p>
                </div>
            `).join('')}
        </div>

        <hr style="border: none; border-top: 2px solid #333333; margin: 20px 0;">

        <div style="text-align: right;">
            <p style="font-size: 18px; font-weight: bold; color: #333333;">Total: $${total.toFixed(2)}</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
            <p style="font-size: 14px; color: #666666; margin-bottom: 15px;">We'll send another email when your order status changes.</p>
            <a href="mailto:support@makmex.com" style="background-color: #ff6b35; color: #000000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Contact Support</a>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee;">
            <p style="font-size: 12px; color: #999999; text-align: center;">This is an automated message. Please do not reply to this email.</p>
            <p style="font-size: 12px; color: #999999; text-align: center; margin-top: 5px;">© 2024 Makmex. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(JSON.stringify({ error: "Missing orderId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch order with customer information
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        created_at,
        total,
        subtotal,
        tax,
        status,
        customers!customer_id (
          id,
          name,
          email,
          phone_number
        )
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order fetch error:", orderError);
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch order items (products, kits, combos)
    const [productsResult, kitsResult, combosResult] = await Promise.all([
      supabase
        .from("order_products")
        .select(`
          quantity,
          unit_price,
          products!product_id (
            id,
            description,
            sku
          )
        `)
        .eq("order_id", orderId),
      
      supabase
        .from("order_kits")
        .select(`
          quantity,
          unit_price,
          kits!kit_id (
            id,
            description,
            sku
          )
        `)
        .eq("order_id", orderId),
      
      supabase
        .from("order_combos")
        .select(`
          quantity,
          unit_price,
          combos!combo_id (
            id,
            name,
            sku
          )
        `)
        .eq("order_id", orderId)
    ]);

    // Combine all items into a single array
    const items: any[] = [];

    // Add products
    if (productsResult.data) {
      productsResult.data.forEach(item => {
        items.push({
          name: item.products?.description || "Product",
          sku: item.products?.sku,
          quantity: item.quantity,
          price: Number(item.unit_price),
          type: "Product"
        });
      });
    }

    // Add kits
    if (kitsResult.data) {
      kitsResult.data.forEach(item => {
        items.push({
          name: item.kits?.description || "Kit",
          sku: item.kits?.sku,
          quantity: item.quantity,
          price: Number(item.unit_price),
          type: "Kit"
        });
      });
    }

    // Add combos
    if (combosResult.data) {
      combosResult.data.forEach(item => {
        items.push({
          name: item.combos?.name || "Combo",
          sku: item.combos?.sku,
          quantity: item.quantity,
          price: Number(item.unit_price),
          type: "Combo"
        });
      });
    }

    if (items.length === 0) {
      return new Response(JSON.stringify({ error: "No items found for order" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate email HTML using embedded template
    const emailHtml = generateOrderConfirmationEmail({
      customerName: order.customers?.name || "Customer",
      orderNumber: order.id.toString().substring(0, 8).toUpperCase(),
      items,
      total: Number(order.total),
      customerEmail: order.customers?.email || ""
    });

    // Send confirmation email to customer
    const emailResult = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: order.customers?.email || "",
      subject: `Order Confirmation #${order.id.toString().substring(0, 8).toUpperCase()}`,
      html: emailHtml,
    });

    // Send internal notification email (optional)
    try {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: "busters1125@gmail.com", // Internal notification
        subject: `New Order #${order.id.toString().substring(0, 8).toUpperCase()}`,
        html: `
          <h2>New order received</h2>
          <p><strong>Order #:</strong> ${order.id.toString().substring(0, 8).toUpperCase()}</p>
          <p><strong>Customer:</strong> ${order.customers?.name}</p>
          <p><strong>Email:</strong> ${order.customers?.email}</p>
          <p><strong>Phone:</strong> ${order.customers?.phone_number || 'Not provided'}</p>
          <p><strong>Total:</strong> $${Number(order.total).toFixed(2)}</p>
          <p><strong>Items:</strong> ${items.length} item(s)</p>
          <p><strong>Status:</strong> ${order.status}</p>
          <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
        `,
      });
    } catch (internalEmailError) {
      console.error("Failed to send internal notification email:", internalEmailError);
      // Don't fail the whole function if internal email fails
    }

    // Update order to mark confirmation email as sent
    await supabase
      .from("orders")
      .update({ 
        status: "confirmed",
        confirmation_email_sent: true,
        confirmation_email_sent_at: new Date().toISOString()
      })
      .eq("id", orderId);

    return new Response(JSON.stringify({ 
      success: true, 
      emailResult,
      orderId: order.id,
      orderNumber: order.id.toString().substring(0, 8).toUpperCase()
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in send-order-email function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
