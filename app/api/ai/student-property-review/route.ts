import { NextResponse } from "next/server";

type StudentPropertyReviewPayload = {
  availableRooms?: string;
  halfYearRentMnt?: string;
  hostelLocation?: string;
  hostelName?: string;
  propertySchoolName?: string;
  roomCount?: string;
  studentMatricNumber?: string;
  studentSchoolName?: string;
  yearlyRentMnt?: string;
};

const reviewSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    rating: {
      type: "string",
      enum: ["good_fit", "fair_fit", "needs_review"],
    },
    summary: {
      type: "string",
    },
    fitChecks: {
      type: "array",
      maxItems: 3,
      items: { type: "string" },
    },
    concerns: {
      type: "array",
      maxItems: 3,
      items: { type: "string" },
    },
    suggestedTerm: {
      type: "string",
      enum: ["yearly", "half-year"],
    },
  },
  required: ["rating", "summary", "fitChecks", "concerns", "suggestedTerm"],
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
    const payload = (await request.json()) as StudentPropertyReviewPayload;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_STUDENT_REVIEW_MODEL ?? "gpt-4.1-mini",
        input: [
          {
            role: "developer",
            content: [
              {
                type: "input_text",
                text: [
                  "You review student housing listings for a student before they rent.",
                  "Use only the provided property and student profile data.",
                  "Keep the review brief, practical, and focused on school fit, affordability, room availability, and rental term choice.",
                  "Do not claim the property is legally verified. Do not promise safety or quality.",
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
            name: "student_property_review",
            strict: true,
            schema: reviewSchema,
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? "AI student review failed." },
        { status: response.status },
      );
    }

    const outputText = data?.output?.[0]?.content?.find(
      (item: { type?: string }) => item.type === "output_text",
    )?.text;

    if (!outputText) {
      return NextResponse.json(
        { error: "AI student review returned no result." },
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
            : "Failed to review property for student.",
      },
      { status: 500 },
    );
  }
}
