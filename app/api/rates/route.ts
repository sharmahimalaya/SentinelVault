/**
 * Server-side API route for fetching live exchange rates
 * Avoids client-side CORS issues and rate limiting
 */

export const runtime = "nodejs";

const COINGECKO_API = "https://api.coingecko.com/api/v3";

export async function GET(request: Request) {
  try {
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&x_cg_pro_api_key=${process.env.COINGECKO_API_KEY || ""}`,
      {
        headers: {
          "Accept-Encoding": "gzip",
          "User-Agent": "SentinelVault/1.0",
        },
        method: "GET",
        cache: "no-store", // Always fetch fresh data
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    const rates = {
      ethereum: data.ethereum?.usd ?? 3500,
      bitcoin: data.bitcoin?.usd ?? 67000,
      solana: data.solana?.usd ?? 180,
    };

    console.log("Fetched rates:", rates);

    return Response.json(rates, {
      headers: {
        "Cache-Control": "public, max-age=10, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Failed to fetch exchange rates:", error);

    // Return fallback rates
    return Response.json(
      {
        ethereum: 3500,
        bitcoin: 67000,
        solana: 180,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10",
        },
      }
    );
  }
}
