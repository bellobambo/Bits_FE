import { NextResponse } from "next/server";

type InvestmentReviewPayload = {
  hostelName?: string;
  hostelLocation?: string;
  schoolName?: string;
  roomCount?: string;
  availableRooms?: string;
  propertyValueMnt?: string;
  yearlyRentMnt?: string;
  halfYearRentMnt?: string;
  totalInvestedMnt?: string;
  remainingFundingMnt?: string;
  minInvestmentMnt?: string;
  maxInvestmentMnt?: string;
};

const reviewSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    rating: {
      type: "string",
      enum: ["strong", "moderate", "cautious"],
    },
    summary: {
      type: "string",
    },
    positives: {
      type: "array",
      maxItems: 3,
      items: { type: "string" },
    },
    risks: {
      type: "array",
      maxItems: 3,
      items: { type: "string" },
    },
    suggestedInvestmentMnt: {
      type: "string",
    },
  },
  required: ["rating", "summary", "positives", "risks", "suggestedInvestmentMnt"],
} as const;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 },
    );
  }

  try {
    const payload = (await request.json()) as InvestmentReviewPayload;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_INVESTMENT_REVIEW_MODEL ?? "gpt-4.1-mini",
        input: [
          {
            role: "developer",
            content: [
              {
                type: "input_text",
                text: [
                  "You are an investment assistant for a student housing dapp on Mantle testnet.",
                  "Review the property for an investor using only the provided data.",
                  "Keep the output brief and practical. Do not promise returns.",
                  "Mention affordability, occupancy potential, remaining funding, and concentration risk where relevant.",
                  "suggestedInvestmentMnt must be a plain numeric string inside the min/max investment range.",
                ].join(" "),
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify(payload),
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "investment_review",
            strict: true,
            schema: reviewSchema,
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? "AI investment review failed." },
        { status: response.status },
      );
    }

    const outputText = data?.output?.[0]?.content?.find(
      (item: { type?: string }) => item.type === "output_text",
    )?.text;

    if (!outputText) {
      return NextResponse.json(
        { error: "AI investment review returned no result." },
        { status: 502 },
      );
    }

    return NextResponse.json(JSON.parse(outputText));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to review property investment.",
      },
      { status: 500 },
    );
  }
}
