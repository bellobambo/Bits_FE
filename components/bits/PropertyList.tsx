"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { type Address } from "viem";
import { useGetAllHouses, useGetHousePhotos, useUser } from "@/hooks/useContract";
import {
  formatAddress,
  formatTokenAmount,
  getRegisteredUser,
  ipfsToGatewayUrl,
  tokenAmountToNumber,
} from "@/components/bits/utils";

type RawHouse = readonly [
  bigint,
  Address,
  string,
  string,
  string,
  string,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  boolean,
  boolean,
];

type House = {
  active: boolean;
  availableRooms: bigint;
  fundingClosed: boolean;
  halfYearRent: bigint;
  hostelLocation: string;
  hostelName: string;
  id: bigint;
  landlord: Address;
  proofOfOwnership: string;
  propertyValue: bigint;
  roomCount: bigint;
  schoolName: string;
  totalInvested: bigint;
  yearlyRent: bigint;
};

type RawHouseObject = Partial<House> & {
  landlord?: Address;
};

function toBigInt(value: unknown) {
  if (typeof value === "bigint") {
    return value;
  }

  if (typeof value === "number" || typeof value === "string") {
    return BigInt(value || 0);
  }

  return BigInt(0);
}

function toStringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toAddress(value: unknown) {
  return (typeof value === "string" ? value : "0x0000000000000000000000000000000000000000") as Address;
}

function normalizeHouse(rawHouse: RawHouse | RawHouseObject): House {
  if (!Array.isArray(rawHouse)) {
    const house = rawHouse as RawHouseObject;

    return {
      id: toBigInt(house.id),
      landlord: toAddress(house.landlord),
      hostelName: toStringValue(house.hostelName),
      hostelLocation: toStringValue(house.hostelLocation),
      schoolName: toStringValue(house.schoolName),
      proofOfOwnership: toStringValue(house.proofOfOwnership),
      roomCount: toBigInt(house.roomCount),
      availableRooms: toBigInt(house.availableRooms),
      yearlyRent: toBigInt(house.yearlyRent),
      halfYearRent: toBigInt(house.halfYearRent),
      propertyValue: toBigInt(house.propertyValue),
      totalInvested: toBigInt(house.totalInvested),
      fundingClosed: Boolean(house.fundingClosed),
      active: Boolean(house.active),
    };
  }

  return {
    id: toBigInt(rawHouse[0]),
    landlord: toAddress(rawHouse[1]),
    hostelName: toStringValue(rawHouse[2]),
    hostelLocation: toStringValue(rawHouse[3]),
    schoolName: toStringValue(rawHouse[4]),
    proofOfOwnership: toStringValue(rawHouse[5]),
    roomCount: toBigInt(rawHouse[6]),
    availableRooms: toBigInt(rawHouse[7]),
    yearlyRent: toBigInt(rawHouse[8]),
    halfYearRent: toBigInt(rawHouse[9]),
    propertyValue: toBigInt(rawHouse[10]),
    totalInvested: toBigInt(rawHouse[11]),
    fundingClosed: rawHouse[12],
    active: rawHouse[13],
  };
}

function LandlordName({ address }: { address: Address }) {
  const { data } = useUser(address);
  const user = getRegisteredUser(data);

  return <>{user?.registered && user.name ? user.name : "Unknown owner"}</>;
}

function PropertyDrawer({
  house,
  onClose,
}: {
  house: House;
  onClose: () => void;
}) {
  const { data: photoData } = useGetHousePhotos(house.id);
  const photos = Array.isArray(photoData) ? photoData : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-neutral-900/35">
      <aside className="bits-hidden-scroll h-full w-full max-w-6xl overflow-y-auto bg-[#F1E2D1] p-6 text-[#810B38] shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-[#810B38]/15 pb-4">
          <div>
            <h2 className="text-xl font-bold">{house.hostelName}</h2>
            <p className="mt-1 text-sm font-semibold">{house.hostelLocation}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close property details"
            className="flex h-9 w-9 items-center justify-center rounded-md text-4xl font-medium leading-none transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#810B38]"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <section className="rounded-lg border border-[#810B38]/15 bg-white/35 p-4">
            <p className="font-bold">Owner</p>
            <p className="mt-2">
              <LandlordName address={house.landlord} />
            </p>
            <p className="mt-1 break-all font-medium">{house.landlord}</p>
          </section>

          <section className="grid gap-3 rounded-lg border border-[#810B38]/15 bg-white/35 p-4 sm:grid-cols-2">
            <p>
              <span className="font-bold">School:</span> {house.schoolName}
            </p>
            <p>
              <span className="font-bold">Rooms:</span>{" "}
              {house.roomCount.toString()}
            </p>
            <p>
              <span className="font-bold">Available:</span>{" "}
              {house.availableRooms.toString()}
            </p>
            <p>
              <span className="font-bold">Active:</span>{" "}
              {house.active ? "Yes" : "No"}
            </p>
          </section>

          <section className="rounded-lg border border-[#810B38]/15 bg-white/35 p-4">
            <p className="font-bold">Pricing</p>
            <div className="mt-3 space-y-2">
              <p>Property value: {formatTokenAmount(house.propertyValue)}</p>
              <p>Yearly rent: {formatTokenAmount(house.yearlyRent)}</p>
              <p>Half-year rent: {formatTokenAmount(house.halfYearRent)}</p>
              <p>Total invested: {formatTokenAmount(house.totalInvested)}</p>
            </div>
          </section>



          {photos.length > 0 ? (
            <section className="rounded-lg border border-[#810B38]/15 bg-white/35 p-4">
              <p className="font-bold">Photos</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {photos.map((photo, index) => (
                  <a
                    href={ipfsToGatewayUrl(String(photo))}
                    key={String(photo)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Image
                      alt={house.hostelName}
                      className="aspect-square w-full rounded-md object-cover"
                      height={480}
                      priority={index < 2}
                      quality={95}
                      src={ipfsToGatewayUrl(String(photo))}
                      sizes="(max-width: 640px) 45vw, 180px"
                      width={480}
                    />
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function PropertyCard({
  house,
  mntUsdPrice,
  onViewMore,
}: {
  house: House;
  mntUsdPrice: number | null;
  onViewMore: () => void;
}) {
  const usdyValue =
    mntUsdPrice === null ? null : tokenAmountToNumber(house.propertyValue) * mntUsdPrice;

  return (
    <article className="flex min-h-80 flex-col rounded-lg border border-[#810B38]/20 bg-white/35 p-5 shadow-sm">
      <div className="flex flex-1 flex-col gap-5">
        <div>
          <h3 className="truncate text-lg font-bold">{house.hostelName}</h3>
          <p className="mt-1 line-clamp-2 min-h-10 text-sm font-medium">
            {house.hostelLocation}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="min-w-0 truncate">
            <span className="font-bold">Owner:</span>{" "}
            <LandlordName address={house.landlord} />
          </p>
          <p className="shrink-0 text-xs font-medium">
            {formatAddress(house.landlord)}
          </p>
        </div>

        <div className="mt-1 flex items-center justify-between gap-3 border-t border-[#810B38]/15 pt-4">
          <p className="text-sm font-bold">{formatTokenAmount(house.propertyValue)}</p>
          <p className="text-xs font-semibold">
            {usdyValue === null
              ? "Loading USDY..."
              : `~${usdyValue.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })} USDY`}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onViewMore}
        className="mt-2 h-10 w-full rounded-md bg-[#810B38] px-4 text-sm font-semibold text-[#F1E2D1] transition-colors hover:bg-[#6d092f] focus:outline-none focus:ring-2 focus:ring-[#810B38] focus:ring-offset-2 focus:ring-offset-[#F1E2D1]"
      >
        View More
      </button>
    </article>
  );
}

export function PropertyList() {
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [mntUsdPrice, setMntUsdPrice] = useState<number | null>(null);
  const { data, isLoading } = useGetAllHouses();
  const houses = useMemo(() => {
    if (!Array.isArray(data)) {
      return [];
    }

    return (data as Array<RawHouse | RawHouseObject>)
      .map(normalizeHouse)
      .filter((house) => house.id >= BigInt(0));
  }, [data]);

  useEffect(() => {
    let isMounted = true;

    async function fetchMntUsdPrice() {
      try {
        const response = await fetch(
          "https://api.bybit.com/v5/market/tickers?category=spot&symbol=MNTUSDT",
        );
        const data = (await response.json()) as {
          result?: {
            list?: Array<{
              lastPrice?: string;
            }>;
          };
        };
        const lastPrice = Number(data.result?.list?.[0]?.lastPrice);

        if (isMounted && Number.isFinite(lastPrice) && lastPrice > 0) {
          setMntUsdPrice(lastPrice);
        }
      } catch {
        if (isMounted) {
          setMntUsdPrice(null);
        }
      }
    }

    void fetchMntUsdPrice();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="mt-10 w-full">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold">Properties</h2>
        <span className="text-sm font-semibold">{houses.length} listed</span>
      </div>

      {isLoading ? (
        <p className="text-sm font-medium">Loading properties...</p>
      ) : houses.length === 0 ? (
        <p className="text-sm font-medium">No properties listed yet.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {houses.map((house) => (
            <PropertyCard
              house={house}
              key={house.id.toString()}
              mntUsdPrice={mntUsdPrice}
              onViewMore={() => setSelectedHouse(house)}
            />
          ))}
        </div>
      )}

      {selectedHouse ? (
        <PropertyDrawer
          house={selectedHouse}
          onClose={() => setSelectedHouse(null)}
        />
      ) : null}
    </section>
  );
}
