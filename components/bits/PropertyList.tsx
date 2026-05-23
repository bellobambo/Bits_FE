"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { keccak256, parseEther, stringToHex, type Address } from "viem";
import { usePublicClient } from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/lib/contract";
import {
  useGetAIReviews,
  useGetAllHouses,
  useGetHouse,
  useGetHousePhotos,
  useGetInvestment,
  useGetInvestorHouses,
  useGetOwnerHouses,
  useGetReceipt,
  useInvest,
  usePayRent,
  useReceiptCount,
  useStoreInvestmentReview,
  useUser,
} from "@/hooks/useContract";
import {
  formatAddress,
  formatTokenAmount,
  getReadableErrorMessage,
  getRegisteredUser,
  ipfsToGatewayUrl,
  MANTLE_SEPOLIA_CHAIN_ID,
  reloadPageForLatestOnchainData,
  ROLE_IDS,
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

type InvestmentReview = {
  rating: "strong" | "moderate" | "cautious";
  summary: string;
  positives: string[];
  risks: string[];
  suggestedInvestmentMnt: string;
};

type AIReview = {
  id: bigint;
  houseId: bigint;
  reviewType: number;
  reviewer: Address;
  reviewerRole: number;
  status: string;
  confidenceBps: bigint;
  summary: string;
  evidenceHash: `0x${string}`;
  evidenceURI: string;
  createdAt: bigint;
};

type StudentPropertyReview = {
  rating: "good_fit" | "fair_fit" | "needs_review";
  summary: string;
  fitChecks: string[];
  concerns: string[];
  suggestedTerm: "yearly" | "half-year";
};

type RentalReceipt = {
  id: bigint;
  houseId: bigint;
  student: Address;
  studentName: string;
  studentSchoolName: string;
  landlord: Address;
  landlordName: string;
  amountPaid: bigint;
  term: number;
  paidAt: bigint;
  startDate: bigint;
  dueDate: bigint;
  endDate: bigint;
};

const MANTLESCAN_TX_URL = "https://sepolia.mantlescan.xyz/tx";
const BITS_DEPLOYMENT_BLOCK = BigInt(38_826_822);
const RPC_LOG_BLOCK_RANGE = BigInt(9_999);

type BitsPublicClient = NonNullable<ReturnType<typeof usePublicClient>>;

async function getLatestBitsEvent({
  publicClient,
  eventName,
  args,
}: {
  publicClient: BitsPublicClient;
  eventName: "AIReviewStored" | "RentPaid";
  args: Record<string, unknown>;
}) {
  const latestBlock = await publicClient.getBlockNumber();
  let toBlock = latestBlock;

  while (toBlock >= BITS_DEPLOYMENT_BLOCK) {
    const rangeStart = toBlock - RPC_LOG_BLOCK_RANGE;
    const fromBlock = rangeStart > BITS_DEPLOYMENT_BLOCK
      ? rangeStart
      : BITS_DEPLOYMENT_BLOCK;
    const events = await publicClient.getContractEvents({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      eventName,
      args,
      fromBlock,
      toBlock,
    });
    const latestEvent = events.at(-1);

    if (latestEvent) {
      return latestEvent;
    }

    if (fromBlock === BITS_DEPLOYMENT_BLOCK) {
      break;
    }

    toBlock = fromBlock - BigInt(1);
  }

  return null;
}

type RawHouseObject = Partial<House> & {
  landlord?: Address;
};

type RawRentalReceipt = Partial<RentalReceipt> | readonly [
  bigint,
  bigint,
  Address,
  string,
  string,
  Address,
  string,
  bigint,
  number,
  bigint,
  bigint,
  bigint,
  bigint,
];

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

function toNumberValue(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "bigint" || typeof value === "string") {
    return Number(value);
  }

  return 0;
}

function formatTimestamp(value: bigint) {
  if (value === BigInt(0)) {
    return "Not set";
  }

  return new Date(Number(value) * 1000).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getRentTermLabel(term: number) {
  return term === 1 ? "Yearly" : "Half-year";
}

function getRemainingFunding(house: House) {
  return house.propertyValue > house.totalInvested
    ? house.propertyValue - house.totalInvested
    : BigInt(0);
}

function getFundingPercentage(house: House) {
  if (house.propertyValue === BigInt(0)) {
    return 0;
  }

  const percentage =
    (tokenAmountToNumber(house.totalInvested) /
      tokenAmountToNumber(house.propertyValue)) *
    100;

  return Math.min(100, Math.max(0, percentage));
}

function getMinimumInvestment(house: House, remainingFunding: bigint) {
  if (house.propertyValue === BigInt(0) || remainingFunding === BigInt(0)) {
    return BigInt(0);
  }

  const tenPercent = house.propertyValue / BigInt(10);

  return tenPercent > remainingFunding ? remainingFunding : tenPercent;
}

function getMaximumInvestment(house: House, remainingFunding: bigint) {
  if (house.propertyValue === BigInt(0) || remainingFunding === BigInt(0)) {
    return BigInt(0);
  }

  const fiftyPercent = house.propertyValue / BigInt(2);

  return fiftyPercent > remainingFunding ? remainingFunding : fiftyPercent;
}

function getInvestmentReviewConfidenceBps(rating: InvestmentReview["rating"]) {
  if (rating === "strong") {
    return BigInt(8_500);
  }

  if (rating === "moderate") {
    return BigInt(6_500);
  }

  return BigInt(4_500);
}

function getConciseOnchainReview(review: InvestmentReview) {
  const summary = `${review.rating}: ${review.summary}`.replace(/\s+/g, " ").trim();

  return summary.length > 140 ? `${summary.slice(0, 137)}...` : summary;
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

function normalizeReceipt(rawReceipt: RawRentalReceipt): RentalReceipt {
  if (!Array.isArray(rawReceipt)) {
    const receipt = rawReceipt as Partial<RentalReceipt>;

    return {
      id: toBigInt(receipt.id),
      houseId: toBigInt(receipt.houseId),
      student: toAddress(receipt.student),
      studentName: toStringValue(receipt.studentName),
      studentSchoolName: toStringValue(receipt.studentSchoolName),
      landlord: toAddress(receipt.landlord),
      landlordName: toStringValue(receipt.landlordName),
      amountPaid: toBigInt(receipt.amountPaid),
      term: toNumberValue(receipt.term),
      paidAt: toBigInt(receipt.paidAt),
      startDate: toBigInt(receipt.startDate),
      dueDate: toBigInt(receipt.dueDate),
      endDate: toBigInt(receipt.endDate),
    };
  }

  return {
    id: toBigInt(rawReceipt[0]),
    houseId: toBigInt(rawReceipt[1]),
    student: toAddress(rawReceipt[2]),
    studentName: toStringValue(rawReceipt[3]),
    studentSchoolName: toStringValue(rawReceipt[4]),
    landlord: toAddress(rawReceipt[5]),
    landlordName: toStringValue(rawReceipt[6]),
    amountPaid: toBigInt(rawReceipt[7]),
    term: toNumberValue(rawReceipt[8]),
    paidAt: toBigInt(rawReceipt[9]),
    startDate: toBigInt(rawReceipt[10]),
    dueDate: toBigInt(rawReceipt[11]),
    endDate: toBigInt(rawReceipt[12]),
  };
}

function LandlordName({ address }: { address: Address }) {
  const { data } = useUser(address);
  const user = getRegisteredUser(data);

  return <>{user?.registered && user.name ? user.name : "Unknown owner"}</>;
}

function CopyableAddress({
  address,
  className = "",
  full = false,
}: {
  address: Address;
  className?: string;
  full?: boolean;
}) {
  function handleCopyAddress() {
    void navigator.clipboard.writeText(address).then(() => {
      toast.success("Copied!");
    });
  }

  return (
    <button
      type="button"
      aria-label={`Copy wallet address ${address}`}
      title={address}
      onClick={handleCopyAddress}
      className={`rounded-sm text-left font-semibold underline-offset-2 transition hover:underline focus:outline-none focus:ring-2 focus:ring-[#810B38] ${className}`}
    >
      {full ? address : formatAddress(address)}
    </button>
  );
}

function FundingProgress({ house }: { house: House }) {
  const remainingFunding = getRemainingFunding(house);
  const fundingPercentage = getFundingPercentage(house);

  return (
    <div className="mt-4 rounded-lg border border-[#810B38]/15 bg-[#F1E2D1]/75 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-bold">Funding progress</p>
        <p className="text-sm font-bold">
          {fundingPercentage.toLocaleString(undefined, {
            maximumFractionDigits: 1,
          })}
          %
        </p>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/60">
        <div
          className="h-full rounded-full bg-[#810B38] transition-all"
          style={{ width: `${fundingPercentage}%` }}
        />
      </div>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <p>
          <span className="font-bold">Target:</span>{" "}
          {formatTokenAmount(house.propertyValue)}
        </p>
        <p>
          <span className="font-bold">Funded:</span>{" "}
          {formatTokenAmount(house.totalInvested)}
        </p>
        <p>
          <span className="font-bold">Remaining:</span>{" "}
          {formatTokenAmount(remainingFunding)}
        </p>
      </div>
    </div>
  );
}

function HistoryHouseCard({ house }: { house: House }) {
  return (
    <article className="flex min-h-52 flex-col rounded-lg border border-[#810B38]/15 bg-white/35 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold">{house.hostelName}</p>
          <p className="mt-1 line-clamp-2 text-xs font-semibold opacity-75">
            {house.hostelLocation}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[#810B38] px-3 py-1 text-xs font-bold text-[#F1E2D1]">
          #{house.id.toString()}
        </span>
      </div>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <p>
          <span className="font-bold">Value:</span>{" "}
          {formatTokenAmount(house.propertyValue)}
        </p>
        <p>
          <span className="font-bold">Invested:</span>{" "}
          {formatTokenAmount(house.totalInvested)}
        </p>
        <p>
          <span className="font-bold">Rooms:</span> {house.roomCount.toString()}
        </p>
        <p>
          <span className="font-bold">Available:</span>{" "}
          {house.availableRooms.toString()}
        </p>
      </div>
    </article>
  );
}

function InvestorHistoryItem({
  house,
  investor,
}: {
  house: House;
  investor: Address;
}) {
  const { data: investmentData } = useGetInvestment(house.id, investor);
  const investment = Array.isArray(investmentData)
    ? {
        amount: toBigInt(investmentData[2]),
        investedAt: toBigInt(investmentData[3]),
      }
    : {
        amount: toBigInt((investmentData as { amount?: bigint } | undefined)?.amount),
        investedAt: toBigInt(
          (investmentData as { investedAt?: bigint } | undefined)?.investedAt,
        ),
      };

  return (
    <article className="flex min-h-52 flex-col rounded-lg border border-[#810B38]/15 bg-white/35 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold">{house.hostelName}</p>
          <p className="mt-1 line-clamp-2 text-xs font-semibold opacity-75">
            {house.hostelLocation}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[#810B38] px-3 py-1 text-xs font-bold text-[#F1E2D1]">
          Invested
        </span>
      </div>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <p>
          <span className="font-bold">Amount:</span>{" "}
          {formatTokenAmount(investment.amount)}
        </p>
        <p>
          <span className="font-bold">Date:</span>{" "}
          {formatTimestamp(investment.investedAt)}
        </p>
        <p>
          <span className="font-bold">Property value:</span>{" "}
          {formatTokenAmount(house.propertyValue)}
        </p>
        <p>
          <span className="font-bold">Total funded:</span>{" "}
          {formatTokenAmount(house.totalInvested)}
        </p>
      </div>
    </article>
  );
}

function StudentReceiptItem({
  receiptId,
  student,
}: {
  receiptId: bigint;
  student: Address;
}) {
  const { data: receiptData } = useGetReceipt(receiptId);
  const publicClient = usePublicClient({ chainId: MANTLE_SEPOLIA_CHAIN_ID });
  const receipt = useMemo(
    () => (receiptData ? normalizeReceipt(receiptData as RawRentalReceipt) : null),
    [receiptData],
  );
  const { data: houseData } = useGetHouse(receipt?.houseId);
  const receiptHouse = useMemo(
    () => (houseData ? normalizeHouse(houseData as RawHouse | RawHouseObject) : null),
    [houseData],
  );
  const [receiptTxHash, setReceiptTxHash] = useState<`0x${string}` | null>(null);
  const [isReceiptTxLoading, setIsReceiptTxLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadReceiptTransaction() {
      if (!publicClient || !receipt) {
        setReceiptTxHash(null);
        return;
      }

      setIsReceiptTxLoading(true);

      try {
        const rentPaidEvent = await getLatestBitsEvent({
          publicClient,
          eventName: "RentPaid",
          args: {
            receiptId: receipt.id,
            houseId: receipt.houseId,
            student,
          },
        });

        if (isMounted) {
          setReceiptTxHash(rentPaidEvent?.transactionHash ?? null);
        }
      } catch {
        if (isMounted) {
          setReceiptTxHash(null);
        }
      } finally {
        if (isMounted) {
          setIsReceiptTxLoading(false);
        }
      }
    }

    void loadReceiptTransaction();

    return () => {
      isMounted = false;
    };
  }, [publicClient, receipt, student]);

  if (!receipt) {
    return null;
  }

  if (receipt.student.toLowerCase() !== student.toLowerCase()) {
    return null;
  }

  return (
    <article className="flex min-h-52 flex-col rounded-lg border border-[#810B38]/15 bg-white/35 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold">Receipt #{receipt.id.toString()}</p>
          <p className="mt-1 text-xs font-semibold opacity-75">
            {receiptHouse?.hostelName || `House #${receipt.houseId.toString()}`} •{" "}
            {getRentTermLabel(receipt.term)}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[#810B38] px-3 py-1 text-xs font-bold text-[#F1E2D1]">
          Rented
        </span>
      </div>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <p>
          <span className="font-bold">Amount:</span>{" "}
          {formatTokenAmount(receipt.amountPaid)}
        </p>
        <p>
          <span className="font-bold">Paid:</span>{" "}
          {formatTimestamp(receipt.paidAt)}
        </p>
        <p>
          <span className="font-bold">Starts:</span>{" "}
          {formatTimestamp(receipt.startDate)}
        </p>
        <p>
          <span className="font-bold">Ends:</span>{" "}
          {formatTimestamp(receipt.endDate)}
        </p>
        <p className="sm:col-span-2">
          <span className="font-bold">Landlord:</span> {receipt.landlordName}{" "}
          <span>(</span>
          <CopyableAddress address={receipt.landlord} />
          <span>)</span>
        </p>
      </div>
      <div className="mt-auto pt-4">
        {receiptTxHash ? (
          <a
            className="inline-flex h-9 items-center justify-center rounded-md bg-[#810B38] px-3 text-xs font-bold text-[#F1E2D1] transition-transform hover:scale-[1.03]"
            href={`${MANTLESCAN_TX_URL}/${receiptTxHash}`}
            rel="noreferrer"
            target="_blank"
          >
            View Receipt On-chain
          </a>
        ) : (
          <button
            className="inline-flex h-9 cursor-not-allowed items-center justify-center rounded-md bg-[#810B38]/45 px-3 text-xs font-bold text-[#F1E2D1]"
            disabled
            type="button"
          >
            {isReceiptTxLoading ? "Finding Receipt..." : "Receipt Tx Unavailable"}
          </button>
        )}
      </div>
    </article>
  );
}

function RoleHistory({
  userAddress,
  userRole,
}: {
  userAddress?: Address;
  userRole?: number;
}) {
  const { data: ownerHouseData, isLoading: isOwnerHousesLoading } =
    useGetOwnerHouses(userRole === ROLE_IDS.landlord ? userAddress : undefined);
  const { data: investorHouseData, isLoading: isInvestorHousesLoading } =
    useGetInvestorHouses(userRole === ROLE_IDS.investor ? userAddress : undefined);
  const { data: receiptCountData, isLoading: isReceiptCountLoading } =
    useReceiptCount();
  const ownerHouses = Array.isArray(ownerHouseData)
    ? (ownerHouseData as Array<RawHouse | RawHouseObject>).map(normalizeHouse)
    : [];
  const investorHouses = Array.isArray(investorHouseData)
    ? (investorHouseData as Array<RawHouse | RawHouseObject>).map(normalizeHouse)
    : [];
  const receiptIds = useMemo(() => {
    if (userRole !== ROLE_IDS.student || !receiptCountData) {
      return [];
    }

    const receiptCount = Number(receiptCountData);

    return Array.from({ length: receiptCount }, (_, index) => BigInt(index + 1));
  }, [receiptCountData, userRole]);

  if (!userAddress) {
    return null;
  }

  if (userRole === ROLE_IDS.landlord) {
    return (
      <div className="mt-4">
        <p className="font-bold">My Properties</p>
        {isOwnerHousesLoading ? (
          <p className="mt-3 text-sm font-semibold">Loading history...</p>
        ) : ownerHouses.length === 0 ? (
          <p className="mt-3 text-sm font-semibold">No properties created yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {ownerHouses.map((house) => (
              <HistoryHouseCard house={house} key={house.id.toString()} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (userRole === ROLE_IDS.investor) {
    return (
      <div className="mt-4">
        <p className="font-bold">My Investments</p>
        {isInvestorHousesLoading ? (
          <p className="mt-3 text-sm font-semibold">Loading history...</p>
        ) : investorHouses.length === 0 ? (
          <p className="mt-3 text-sm font-semibold">No investments yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {investorHouses.map((house) => (
              <InvestorHistoryItem
                house={house}
                investor={userAddress}
                key={house.id.toString()}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (userRole === ROLE_IDS.student) {
    return (
      <div className="mt-4">
        <p className="font-bold">My Rent History</p>
        {isReceiptCountLoading ? (
          <p className="mt-3 text-sm font-semibold">Loading history...</p>
        ) : receiptIds.length === 0 ? (
          <p className="mt-3 text-sm font-semibold">No rent receipts yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {receiptIds.map((receiptId) => (
              <StudentReceiptItem
                key={receiptId.toString()}
                receiptId={receiptId}
                student={userAddress}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

function HistoryDrawer({
  onClose,
  userAddress,
  userRole,
}: {
  onClose: () => void;
  userAddress?: Address;
  userRole?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex justify-end bg-neutral-900/35"
    >
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="bits-hidden-scroll h-full w-full max-w-3xl overflow-y-auto bg-[#F1E2D1] p-6 text-[#810B38] shadow-2xl"
      >
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-[#810B38]/15 pb-4">
          <div>
            <h2 className="text-xl font-bold">My History</h2>
            <p className="mt-1 text-sm font-semibold">
              Your activity from the Bits contract.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close history"
            className="flex h-9 w-9 items-center justify-center rounded-md text-4xl font-medium leading-none transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#810B38]"
          >
            ×
          </button>
        </div>

        <RoleHistory userAddress={userAddress} userRole={userRole} />
      </motion.aside>
    </motion.div>
  );
}

function PropertyDrawer({
  house,
  isUserRegistered,
  onClose,
  onRegister,
  studentMatricNumber,
  studentSchoolName,
  userRole,
}: {
  house: House;
  isUserRegistered?: boolean;
  onClose: () => void;
  onRegister?: () => void;
  studentMatricNumber?: string;
  studentSchoolName?: string;
  userRole?: number;
}) {
  const { data: photoData } = useGetHousePhotos(house.id);
  const { data: aiReviewsData } = useGetAIReviews(house.id);
  const photos = Array.isArray(photoData) ? photoData : [];
  const aiReviews = Array.isArray(aiReviewsData) ? (aiReviewsData as AIReview[]) : [];
  // reviewType 0 = PropertyVerification (set by the contract's storePropertyVerificationReview)
  const verificationReviews = aiReviews.filter((r) => r.reviewType === 0);
  const latestVerification = verificationReviews.at(-1) ?? null;
  const hasVerificationHash = latestVerification
    ? !/^0x0+$/i.test(latestVerification.evidenceHash)
    : false;
  const publicClient = usePublicClient({ chainId: MANTLE_SEPOLIA_CHAIN_ID });
  const [verificationTxHash, setVerificationTxHash] =
    useState<`0x${string}` | null>(null);
  const [isVerificationTxLoading, setIsVerificationTxLoading] = useState(false);
  const [investAmount, setInvestAmount] = useState("");
  const [rentTerm, setRentTerm] = useState(1);
  const [isInvesting, setIsInvesting] = useState(false);
  const [isRenting, setIsRenting] = useState(false);
  const [isReviewingInvestment, setIsReviewingInvestment] = useState(false);
  const [isApplyingInvestmentReview, setIsApplyingInvestmentReview] =
    useState(false);
  const [isReviewingStudentProperty, setIsReviewingStudentProperty] =
    useState(false);
  const [investmentReview, setInvestmentReview] =
    useState<InvestmentReview | null>(null);
  const [studentPropertyReview, setStudentPropertyReview] =
    useState<StudentPropertyReview | null>(null);
  const { investAsync } = useInvest();
  const { payRentAsync } = usePayRent();
  const { storeInvestmentReviewAsync } = useStoreInvestmentReview();
  const remainingFunding = getRemainingFunding(house);
  const minimumInvestment = getMinimumInvestment(house, remainingFunding);
  const maximumInvestment = getMaximumInvestment(house, remainingFunding);

  useEffect(() => {
    let isMounted = true;

    async function loadVerificationTransaction() {
      if (!publicClient || !latestVerification) {
        setVerificationTxHash(null);
        return;
      }

      setIsVerificationTxLoading(true);

      try {
        const reviewEvent = await getLatestBitsEvent({
          publicClient,
          eventName: "AIReviewStored",
          args: {
            reviewId: latestVerification.id,
            houseId: latestVerification.houseId,
            reviewType: latestVerification.reviewType,
          },
        });

        if (isMounted) {
          setVerificationTxHash(reviewEvent?.transactionHash ?? null);
        }
      } catch {
        if (isMounted) {
          setVerificationTxHash(null);
        }
      } finally {
        if (isMounted) {
          setIsVerificationTxLoading(false);
        }
      }
    }

    void loadVerificationTransaction();

    return () => {
      isMounted = false;
    };
  }, [latestVerification, publicClient]);

  async function handleInvest() {
    if (!investAmount) return;

    let parsedAmount: bigint;
    try {
      parsedAmount = parseEther(investAmount);
    } catch {
      toast.error("Enter a valid investment amount.");
      return;
    }

    if (minimumInvestment > BigInt(0) && parsedAmount < minimumInvestment) {
      toast.error(`Minimum investment is ${formatTokenAmount(minimumInvestment)}.`);
      return;
    }

    if (parsedAmount > maximumInvestment) {
      toast.error(`Maximum investment is ${formatTokenAmount(maximumInvestment)}.`);
      return;
    }

    setIsInvesting(true);
    try {
      const hash = await investAsync(house.id, parsedAmount);

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      toast.success("Investment successful");
      setInvestAmount("");
      reloadPageForLatestOnchainData();
    } catch (error) {
      toast.error(getReadableErrorMessage(error));
    } finally {
      setIsInvesting(false);
    }
  }

  async function handleInvestmentReview() {
    setIsReviewingInvestment(true);
    setInvestmentReview(null);

    try {
      const response = await fetch("/api/ai/investment-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hostelName: house.hostelName,
          hostelLocation: house.hostelLocation,
          schoolName: house.schoolName,
          roomCount: house.roomCount.toString(),
          availableRooms: house.availableRooms.toString(),
          propertyValueMnt: formatTokenAmount(house.propertyValue),
          yearlyRentMnt: formatTokenAmount(house.yearlyRent),
          halfYearRentMnt: formatTokenAmount(house.halfYearRent),
          totalInvestedMnt: formatTokenAmount(house.totalInvested),
          remainingFundingMnt: formatTokenAmount(remainingFunding),
          minInvestmentMnt: formatTokenAmount(minimumInvestment),
          maxInvestmentMnt: formatTokenAmount(maximumInvestment),
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error ?? "AI investment review failed.");
      }

      setInvestmentReview(result as InvestmentReview);
      toast.success("AI investment review complete");
    } catch (error) {
      toast.error(getReadableErrorMessage(error));
    } finally {
      setIsReviewingInvestment(false);
    }
  }

  async function applyInvestmentSuggestion() {
    if (!investmentReview) {
      return;
    }

    const suggestedAmount = investmentReview.suggestedInvestmentMnt
      .replace(/,/g, "")
      .replace(/mnt/gi, "")
      .trim();
    const onchainSummary = getConciseOnchainReview(investmentReview);
    const evidenceHash = keccak256(
      stringToHex(
        JSON.stringify({
          houseId: house.id.toString(),
          rating: investmentReview.rating,
          summary: onchainSummary,
          suggestedAmount,
        }),
      ),
    );

    setIsApplyingInvestmentReview(true);

    try {
      setInvestAmount(suggestedAmount);
      const hash = await storeInvestmentReviewAsync(
        house.id,
        investmentReview.rating,
        getInvestmentReviewConfidenceBps(investmentReview.rating),
        onchainSummary,
        evidenceHash,
        "",
      );

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      toast.success("Investment review saved on-chain");
      reloadPageForLatestOnchainData();
    } catch (error) {
      toast.error(getReadableErrorMessage(error));
    } finally {
      setIsApplyingInvestmentReview(false);
    }
  }

  async function handleRent() {
    setIsRenting(true);
    try {
      const value = rentTerm === 1 ? house.yearlyRent : house.halfYearRent;
      const hash = await payRentAsync(house.id, rentTerm, value);

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      toast.success("Room rented successfully");
      reloadPageForLatestOnchainData();
    } catch (error) {
      toast.error(getReadableErrorMessage(error));
    } finally {
      setIsRenting(false);
    }
  }

  async function handleStudentPropertyReview() {
    setIsReviewingStudentProperty(true);
    setStudentPropertyReview(null);

    try {
      const response = await fetch("/api/ai/student-property-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          availableRooms: house.availableRooms.toString(),
          halfYearRentMnt: formatTokenAmount(house.halfYearRent),
          hostelLocation: house.hostelLocation,
          hostelName: house.hostelName,
          propertySchoolName: house.schoolName,
          roomCount: house.roomCount.toString(),
          studentMatricNumber,
          studentSchoolName,
          yearlyRentMnt: formatTokenAmount(house.yearlyRent),
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error ?? "AI student review failed.");
      }

      setStudentPropertyReview(result as StudentPropertyReview);
      toast.success("AI student review complete");
    } catch (error) {
      toast.error(getReadableErrorMessage(error));
    } finally {
      setIsReviewingStudentProperty(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex justify-end bg-neutral-900/35"
    >
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="bits-hidden-scroll h-full w-full max-w-6xl overflow-y-auto bg-[#F1E2D1] p-6 text-[#810B38] shadow-2xl"
      >
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
            <CopyableAddress
              address={house.landlord}
              className="mt-1 block break-all font-medium"
              full
            />
          </section>

          <section className="grid gap-3 rounded-lg border border-[#810B38]/15 bg-white/35 p-4 sm:grid-cols-2">
            <p>
              <span className="font-bold">Property school:</span> {house.schoolName}
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
              <p>Yearly rent: {formatTokenAmount(house.yearlyRent)}</p>
              <p>Half-year rent: {formatTokenAmount(house.halfYearRent)}</p>
              {userRole !== ROLE_IDS.student ? (
                <>
                  <p>Property value: {formatTokenAmount(house.propertyValue)}</p>
                  <p>Total invested: {formatTokenAmount(house.totalInvested)}</p>
                </>
              ) : null}
            </div>
            {(userRole === ROLE_IDS.landlord || userRole === ROLE_IDS.investor) ? (
              <FundingProgress house={house} />
            ) : null}
          </section>

          {latestVerification ? (
            <section className="rounded-lg border border-[#810B38]/15 bg-white/35 p-4">
              <p className="font-bold">Property Verification</p>
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  {latestVerification.status === "verified" ? (
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-600" />
                  ) : (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold capitalize text-white ${
                        latestVerification.status === "failed"
                          ? "bg-red-700"
                          : "bg-amber-600"
                      }`}
                    >
                      {latestVerification.status.replace("_", " ")}
                    </span>
                  )}
                  <span className="text-xs font-semibold opacity-75">
                    {(Number(latestVerification.confidenceBps) / 100).toFixed(0)}% confidence
                  </span>
                </div>
                <p className="text-sm font-medium leading-relaxed">
                  {latestVerification.summary.charAt(0).toUpperCase() + latestVerification.summary.slice(1)}
                </p>
                {hasVerificationHash ? (
                  <div className="rounded-md border border-[#810B38]/15 bg-[#F1E2D1]/70 p-3">
                    <p className="text-xs font-bold">AI verified hash</p>
                    <p className="mt-2 break-all text-xs font-semibold opacity-80">
                      {latestVerification.evidenceHash}
                    </p>
                    {verificationTxHash ? (
                      <a
                        href={`${MANTLESCAN_TX_URL}/${verificationTxHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block text-xs font-bold underline underline-offset-2 opacity-75 hover:opacity-100"
                      >
                        View onchain verification
                      </a>
                    ) : (
                      <p className="mt-3 text-xs font-semibold opacity-70">
                        {isVerificationTxLoading
                          ? "Loading onchain verification..."
                          : "Onchain verification transaction unavailable."}
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {userRole === ROLE_IDS.investor && (
            <section className="rounded-lg border border-[#810B38]/15 bg-white/35 p-4">
              <div className="flex flex-col gap-1 border-b border-[#810B38]/15 pb-3">
                <p className="text-base font-bold">Invest in this Property</p>
                <p className="text-xs font-semibold opacity-75">
                  Choose an amount within the allowed funding range.
                </p>
              </div>

              {house.fundingClosed ? (
                <p className="mt-3 text-sm font-medium opacity-70">Funding is closed for this property.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-[#810B38]/15 bg-[#F1E2D1]/80 p-4">
                      <p className="text-xs font-bold uppercase tracking-normal opacity-70">
                        Minimum investment
                      </p>
                      <p className="mt-2 text-xl font-bold">
                        {formatTokenAmount(minimumInvestment)}
                      </p>
                      <p className="mt-1 text-xs font-semibold opacity-75">
                        10% of property value
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#810B38]/15 bg-[#F1E2D1]/80 p-4">
                      <p className="text-xs font-bold uppercase tracking-normal opacity-70">
                        Maximum investment
                      </p>
                      <p className="mt-2 text-xl font-bold">
                        {formatTokenAmount(maximumInvestment)}
                      </p>
                      <p className="mt-1 text-xs font-semibold opacity-75">
                        50% of property value
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#810B38]/15 bg-white/30 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-bold">Review</p>
                        <p className="mt-1 text-xs font-semibold opacity-75">
                          Get a quick read on funding fit and investment risk.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isReviewingInvestment || remainingFunding === BigInt(0)}
                        onClick={handleInvestmentReview}
                        className="h-10 shrink-0 rounded-md border border-[#810B38]/30 bg-transparent px-4 text-sm font-bold text-[#810B38] transition-transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-[#810B38] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isReviewingInvestment ? "Reviewing..." : "Review Property"}
                      </button>
                    </div>

                    {investmentReview ? (
                      <div className="mt-4 rounded-md border border-[#810B38]/15 bg-white/40 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-bold">AI Review</p>
                          <span className="rounded-full bg-[#810B38] px-3 py-1 text-xs font-bold capitalize text-[#F1E2D1]">
                            {investmentReview.rating}
                          </span>
                        </div>
                        <p className="mt-2 font-medium">{investmentReview.summary}</p>
                        <p className="mt-2 text-xs font-semibold">
                          Suggested amount: {investmentReview.suggestedInvestmentMnt} MNT
                        </p>
                        <button
                          type="button"
                          disabled={isApplyingInvestmentReview}
                          onClick={applyInvestmentSuggestion}
                          className="mt-3 h-9 rounded-md border border-[#810B38]/35 px-3 text-xs font-bold transition-colors hover:bg-[#810B38] hover:text-[#F1E2D1] focus:outline-none focus:ring-2 focus:ring-[#810B38] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isApplyingInvestmentReview
                            ? "Saving Review..."
                            : "Apply Suggestion"}
                        </button>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="font-semibold">Positives</p>
                            <ul className="mt-1 list-disc space-y-1 pl-4">
                              {investmentReview.positives.map((positive) => (
                                <li key={positive}>{positive}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="font-semibold">Risks</p>
                            <ul className="mt-1 list-disc space-y-1 pl-4">
                              {investmentReview.risks.map((risk) => (
                                <li key={risk}>{risk}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-lg border border-[#810B38]/15 bg-white/30 p-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold">Amount (MNT)</span>
                      <input
                        type="number"
                        min={tokenAmountToNumber(minimumInvestment)}
                        max={tokenAmountToNumber(maximumInvestment)}
                        step="any"
                        value={investAmount}
                        onChange={(e) => setInvestAmount(e.target.value)}
                        placeholder="e.g. 1600"
                        className="h-11 w-full rounded-md border border-[#810B38]/35 bg-white/55 px-3 text-sm outline-none transition focus:border-[#810B38] focus:ring-2 focus:ring-[#810B38]/25"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={isInvesting || !investAmount}
                      onClick={handleInvest}
                      className="mt-3 h-10 w-full rounded-md bg-[#810B38] px-4 text-sm font-semibold text-[#F1E2D1] transition-colors hover:bg-[#6d092f] focus:outline-none focus:ring-2 focus:ring-[#810B38] focus:ring-offset-2 focus:ring-offset-[#F1E2D1] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isInvesting ? "Investing..." : "Invest"}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {userRole === ROLE_IDS.student && (
            <section className="rounded-lg border border-[#810B38]/15 bg-white/35 p-4">
              <div className="flex flex-col gap-1 border-b border-[#810B38]/15 pb-3">
                <p className="text-base font-bold">Rent a Room</p>
                <p className="text-xs font-semibold opacity-75">
                  Review the listing and choose a rental term.
                </p>
              </div>

              {house.availableRooms === BigInt(0) ? (
                <p className="mt-3 text-sm font-medium opacity-70">No rooms available.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="rounded-lg border border-[#810B38]/15 bg-[#F1E2D1]/80 p-4">
                    <div className="flex flex-col gap-1 border-b border-[#810B38]/10 pb-3">
                      <p className="font-bold">Your student profile</p>
                      <p className="text-xs font-semibold opacity-75">
                        Used only to compare this listing with your registered school details.
                      </p>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-normal opacity-70">
                          Your registered school
                        </p>
                        <p className="mt-2 font-bold">
                          {studentSchoolName || "Not available"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-normal opacity-70">
                          Your matric number
                        </p>
                        <p className="mt-2 font-bold">
                          {studentMatricNumber || "Not available"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#810B38]/15 bg-white/30 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-bold">Review</p>
                        <p className="mt-1 text-xs font-semibold opacity-75">
                          Let AI check school fit, rent, and room availability.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isReviewingStudentProperty}
                        onClick={handleStudentPropertyReview}
                        className="h-10 shrink-0 rounded-md border border-[#810B38]/30 bg-transparent px-4 text-sm font-bold text-[#810B38] transition-transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-[#810B38] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isReviewingStudentProperty ? "Reviewing..." : "Review Property"}
                      </button>
                    </div>

                    {studentPropertyReview ? (
                      <div className="mt-4 rounded-md border border-[#810B38]/15 bg-white/40 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-bold">AI Review</p>
                          <span className="rounded-full bg-[#810B38] px-3 py-1 text-xs font-bold capitalize text-[#F1E2D1]">
                            {studentPropertyReview.rating.replace("_", " ")}
                          </span>
                        </div>
                        <p className="mt-2 font-medium">{studentPropertyReview.summary}</p>
                        <p className="mt-2 text-xs font-semibold">
                          Suggested term: {studentPropertyReview.suggestedTerm}
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="font-semibold">Fit checks</p>
                            <ul className="mt-1 list-disc space-y-1 pl-4">
                              {studentPropertyReview.fitChecks.map((check) => (
                                <li key={check}>{check}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="font-semibold">Concerns</p>
                            <ul className="mt-1 list-disc space-y-1 pl-4">
                              {studentPropertyReview.concerns.map((concern) => (
                                <li key={concern}>{concern}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-lg border border-[#810B38]/15 bg-white/30 p-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold">Rental term</span>
                      <select
                        value={rentTerm}
                        onChange={(e) => setRentTerm(Number(e.target.value))}
                        className="h-11 w-full rounded-md border border-[#810B38]/35 bg-white/55 px-3 text-sm outline-none transition focus:border-[#810B38] focus:ring-2 focus:ring-[#810B38]/25"
                      >
                        <option value={1}>Yearly — {formatTokenAmount(house.yearlyRent)}</option>
                        <option value={0}>Half-year — {formatTokenAmount(house.halfYearRent)}</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      disabled={isRenting}
                      onClick={handleRent}
                      className="mt-3 h-10 w-full rounded-md bg-[#810B38] px-4 text-sm font-semibold text-[#F1E2D1] transition-colors hover:bg-[#6d092f] focus:outline-none focus:ring-2 focus:ring-[#810B38] focus:ring-offset-2 focus:ring-offset-[#F1E2D1] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isRenting ? "Processing..." : "Rent Room"}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {isUserRegistered === false && (
            <section className="rounded-lg border border-[#810B38]/15 bg-white/35 p-4">
              <p className="text-base font-bold">Invest or rent this property</p>
              <p className="mt-1 text-sm font-medium opacity-75">
                Register an account to invest in this property or rent a room.
              </p>
              <button
                type="button"
                onClick={onRegister}
                className="mt-4 h-10 w-full rounded-md bg-[#810B38] px-4 text-sm font-bold text-[#F1E2D1] transition-colors hover:bg-[#6d092f] focus:outline-none focus:ring-2 focus:ring-[#810B38] focus:ring-offset-2 focus:ring-offset-[#F1E2D1]"
              >
                Register Now
              </button>
            </section>
          )}

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
      </motion.aside>
    </motion.div>
  );
}

function PropertyCard({
  house,
  isMntPriceLoading,
  mntUsdPrice,
  onViewMore,
  userRole,
}: {
  house: House;
  isMntPriceLoading: boolean;
  mntUsdPrice: number | null;
  onViewMore: () => void;
  userRole?: number;
}) {
  const usdyValue =
    mntUsdPrice === null ? null : tokenAmountToNumber(house.propertyValue) * mntUsdPrice;
  const actionLabel =
    userRole === ROLE_IDS.investor
      ? "View / Invest"
      : userRole === ROLE_IDS.student
        ? "View / Rent"
        : "View More";

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
          <CopyableAddress
            address={house.landlord}
            className="shrink-0 text-xs font-medium"
          />
        </div>

        <div className="mt-1 flex items-center justify-between gap-3 border-t border-[#810B38]/15 pt-4">
          <p className="text-sm font-bold">{formatTokenAmount(house.propertyValue)}</p>
          <p className="text-xs font-semibold">
            {usdyValue !== null
              ? `~${usdyValue.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })} USDY`
              : isMntPriceLoading
                ? null
                : null}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onViewMore}
        className="mt-2 h-10 w-full rounded-md bg-[#810B38] px-4 text-sm font-semibold text-[#F1E2D1] transition-colors hover:bg-[#6d092f] focus:outline-none focus:ring-2 focus:ring-[#810B38] focus:ring-offset-2 focus:ring-offset-[#F1E2D1]"
      >
        {actionLabel}
      </button>
    </article>
  );
}

export function PropertyList({
  isUserRegistered,
  onRegister,
  studentMatricNumber,
  studentSchoolName,
  userAddress,
  userRole,
}: {
  isUserRegistered?: boolean;
  onRegister?: () => void;
  studentMatricNumber?: string;
  studentSchoolName?: string;
  userAddress?: Address;
  userRole?: number;
}) {
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [mntUsdPrice, setMntUsdPrice] = useState<number | null>(null);
  const [isMntPriceLoading, setIsMntPriceLoading] = useState(true);
  const { data, isLoading } = useGetAllHouses();
  const houses = useMemo(() => {
    if (!Array.isArray(data)) {
      return [];
    }

    return (data as Array<RawHouse | RawHouseObject>)
      .map(normalizeHouse)
      .filter((house) => house.id >= BigInt(0) && house.active);
  }, [data]);

  useEffect(() => {
    if (!Array.isArray(data)) {
      return;
    }

    console.log("Fetched properties", data);
    console.log("Normalized active properties", houses);
  }, [data, houses]);

  useEffect(() => {
    let isMounted = true;

    async function fetchMntUsdPrice() {
      try {
        const response = await fetch("/api/price/mnt");
        const data = (await response.json()) as { price?: number; error?: string };

        if (isMounted && data.price && Number.isFinite(data.price) && data.price > 0) {
          setMntUsdPrice(data.price);
        }
      } catch {
        // price unavailable — leave mntUsdPrice as null
      } finally {
        if (isMounted) {
          setIsMntPriceLoading(false);
        }
      }
    }

    // void fetchMntUsdPrice();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="mt-10 w-full">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold">Properties</h2>
        <div className="flex flex-col items-end gap-2">
          <span className="text-sm font-semibold">{houses.length} listed</span>
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="h-9 rounded-md border border-[#810B38]/30 px-4 text-xs font-bold text-[#810B38] transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#810B38]"
          >
            View My History
          </button>
        </div>
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
              isMntPriceLoading={isMntPriceLoading}
              key={house.id.toString()}
              mntUsdPrice={mntUsdPrice}
              onViewMore={() => setSelectedHouse(house)}
              userRole={userRole}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedHouse && (
          <PropertyDrawer
            house={selectedHouse}
            isUserRegistered={isUserRegistered}
            key={selectedHouse.id.toString()}
            onClose={() => setSelectedHouse(null)}
            onRegister={onRegister}
            studentMatricNumber={studentMatricNumber}
            studentSchoolName={studentSchoolName}
            userRole={userRole}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isHistoryOpen && (
          <HistoryDrawer
            onClose={() => setIsHistoryOpen(false)}
            userAddress={userAddress}
            userRole={userRole}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
