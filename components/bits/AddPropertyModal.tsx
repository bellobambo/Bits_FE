"use client";

import { type FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { parseEther } from "viem";
import { type HouseInput, useUploadHouse } from "@/hooks/useContract";
import { getReadableErrorMessage } from "@/components/bits/utils";

type AddPropertyModalProps = {
  landlordName?: string;
  open: boolean;
  onClose: () => void;
};

type UploadedFile = {
  ipfsUrl: string;
  gatewayUrl: string;
  fileName: string;
  mimeType: string;
};

type PropertyReview = {
  autofill: {
    hostelName: string;
    hostelLocation: string;
    schoolName: string;
    roomCount: number;
  };
  verification: {
    detectedOwnerName: string;
    documentType: string;
    matchedSignals: string[];
    propertyEvidence: string[];
    status: "verified" | "needs_review" | "failed";
    confidence: number;
    reason: string;
  };
  valuation: {
    propertyValueMnt: string;
    propertyValueNgn: string;
    yearlyRentMnt: string;
    yearlyRentNgn: string;
    halfYearRentMnt: string;
    halfYearRentNgn: string;
    confidence: "low" | "medium" | "high";
    explanation: string;
  };
};

async function uploadPinataFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/pinata/upload", {
    method: "POST",
    body: formData,
  });
  const data = (await response.json()) as {
    error?: string;
    fileName?: string;
    gatewayUrl?: string;
    mimeType?: string;
    url?: string;
  };

  if (!response.ok || !data.url || !data.gatewayUrl) {
    throw new Error(data.error ?? "File upload failed.");
  }

  return {
    ipfsUrl: data.url,
    gatewayUrl: data.gatewayUrl,
    fileName: data.fileName ?? file.name,
    mimeType: data.mimeType ?? file.type,
  };
}

async function requestPropertyReview(input: {
  landlordName: string;
  hostelName: string;
  hostelLocation: string;
  schoolName: string;
  roomCount: string;
  proofOfOwnership: UploadedFile;
  photos: UploadedFile[];
}) {
  const response = await fetch("/api/ai/property-review", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as PropertyReview & { error?: string };

  if (!response.ok || data.error) {
    throw new Error(data.error ?? "AI property review failed.");
  }

  return data;
}

function formatMntValue(value: string) {
  const normalized = formatNumberValue(value.replace(/mnt/gi, "").trim());

  return `${normalized} MNT`;
}

function formatNumberValue(value: string) {
  const numericValue = Number(value.replace(/,/g, ""));

  if (!Number.isFinite(numericValue)) {
    return value;
  }

  return numericValue.toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });
}

function getBriefList(items?: string[]) {
  return Array.isArray(items) ? items.filter(Boolean).slice(0, 3) : [];
}

export function AddPropertyModal({
  landlordName = "",
  open,
  onClose,
}: AddPropertyModalProps) {
  const [hostelName, setHostelName] = useState("");
  const [hostelLocation, setHostelLocation] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [proofOfOwnership, setProofOfOwnership] = useState<UploadedFile | null>(
    null,
  );
  const [photos, setPhotos] = useState<UploadedFile[]>([]);
  const [review, setReview] = useState<PropertyReview | null>(null);
  const [roomCount, setRoomCount] = useState("");
  const [yearlyRent, setYearlyRent] = useState("");
  const [halfYearRent, setHalfYearRent] = useState("");
  const [propertyValue, setPropertyValue] = useState("");
  const [isReviewingProperty, setIsReviewingProperty] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const {
    isSuccess: isUploadHouseSuccess,
    isUploadHousePending,
    uploadHouseAsync,
  } = useUploadHouse();

  useEffect(() => {
    if (isUploadHouseSuccess) {
      toast.success("Property Added Successfully");
    }
  }, [isUploadHouseSuccess]);

  async function handleProofOfOwnershipChange(file?: File) {
    setProofOfOwnership(null);
    setReview(null);
    if (!file) {
      return;
    }

    try {
      setIsUploadingProof(true);
      const uploadedFile = await uploadPinataFile(file);
      console.log("Proof of ownership IPFS URL:", uploadedFile.ipfsUrl);
      setProofOfOwnership(uploadedFile);
      toast.success("Proof uploaded to IPFS");
    } catch (error) {
      toast.error(getReadableErrorMessage(error));
    } finally {
      setIsUploadingProof(false);
    }
  }

  async function handlePhotosChange(files: File[]) {
    setPhotos([]);
    setReview(null);
    if (files.length === 0) {
      return;
    }

    try {
      setIsUploadingPhotos(true);
      const uploadedFiles = await Promise.all(
        files.map((file) => uploadPinataFile(file)),
      );
      console.log(
        "Property photo IPFS URLs:",
        uploadedFiles.map((file) => file.ipfsUrl),
      );
      setPhotos(uploadedFiles);
      toast.success("Photos uploaded to IPFS");
    } catch (error) {
      toast.error(getReadableErrorMessage(error));
    } finally {
      setIsUploadingPhotos(false);
    }
  }

  async function handleRunAiReview() {
    if (!proofOfOwnership || photos.length === 0) {
      toast.error("Upload proof of ownership and at least one property photo.");
      return;
    }

    try {
      setIsReviewingProperty(true);
      const result = await requestPropertyReview({
        landlordName,
        hostelName,
        hostelLocation,
        schoolName,
        roomCount,
        proofOfOwnership,
        photos,
      });
      setReview(result);

      if (!hostelName && result.autofill.hostelName) {
        setHostelName(result.autofill.hostelName);
      }
      if (!hostelLocation && result.autofill.hostelLocation) {
        setHostelLocation(result.autofill.hostelLocation);
      }
      if (!schoolName && result.autofill.schoolName) {
        setSchoolName(result.autofill.schoolName);
      }
      if (!roomCount && result.autofill.roomCount > 0) {
        setRoomCount(String(result.autofill.roomCount));
      }

      toast.success("AI review complete");
    } catch (error) {
      toast.error(getReadableErrorMessage(error));
    } finally {
      setIsReviewingProperty(false);
    }
  }

  function applyValuationSuggestion() {
    if (!review) {
      return;
    }

    setPropertyValue(review.valuation.propertyValueMnt);
    setYearlyRent(review.valuation.yearlyRentMnt);
    setHalfYearRent(review.valuation.halfYearRentMnt);
  }

  const matchedSignals = getBriefList(review?.verification.matchedSignals);
  const propertyEvidence = getBriefList(review?.verification.propertyEvidence);

  async function handleAddProperty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isUploadingProof || isUploadingPhotos) {
      toast.error("Wait for the selected files to finish uploading.");
      return;
    }

    if (!proofOfOwnership || photos.length === 0) {
      toast.error("Upload proof of ownership and at least one property photo.");
      return;
    }

    if (!review) {
      toast.error("Run AI review before creating the property.");
      return;
    }

    if (review.verification.status !== "verified") {
      toast.error("AI verification must be verified before creating a property.");
      return;
    }

    try {
      const input: HouseInput = {
        hostelName: hostelName.trim(),
        hostelLocation: hostelLocation.trim(),
        schoolName: schoolName.trim(),
        proofOfOwnership: proofOfOwnership.ipfsUrl,
        photos: photos.map((photo) => photo.ipfsUrl),
        roomCount: BigInt(roomCount),
        yearlyRent: parseEther(yearlyRent),
        halfYearRent: parseEther(halfYearRent),
        propertyValue: parseEther(propertyValue),
      };

      await uploadHouseAsync(input);
      onClose();
    } catch (error) {
      toast.error(getReadableErrorMessage(error));
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/35 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="property-title"
    >
      <div className="my-auto flex max-h-[90vh] w-full max-w-[42rem] flex-col rounded-2xl bg-[#F1E2D1] p-4 text-[#810B38] shadow-2xl sm:p-6">
        <div className="mb-6 flex shrink-0 items-center justify-between gap-4 border-b border-[#810B38]/15 pb-4">
          <h2 id="property-title" className="text-xl font-bold">
            Add Property
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close add property modal"
            className="flex h-9 w-9 items-center justify-center rounded-md text-4xl font-medium leading-none text-[#810B38] transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#810B38]"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleAddProperty}
          className="bits-hidden-scroll min-h-0 flex-1 space-y-4 overflow-y-auto pr-2"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Hostel name</span>
              <input
                required
                value={hostelName}
                onChange={(event) => setHostelName(event.target.value)}
                className="h-11 w-full rounded-md border border-[#810B38]/35 bg-white/55 px-3 text-sm outline-none transition focus:border-[#810B38] focus:ring-2 focus:ring-[#810B38]/25"
                placeholder="Bits Lodge"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Location</span>
              <input
                required
                value={hostelLocation}
                onChange={(event) => setHostelLocation(event.target.value)}
                className="h-11 w-full rounded-md border border-[#810B38]/35 bg-white/55 px-3 text-sm outline-none transition focus:border-[#810B38] focus:ring-2 focus:ring-[#810B38]/25"
                placeholder="Ugbowo, Benin"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">School name</span>
            <input
              required
              value={schoolName}
              onChange={(event) => setSchoolName(event.target.value)}
              className="h-11 w-full rounded-md border border-[#810B38]/35 bg-white/55 px-3 text-sm outline-none transition focus:border-[#810B38] focus:ring-2 focus:ring-[#810B38]/25"
              placeholder="University of Benin"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">
              Proof of ownership
            </span>
            <input
              required
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,image/*,application/pdf"
              onChange={(event) => {
                void handleProofOfOwnershipChange(event.target.files?.[0]);
              }}
              className="w-full rounded-md border border-[#810B38]/35 bg-white/55 px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-[#810B38] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#F1E2D1] outline-none transition focus:border-[#810B38] focus:ring-2 focus:ring-[#810B38]/25"
            />
            {isUploadingProof || proofOfOwnership ? (
              <p className="mt-2 text-xs font-medium">
                {isUploadingProof
                  ? "Uploading proof to IPFS..."
                  : "Proof IPFS link ready"}
              </p>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Property photos</span>
            <input
              required
              multiple
              type="file"
              accept="image/*"
              onChange={(event) => {
                void handlePhotosChange(Array.from(event.target.files ?? []));
              }}
              className="w-full rounded-md border border-[#810B38]/35 bg-white/55 px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-[#810B38] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#F1E2D1] outline-none transition focus:border-[#810B38] focus:ring-2 focus:ring-[#810B38]/25"
            />
            {isUploadingPhotos || photos.length > 0 ? (
              <p className="mt-2 text-xs font-medium">
                {isUploadingPhotos
                  ? "Uploading photos to IPFS..."
                  : `${photos.length} photo IPFS link${photos.length === 1 ? "" : "s"} ready`}
              </p>
            ) : null}
          </label>

          <section className="rounded-lg border border-[#810B38]/20 bg-white/35 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold">AI Property Review</h3>
                <p className="mt-1 text-xs font-medium">
                  Autofills empty fields, verifies ownership, and suggests valuation.
                </p>
              </div>
              <button
                type="button"
                disabled={
                  isUploadingProof ||
                  isUploadingPhotos ||
                  isReviewingProperty ||
                  !proofOfOwnership ||
                  photos.length === 0
                }
                onClick={() => {
                  void handleRunAiReview();
                }}
                className="h-10 rounded-md bg-[#810B38] px-4 text-sm font-semibold text-[#F1E2D1] transition-colors hover:bg-[#6d092f] focus:outline-none focus:ring-2 focus:ring-[#810B38] focus:ring-offset-2 focus:ring-offset-[#F1E2D1] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isReviewingProperty ? "Reviewing..." : "Review"}
              </button>
            </div>

            {review ? (
              <div className="mt-4 space-y-4 text-sm">
                <div className="rounded-md border border-[#810B38]/15 bg-[#F1E2D1]/70 p-3">
                  <p className="font-bold">
                    Verification: {review.verification.status.replace("_", " ")}
                  </p>
                  <p className="mt-1">
                    Detected owner:{" "}
                    {review.verification.detectedOwnerName || "Not detected"}
                  </p>
                  <p className="mt-1">
                    Document type:{" "}
                    {review.verification.documentType || "Not detected"}
                  </p>
                  <p className="mt-1">{review.verification.reason}</p>
                  {matchedSignals.length > 0 ? (
                    <div className="mt-3">
                      <p className="font-semibold">Matched signals</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5">
                        {matchedSignals.map((signal) => (
                          <li key={signal}>{signal}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {propertyEvidence.length > 0 ? (
                    <div className="mt-3">
                      <p className="font-semibold">Property evidence checked</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5">
                        {propertyEvidence.map((evidence) => (
                          <li key={evidence}>{evidence}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-md border border-[#810B38]/15 bg-[#F1E2D1]/70 p-3">
                  <p className="font-bold">AI valuation suggestion</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <p>Value: {formatMntValue(review.valuation.propertyValueMnt)}</p>
                    <p>Yearly: {formatMntValue(review.valuation.yearlyRentMnt)}</p>
                    <p>
                      Half-year:{" "}
                      {formatMntValue(review.valuation.halfYearRentMnt)}
                    </p>
                  </div>
                  <p className="mt-2 text-xs font-semibold">
                    MNT estimate from NGN: property ₦
                    {formatNumberValue(review.valuation.propertyValueNgn || "0")},
                    yearly rent ₦
                    {formatNumberValue(review.valuation.yearlyRentNgn || "0")},
                    half-year rent ₦
                    {formatNumberValue(review.valuation.halfYearRentNgn || "0")}.
                  </p>
                  <p className="mt-2 text-xs font-medium">
                    {review.valuation.explanation}
                  </p>
                  <button
                    type="button"
                    onClick={applyValuationSuggestion}
                    className="mt-3 h-9 rounded-md border border-[#810B38]/35 px-3 text-xs font-bold transition-colors hover:bg-[#810B38] hover:text-[#F1E2D1] focus:outline-none focus:ring-2 focus:ring-[#810B38]"
                  >
                    Apply Suggestions
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Room count</span>
              <input
                required
                min="1"
                step="1"
                type="number"
                value={roomCount}
                onChange={(event) => setRoomCount(event.target.value)}
                className="h-11 w-full rounded-md border border-[#810B38]/35 bg-white/55 px-3 text-sm outline-none transition focus:border-[#810B38] focus:ring-2 focus:ring-[#810B38]/25"
                placeholder="24"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">
                Property value (MNT)
              </span>
              <input
                required
                min="0"
                step="0.000000000000000001"
                type="number"
                value={propertyValue}
                onChange={(event) => setPropertyValue(event.target.value)}
                className="h-11 w-full rounded-md border border-[#810B38]/35 bg-white/55 px-3 text-sm outline-none transition focus:border-[#810B38] focus:ring-2 focus:ring-[#810B38]/25"
                placeholder="1000"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">
                Yearly rent (MNT)
              </span>
              <input
                required
                min="0"
                step="0.000000000000000001"
                type="number"
                value={yearlyRent}
                onChange={(event) => setYearlyRent(event.target.value)}
                className="h-11 w-full rounded-md border border-[#810B38]/35 bg-white/55 px-3 text-sm outline-none transition focus:border-[#810B38] focus:ring-2 focus:ring-[#810B38]/25"
                placeholder="12"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">
                Half-year rent (MNT)
              </span>
              <input
                required
                min="0"
                step="0.000000000000000001"
                type="number"
                value={halfYearRent}
                onChange={(event) => setHalfYearRent(event.target.value)}
                className="h-11 w-full rounded-md border border-[#810B38]/35 bg-white/55 px-3 text-sm outline-none transition focus:border-[#810B38] focus:ring-2 focus:ring-[#810B38]/25"
                placeholder="6"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isUploadingProof || isUploadingPhotos || isUploadHousePending}
            className="h-11 w-full rounded-md bg-[#810B38] px-4 text-sm font-bold text-[#F1E2D1] transition-colors hover:bg-[#6d092f] focus:outline-none focus:ring-2 focus:ring-[#810B38] focus:ring-offset-2 focus:ring-offset-[#F1E2D1] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploadingProof || isUploadingPhotos
              ? "Uploading Files..."
              : "Create Property"}
          </button>
        </form>
      </div>
    </div>
  );
}
