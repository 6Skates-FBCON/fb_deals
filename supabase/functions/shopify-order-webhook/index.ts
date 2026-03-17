import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Shopify-Hmac-Sha256, X-Shopify-Shop-Domain, X-Shopify-Topic",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawBody = await req.text();
    const order = JSON.parse(rawBody);

    console.log("=== SHOPIFY WEBHOOK RECEIVED ===");
    console.log("Order ID:", order.id);
    console.log("Order Number:", order.order_number);
    console.log("Customer Email:", order.customer?.email);
    console.log("Line Items:", order.line_items?.length);

    if (!order.line_items || order.line_items.length === 0) {
      console.log("No line items in order, skipping");
      return new Response(JSON.stringify({ message: "No line items" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const purchases = [];
    const inventoryUpdates = [];

    for (const item of order.line_items) {
      const productId = `gid://shopify/Product/${item.product_id}`;
      console.log("Processing item:", item.name, "Product ID:", productId);

      const { data: deal, error: dealError } = await supabase
        .from("deals")
        .select("*")
        .eq("shopify_product_id", productId)
        .maybeSingle();

      if (dealError) {
        console.error("Error fetching deal:", dealError);
        continue;
      }

      if (!deal) {
        console.log("No matching deal found for product:", productId);
        continue;
      }

      console.log("Found deal:", deal.title, "Current qty:", deal.quantity_remaining);

      const quantity = item.quantity || 1;
      const newQuantity = Math.max(0, deal.quantity_remaining - quantity);

      let userId = null;
      if (order.customer?.email) {
        const { data: user } = await supabase
          .from("auth.users")
          .select("id")
          .eq("email", order.customer.email)
          .maybeSingle();

        if (user) {
          userId = user.id;
        }
      }

      if (order.note_attributes) {
        const userIdAttr = order.note_attributes.find(
          (attr: any) => attr.name === "user_id"
        );
        if (userIdAttr?.value) {
          userId = userIdAttr.value;
        }
      }

      purchases.push({
        deal_id: deal.id,
        user_id: userId,
        customer_email: order.customer?.email || order.email || "guest",
        customer_name: order.customer?.first_name && order.customer?.last_name
          ? `${order.customer.first_name} ${order.customer.last_name}`
          : order.customer?.email || "Guest",
        purchase_price: parseFloat(item.price),
        quantity: quantity,
        status: "completed",
        shopify_order_id: order.id.toString(),
        shopify_order_number: order.order_number?.toString() || order.name,
      });

      inventoryUpdates.push({
        dealId: deal.id,
        newQuantity: newQuantity,
      });
    }

    if (purchases.length > 0) {
      console.log("Inserting purchases:", purchases.length);
      const { error: insertError } = await supabase
        .from("purchases")
        .insert(purchases);

      if (insertError) {
        console.error("Error inserting purchases:", insertError);
        throw insertError;
      }

      console.log("Updating inventory for", inventoryUpdates.length, "deals");
      for (const update of inventoryUpdates) {
        const { error: updateError } = await supabase
          .from("deals")
          .update({
            quantity_remaining: update.newQuantity,
            updated_at: new Date().toISOString(),
          })
          .eq("id", update.dealId);

        if (updateError) {
          console.error("Error updating deal inventory:", updateError);
        } else {
          console.log("Updated deal", update.dealId, "to quantity", update.newQuantity);
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: "Webhook processed successfully",
        purchases: purchases.length,
        inventoryUpdates: inventoryUpdates.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
