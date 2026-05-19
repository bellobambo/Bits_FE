type PropertyReviewRequest = {
  landlordName: string;
  hostelName: string;
  hostelLocation: string;
  schoolName: string;
  roomCount: string;
  proofOfOwnership: {
    gatewayUrl: string;
    fileName: string;
    mimeType: string;
  };
  photos: Array<{
    gatewayUrl: string;
    fileName: string;
    mimeType: string;
  }>;
};

const PROPERTY_VALUE_NGN_CAP = 950_000_000;

const propertyReviewSchema = {
  type: "object",
  additionalProperties: false,
  required: ["autofill", "verification", "valuation"],
  properties: {
    autofill: {
      type: "object",
      additionalProperties: false,
      required: ["hostelName", "hostelLocation", "schoolName", "roomCount"],
      properties: {
        hostelName: { type: "string" },
        hostelLocation: { type: "string" },
        schoolName: { type: "string" },
        roomCount: { type: "integer" },
      },
    },
    verification: {
      type: "object",
      additionalProperties: false,
      required: [
        "detectedOwnerName",
        "documentType",
        "matchedSignals",
        "propertyEvidence",
        "status",
        "confidence",
        "reason",
      ],
      properties: {
        detectedOwnerName: { type: "string" },
        documentType: { type: "string" },
        matchedSignals: {
          type: "array",
          items: { type: "string" },
        },
        propertyEvidence: {
          type: "array",
          items: { type: "string" },
        },
        status: {
          type: "string",
          enum: ["verified", "needs_review", "failed"],
        },
        confidence: { type: "number" },
        reason: { type: "string" },
      },
    },
    valuation: {
      type: "object",
      additionalProperties: false,
      required: [
        "propertyValueMnt",
        "propertyValueNgn",
        "yearlyRentMnt",
        "yearlyRentNgn",
        "halfYearRentMnt",
        "halfYearRentNgn",
        "confidence",
        "explanation",
      ],
      properties: {
        propertyValueMnt: { type: "string" },
        propertyValueNgn: { type: "string" },
        yearlyRentMnt: { type: "string" },
        yearlyRentNgn: { type: "string" },
        halfYearRentMnt: { type: "string" },
        halfYearRentNgn: { type: "string" },
        confidence: {
          type: "string",
          enum: ["low", "medium", "high"],
        },
        explanation: { type: "string" },
      },
    },
  },
} as const;

async function fetchMntToNgnRate() {
  const directResponse = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=mantle&vs_currencies=ngn,usd",
    {
      next: { revalidate: 300 },
    },
  );

  if (directResponse.ok) {
    const data = (await directResponse.json()) as {
      mantle?: {
        ngn?: number;
        usd?: number;
      };
    };

    if (data.mantle?.ngn && data.mantle.ngn > 0) {
      return {
        mntToNgnRate: data.mantle.ngn,
        source: "coingecko_direct_ngn",
      };
    }

    if (data.mantle?.usd && data.mantle.usd > 0) {
      const usdToNgn = await fetchUsdToNgnRate();

      if (usdToNgn) {
        return {
          mntToNgnRate: data.mantle.usd * usdToNgn,
          source: "coingecko_usd_to_ngn",
        };
      }
    }
  }

  return {
    mntToNgnRate: 1500,
    source: "fallback_default",
  };
}

async function fetchUsdToNgnRate() {
  const response = await fetch("https://open.er-api.com/v6/latest/USD", {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    rates?: {
      NGN?: number;
    };
  };

  return data.rates?.NGN && data.rates.NGN > 0 ? data.rates.NGN : null;
}

async function fetchFileAsDataUrl(file: {
  gatewayUrl: string;
  mimeType: string;
}) {
  const response = await fetch(file.gatewayUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch uploaded file: ${file.gatewayUrl}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return `data:${file.mimeType || "application/octet-stream"};base64,${base64}`;
}

async function buildFileInput(file: PropertyReviewRequest["proofOfOwnership"]) {
  const dataUrl = await fetchFileAsDataUrl(file);

  if (file.mimeType.startsWith("image/")) {
    return {
      type: "input_image",
      image_url: dataUrl,
      detail: "high",
    };
  }

  return {
    type: "input_file",
    file_data: dataUrl,
    filename: file.fileName || "proof-of-ownership",
  };
}

function extractOutputText(data: unknown) {
  if (
    data &&
    typeof data === "object" &&
    "output_text" in data &&
    typeof data.output_text === "string"
  ) {
    return data.output_text;
  }

  if (!data || typeof data !== "object" || !("output" in data)) {
    return "";
  }

  const output = data.output;
  if (!Array.isArray(output)) {
    return "";
  }

  return output
    .flatMap((item) => {
      if (!item || typeof item !== "object" || !("content" in item)) {
        return [];
      }

      return Array.isArray(item.content) ? item.content : [];
    })
    .map((content) => {
      if (
        content &&
        typeof content === "object" &&
        "text" in content &&
        typeof content.text === "string"
      ) {
        return content.text;
      }

      return "";
    })
    .join("");
}

function normalizeMntValue(value: unknown) {
  const text = String(value ?? "");
  const match = text.replace(/,/g, "").match(/\d+(?:\.\d+)?/);

  return match?.[0] ?? "";
}

function toPositiveNumber(value: unknown) {
  const parsed = Number(normalizeMntValue(value));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function toPlainMoneyValue(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }

  return String(Math.round(value * 100) / 100);
}

function getRoomCount(payload: PropertyReviewRequest, review: {
  autofill?: { roomCount?: number };
}) {
  const formRoomCount = Number(payload.roomCount);

  if (Number.isFinite(formRoomCount) && formRoomCount > 0) {
    return formRoomCount;
  }

  const autofillRoomCount = Number(review.autofill?.roomCount);

  return Number.isFinite(autofillRoomCount) && autofillRoomCount > 0
    ? autofillRoomCount
    : 1;
}

export async function POST(request: Request) {
  const openAiApiKey = process.env.OPENAI_API_KEY;

  if (!openAiApiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const payload = (await request.json()) as PropertyReviewRequest;

  if (!payload.proofOfOwnership?.gatewayUrl || payload.photos.length === 0) {
    return Response.json(
      { error: "Proof of ownership and property photos are required." },
      { status: 400 },
    );
  }

  const { mntToNgnRate, source: mntToNgnRateSource } =
    await fetchMntToNgnRate();

  let proofOfOwnershipInput;
  let photoInputs;

  try {
    proofOfOwnershipInput = await buildFileInput(payload.proofOfOwnership);
    photoInputs = await Promise.all(
      payload.photos.map(async (photo) => ({
        type: "input_image",
        image_url: await fetchFileAsDataUrl(photo),
        detail: "high",
      })),
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to prepare uploaded files for AI review.",
      },
      { status: 502 },
    );
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_PROPERTY_REVIEW_MODEL ?? "gpt-4.1-mini",
      input: [
        {
          role: "developer",
          content: [
            {
              type: "input_text",
              text: [
                "You review Nigerian student hostel property uploads before blockchain submission.",
                "Extract only what is visible or reasonably inferable from the document/photos.",
                "Autofill empty property fields where possible.",
                "Verify whether the proof document owner appears to match the registered landlord name.",
                "Verification must consider multiple signals, not only name. Include document type, owner name, property address/location, school or campus proximity, dates/signatures/reference numbers if visible, and whether photos appear consistent with the property description.",
                "Keep verification reason to one short sentence. Return at most 3 matchedSignals and at most 3 propertyEvidence items. Each item must be short.",
                "Treat title differences like Mr/Mrs/Dr as weak evidence only; surname-only matches should be needs_review, not verified.",
                "Set verification status to verified only when owner/name evidence plus at least one property/document evidence signal supports the upload. If only the name matches, use needs_review.",
                "Give MNT valuation suggestions as estimates, not guarantees.",
                "If the proof document contains a property value in Nigerian naira, extract it into propertyValueNgn. Example: 20,000,000 naira should become \"20000000\".",
                "If the proof document does not contain a property value, suggest propertyValueNgn from location, room count, visible property quality, and student hostel use case.",
                "Keep propertyValueNgn below 1000000000. Do not return exactly 1000000000.",
                "Convert naira values into MNT using the provided mntToNgnRate. If no rate is provided, assume 1 MNT = 1500 NGN.",
                "Return all money fields as plain numeric strings only, for example \"1000\" or \"12.5\". Do not include words like Approximately, commas, currency symbols, NGN, naira, or MNT in the values.",
                "Keep yearlyRentNgn affordable for students. Suggest yearly rent between 300000 and 600000 NGN, where near-campus or higher-quality properties may approach 600000 NGN.",
                "Set halfYearRentNgn to about half of yearlyRentNgn.",
                "Convert yearlyRentNgn and halfYearRentNgn into MNT with the same mntToNgnRate.",
                "Do not produce outrageous rent values. If evidence is weak, use conservative student-affordable rent.",
                "If the available evidence is weak, use conservative estimates and set confidence to low.",
                "Keep explanation brief, user-facing, and no more than two sentences.",
              ].join(" "),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                registeredLandlordName: payload.landlordName,
                currentFormValues: {
                  hostelName: payload.hostelName,
                  hostelLocation: payload.hostelLocation,
                  schoolName: payload.schoolName,
                  roomCount: payload.roomCount,
                },
                mntToNgnRate: String(mntToNgnRate),
                mntToNgnRateSource,
                valuationCurrency: "MNT",
                valueFormat:
                  "Plain decimal strings only. No commas, no words, no NGN or MNT suffix.",
              }),
            },
            proofOfOwnershipInput,
            ...photoInputs,
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "property_review",
          strict: true,
          schema: propertyReviewSchema,
        },
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return Response.json(
      {
        error:
          data?.error?.message ??
          data?.error ??
          "AI property review failed.",
      },
      { status: response.status },
    );
  }

  const outputText = extractOutputText(data);

  if (!outputText) {
    return Response.json(
      { error: "AI property review returned no output." },
      { status: 502 },
    );
  }

  const review = JSON.parse(outputText);
  review.valuation.propertyValueMnt = normalizeMntValue(
    review.valuation.propertyValueMnt,
  );
  review.valuation.propertyValueNgn = normalizeMntValue(
    review.valuation.propertyValueNgn,
  );
  review.valuation.yearlyRentMnt = normalizeMntValue(
    review.valuation.yearlyRentMnt,
  );
  review.valuation.yearlyRentNgn = normalizeMntValue(
    review.valuation.yearlyRentNgn,
  );
  review.valuation.halfYearRentMnt = normalizeMntValue(
    review.valuation.halfYearRentMnt,
  );
  review.valuation.halfYearRentNgn = normalizeMntValue(
    review.valuation.halfYearRentNgn,
  );

  const yearlyRentNgn = toPositiveNumber(review.valuation.yearlyRentNgn);
  let halfYearRentNgn = toPositiveNumber(review.valuation.halfYearRentNgn);
  let propertyValueNgn = toPositiveNumber(review.valuation.propertyValueNgn);
  const propertyValueMntFromAi = toPositiveNumber(review.valuation.propertyValueMnt);

  // If NGN property value is missing, back-derive from AI's MNT value
  if (propertyValueNgn === 0 && propertyValueMntFromAi > 0) {
    propertyValueNgn = propertyValueMntFromAi * mntToNgnRate;
  }

  // If still no property value, estimate from rent × rooms × multiplier
  if (propertyValueNgn === 0 && yearlyRentNgn > 0) {
    const roomCount = getRoomCount(payload, review);

    propertyValueNgn = yearlyRentNgn * roomCount * 4;
    review.valuation.explanation = `${review.valuation.explanation} Property value was estimated from annual rent, room count, and a conservative student-hostel income multiple.`;
  }

  // Cap property NGN value
  if (propertyValueNgn > PROPERTY_VALUE_NGN_CAP) {
    propertyValueNgn = PROPERTY_VALUE_NGN_CAP;
    review.valuation.explanation = `${review.valuation.explanation} Property value was capped below ₦1,000,000,000 to keep the on-chain estimate conservative.`;
  }

  // Fill in half-year NGN rent if missing
  if (halfYearRentNgn === 0 && yearlyRentNgn > 0) {
    halfYearRentNgn = yearlyRentNgn / 2;
  }

  // Always recompute all MNT values from their NGN counterparts using the
  // fetched exchange rate. The AI computes NGN and MNT independently which
  // produces inconsistent pairs; recomputing here keeps them in sync.
  const propertyValueMnt = propertyValueNgn > 0 ? propertyValueNgn / mntToNgnRate : 0;
  const yearlyRentMnt = yearlyRentNgn > 0 ? yearlyRentNgn / mntToNgnRate : 0;
  const halfYearRentMnt = halfYearRentNgn > 0 ? halfYearRentNgn / mntToNgnRate : 0;

  review.valuation.propertyValueNgn = toPlainMoneyValue(propertyValueNgn);
  review.valuation.propertyValueMnt = toPlainMoneyValue(propertyValueMnt);
  review.valuation.yearlyRentNgn = toPlainMoneyValue(yearlyRentNgn);
  review.valuation.yearlyRentMnt = toPlainMoneyValue(yearlyRentMnt);
  review.valuation.halfYearRentNgn = toPlainMoneyValue(halfYearRentNgn);
  review.valuation.halfYearRentMnt = toPlainMoneyValue(halfYearRentMnt);

  return Response.json(review);
}
