import { NextResponse } from "next/server";

function normalizeSymbol(value: string | null) {
  return (value || "MNTUSDT").trim().toUpperCase();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = normalizeSymbol(searchParams.get("symbol"));
  const amount = Number(searchParams.get("amount") || "1");

  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`,
      { next: { revalidate: 60 } },
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Upstream request failed" }, { status: 502 });
    }

    const data = (await response.json()) as {
      result?: { list?: Array<{ lastPrice?: string }> };
    };
    const price = Number(data.result?.list?.[0]?.lastPrice);

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Price unavailable" }, { status: 502 });
    }

    return NextResponse.json({
      amount,
      converted: amount * price,
      price,
      source: "bybit",
      symbol,
    });
  } catch {
    return NextResponse.json({ error: "Failed to convert price" }, { status: 502 });
  }
}
