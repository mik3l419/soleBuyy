import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("x-paystack-signature");
    
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing signature" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await req.text();
    
    // Verify webhook signature
    const secret = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!secret) {
      throw new Error("PAYSTACK_SECRET_KEY not configured");
    }

    // Calculate expected signature
    const encoder = new TextEncoder();
    const keyBuf = encoder.encode(secret);
    const msgBuf = encoder.encode(body);
    const hashBuf = await crypto.subtle.sign("HMAC", 
      await crypto.subtle.importKey("raw", keyBuf, { name: "HMAC", hash: "SHA-512" }, false, ["sign"]),
      msgBuf
    );
    
    const hashArray = Array.from(new Uint8Array(hashBuf));
    const calculatedSignature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    
    if (calculatedSignature !== signature) {
      console.warn("Invalid webhook signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const event = JSON.parse(body);
    
    if (event.event !== "charge.success") {
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: corsHeaders }
      );
    }

    const data = event.data;
    const reference = data.reference;
    const metadata = data.metadata;
    
    if (!reference || !metadata) {
      return new Response(
        JSON.stringify({ error: "Missing reference or metadata" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if order already exists for this reference
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("*")
      .eq("paystack_reference", reference)
      .single();

    if (!existingOrder) {
      // Create order from webhook
      const { error: insertError } = await supabase.from("orders").insert({
        user_id: metadata.user_id,
        provider_name: metadata.provider_name,
        bundle_id: metadata.bundle_id,
        price: data.amount / 100,
        recipient_number: metadata.recipient_number,
        payment_network: "Paystack",
        status: "paid",
        paystack_reference: reference,
      });

      if (insertError) {
        console.error("Error creating order from webhook:", insertError);
        throw insertError;
      }
    } else {
      // Update existing order to ensure status is correct
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: "paid" })
        .eq("paystack_reference", reference);

      if (updateError) {
        console.error("Error updating order status:", updateError);
        throw updateError;
      }
    }

    return new Response(
      JSON.stringify({ success: true, reference }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
