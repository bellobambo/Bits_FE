import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://api.bybit.com/v5/market/tickers?category=spot&symbol=MNTUSDT",
      { next: { revalidate: 60 } },
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Upstream request failed" }, { status: 502 });
    }

    const data = (await response.json()) as {
      result?: { list?: Array<{ lastPrice?: string }> };
    };
    const lastPrice = Number(data.result?.list?.[0]?.lastPrice);

    if (!Number.isFinite(lastPrice) || lastPrice <= 0) {
      return NextResponse.json({ error: "Price unavailable" }, { status: 502 });
    }

    return NextResponse.json({ price: lastPrice });
  } catch {
    return NextResponse.json({ error: "Failed to fetch price" }, { status: 502 });
  }
}
