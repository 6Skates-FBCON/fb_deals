import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.text();
    let query: string;
    let variables: Record<string, unknown> = {};

    try {
      const parsed = JSON.parse(body);
      query = parsed.query;
      variables = parsed.variables || {};
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!query || typeof query !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'query' field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const storeUrl = Deno.env.get("EXPO_PUBLIC_SHOPIFY_STORE_URL");
    const storefrontToken = Deno.env.get("EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN");

    if (!storeUrl || !storefrontToken) {
      return new Response(
        JSON.stringify({
          error: "Shopify credentials not configured",
          details: { hasStoreUrl: !!storeUrl, hasToken: !!storefrontToken },
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const shopifyUrl = `https://${storeUrl}/api/2024-10/graphql.json`;

    const shopifyResponse = await fetch(shopifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    const responseText = await shopifyResponse.text();

    if (!shopifyResponse.ok) {
      return new Response(
        JSON.stringify({
          error: `Shopify API returned ${shopifyResponse.status}`,
          details: responseText.substring(0, 500),
        }),
        { status: shopifyResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return new Response(
        JSON.stringify({
          error: "Shopify returned non-JSON response",
          details: responseText.substring(0, 500),
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
