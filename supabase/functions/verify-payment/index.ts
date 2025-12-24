
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

  try {
    const { reference } = await req.json();

    if (!reference) {
      return new Response(
        JSON.stringify({ error: "Missing payment reference" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
        },
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data.status !== "success") {
      return new Response(
        JSON.stringify({ verified: false, error: "Payment not successful" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const metadata = paystackData.data.metadata;

    // Check if order already exists (webhook may have created it)
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("*")
      .eq("paystack_reference", reference)
      .single();

    if (!existingOrder) {
      // Create order if webhook hasn't already
      const { error: insertError } = await supabase.from("orders").insert({
        user_id: metadata.user_id,
        provider_name: metadata.provider_name,
        bundle_id: metadata.bundle_id,
        price: paystackData.data.amount / 100,
        recipient_number: metadata.recipient_number,
        payment_network: "Paystack",
        status: "paid",
        paystack_reference: reference,
      });

      if (insertError) {
        console.error("Error creating order:", insertError);
        // Don't throw - webhook may create it, so return verified anyway
      }
    }

    return new Response(
      JSON.stringify({ verified: true, reference }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("Payment verification error:", err);
    return new Response(
      JSON.stringify({ verified: false, error: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
