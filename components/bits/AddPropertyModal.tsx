"use client";

import { type FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { parseEther } from "viem";
import { type HouseInput, useUploadHouse } from "@/hooks/useContract";
import { getReadableErrorMessage } from "@/components/bits/utils";

type AddPropertyModalProps = {
  open: boolean;
  onClose: () => void;
};

async function uploadPinataFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/pinata/upload", {
    method: "POST",
    body: formData,
  });
  const data = (await response.json()) as { error?: string; url?: string };

  if (!response.ok || !data.url) {
    throw new Error(data.error ?? "File upload failed.");
  }

  return data.url;
}

export function AddPropertyModal({ open, onClose }: AddPropertyModalProps) {
  const [hostelName, setHostelName] = useState("");
  const [hostelLocation, setHostelLocation] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [proofOfOwnership, setProofOfOwnership] = useState<File | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [roomCount, setRoomCount] = useState("");
  const [yearlyRent, setYearlyRent] = useState("");
  const [halfYearRent, setHalfYearRent] = useState("");
  const [propertyValue, setPropertyValue] = useState("");
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
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

  async function handleAddProperty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!proofOfOwnership || photos.length === 0) {
      toast.error("Select proof of ownership and at least one property photo.");
      return;
    }

    try {
      setIsUploadingFiles(true);
      const [proofOfOwnershipUrl, photoUrls] = await Promise.all([
        uploadPinataFile(proofOfOwnership),
        Promise.all(photos.map((photo) => uploadPinataFile(photo))),
      ]);

      const input: HouseInput = {
        hostelName: hostelName.trim(),
        hostelLocation: hostelLocation.trim(),
        schoolName: schoolName.trim(),
        proofOfOwnership: proofOfOwnershipUrl,
        photos: photoUrls,
        roomCount: BigInt(roomCount),
        yearlyRent: parseEther(yearlyRent),
        halfYearRent: parseEther(halfYearRent),
        propertyValue: parseEther(propertyValue),
      };

      await uploadHouseAsync(input);
      onClose();
    } catch (error) {
      toast.error(getReadableErrorMessage(error));
    } finally {
      setIsUploadingFiles(false);
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
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[#F1E2D1] p-6 text-[#810B38] shadow-2xl">
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-[#810B38]/15 pb-4">
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

        <form onSubmit={handleAddProperty} className="space-y-4">
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
              onChange={(event) =>
                setProofOfOwnership(event.target.files?.[0] ?? null)
              }
              className="w-full rounded-md border border-[#810B38]/35 bg-white/55 px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-[#810B38] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#F1E2D1] outline-none transition focus:border-[#810B38] focus:ring-2 focus:ring-[#810B38]/25"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Property photos</span>
            <input
              required
              multiple
              type="file"
              accept="image/*"
              onChange={(event) => setPhotos(Array.from(event.target.files ?? []))}
              className="w-full rounded-md border border-[#810B38]/35 bg-white/55 px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-[#810B38] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#F1E2D1] outline-none transition focus:border-[#810B38] focus:ring-2 focus:ring-[#810B38]/25"
            />
          </label>

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
            disabled={isUploadingFiles || isUploadHousePending}
            className="h-11 w-full rounded-md bg-[#810B38] px-4 text-sm font-bold text-[#F1E2D1] transition-colors hover:bg-[#6d092f] focus:outline-none focus:ring-2 focus:ring-[#810B38] focus:ring-offset-2 focus:ring-offset-[#F1E2D1] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploadingFiles ? "Uploading Files..." : "Create Property"}
          </button>
        </form>
      </div>
    </div>
  );
}
