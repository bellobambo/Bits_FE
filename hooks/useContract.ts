"use client";

import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { type Address, zeroAddress } from "viem";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/lib/contract";

const contract = {
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
} as const;

const ZERO_BIGINT = BigInt(0);

export type Role = number;
export type RentTerm = number;

export type HouseInput = {
  hostelName: string;
  hostelLocation: string;
  schoolName: string;
  proofOfOwnership: string;
  photos: string[];
  roomCount: bigint;
  yearlyRent: bigint;
  halfYearRent: bigint;
  propertyValue: bigint;
};

export function useBpsDenominator() {
  return useReadContract({
    ...contract,
    functionName: "BPS_DENOMINATOR",
  });
}

export function useFullYearDuration() {
  return useReadContract({
    ...contract,
    functionName: "FULL_YEAR_DURATION",
  });
}

export function useHalfYearDuration() {
  return useReadContract({
    ...contract,
    functionName: "HALF_YEAR_DURATION",
  });
}

export function useInvestorRentShareBps() {
  return useReadContract({
    ...contract,
    functionName: "INVESTOR_RENT_SHARE_BPS",
  });
}

export function useLandlordRentShareBps() {
  return useReadContract({
    ...contract,
    functionName: "LANDLORD_RENT_SHARE_BPS",
  });
}

export function usePaymentGracePeriod() {
  return useReadContract({
    ...contract,
    functionName: "PAYMENT_GRACE_PERIOD",
  });
}

export function usePlatformRentShareBps() {
  return useReadContract({
    ...contract,
    functionName: "PLATFORM_RENT_SHARE_BPS",
  });
}

export function useRentStartDelay() {
  return useReadContract({
    ...contract,
    functionName: "RENT_START_DELAY",
  });
}

export function useGetAllHouses() {
  return useReadContract({
    ...contract,
    functionName: "getAllHouses",
  });
}

export function useGetHouse(houseId?: bigint) {
  return useReadContract({
    ...contract,
    functionName: "getHouse",
    args: [houseId ?? ZERO_BIGINT],
    query: {
      enabled: houseId !== undefined,
    },
  });
}

export function useGetHouseInvestors(houseId?: bigint) {
  return useReadContract({
    ...contract,
    functionName: "getHouseInvestors",
    args: [houseId ?? ZERO_BIGINT],
    query: {
      enabled: houseId !== undefined,
    },
  });
}

export function useGetHousePhotos(houseId?: bigint) {
  return useReadContract({
    ...contract,
    functionName: "getHousePhotos",
    args: [houseId ?? ZERO_BIGINT],
    query: {
      enabled: houseId !== undefined,
    },
  });
}

export function useGetAIReviews(houseId?: bigint) {
  return useReadContract({
    ...contract,
    functionName: "getAIReviews",
    args: [houseId ?? ZERO_BIGINT],
    query: {
      enabled: houseId !== undefined,
    },
  });
}

export function useGetInvestment(houseId?: bigint, investor?: Address) {
  return useReadContract({
    ...contract,
    functionName: "getInvestment",
    args: [houseId ?? ZERO_BIGINT, investor ?? zeroAddress],
    query: {
      enabled: houseId !== undefined && Boolean(investor),
    },
  });
}

export function useGetInvestorHouses(investor?: Address) {
  return useReadContract({
    ...contract,
    functionName: "getInvestorHouses",
    args: [investor ?? zeroAddress],
    query: {
      enabled: Boolean(investor),
    },
  });
}

export function useGetMyPayoutHistory(houseId?: bigint) {
  return useReadContract({
    ...contract,
    functionName: "getMyPayoutHistory",
    args: [houseId ?? ZERO_BIGINT],
    query: {
      enabled: houseId !== undefined,
    },
  });
}

export function useGetOwnerHouses(landlord?: Address) {
  return useReadContract({
    ...contract,
    functionName: "getOwnerHouses",
    args: [landlord ?? zeroAddress],
    query: {
      enabled: Boolean(landlord),
    },
  });
}

export function useGetPayoutHistory(houseId?: bigint, recipient?: Address) {
  return useReadContract({
    ...contract,
    functionName: "getPayoutHistory",
    args: [houseId ?? ZERO_BIGINT, recipient ?? zeroAddress],
    query: {
      enabled: houseId !== undefined && Boolean(recipient),
    },
  });
}

export function useGetReceipt(receiptId?: bigint) {
  return useReadContract({
    ...contract,
    functionName: "getReceipt",
    args: [receiptId ?? ZERO_BIGINT],
    query: {
      enabled: receiptId !== undefined,
    },
  });
}

export function useHouseCount() {
  return useReadContract({
    ...contract,
    functionName: "houseCount",
  });
}

export function useInvestedAtByHouse(houseId?: bigint, investor?: Address) {
  return useReadContract({
    ...contract,
    functionName: "investedAtByHouse",
    args: [houseId ?? ZERO_BIGINT, investor ?? zeroAddress],
    query: {
      enabled: houseId !== undefined && Boolean(investor),
    },
  });
}

export function useInvestedByHouse(houseId?: bigint, investor?: Address) {
  return useReadContract({
    ...contract,
    functionName: "investedByHouse",
    args: [houseId ?? ZERO_BIGINT, investor ?? zeroAddress],
    query: {
      enabled: houseId !== undefined && Boolean(investor),
    },
  });
}

export function useNextHouseId() {
  return useReadContract({
    ...contract,
    functionName: "nextHouseId",
  });
}

export function useNextReceiptId() {
  return useReadContract({
    ...contract,
    functionName: "nextReceiptId",
  });
}

export function usePlatformOwner() {
  return useReadContract({
    ...contract,
    functionName: "platformOwner",
  });
}

export function useReceiptCount() {
  return useReadContract({
    ...contract,
    functionName: "receiptCount",
  });
}

export function useUser(address?: Address) {
  return useReadContract({
    ...contract,
    functionName: "users",
    args: [address ?? zeroAddress],
    query: {
      enabled: Boolean(address),
    },
  });
}

export function useRegister() {
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  });

  return {
    ...write,
    ...receipt,
    hash: write.data,
    isRegisterPending: write.isPending || receipt.isLoading,
    register: (name: string, role: Role, matricNumber: string, schoolName: string) =>
      write.writeContract({
        ...contract,
        functionName: "register",
        args: [name, role, matricNumber, schoolName],
      }),
    registerAsync: (name: string, role: Role, matricNumber: string, schoolName: string) =>
      write.writeContractAsync({
        ...contract,
        functionName: "register",
        args: [name, role, matricNumber, schoolName],
      }),
  };
}

export function useUploadHouse() {
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  });

  return {
    ...write,
    ...receipt,
    hash: write.data,
    isUploadHousePending: write.isPending || receipt.isLoading,
    uploadHouse: (input: HouseInput) =>
      write.writeContract({
        ...contract,
        functionName: "uploadHouse",
        args: [input],
      }),
    uploadHouseAsync: (input: HouseInput) =>
      write.writeContractAsync({
        ...contract,
        functionName: "uploadHouse",
        args: [input],
      }),
  };
}

export function useInvest() {
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  });

  return {
    ...write,
    ...receipt,
    hash: write.data,
    invest: (houseId: bigint, value: bigint) =>
      write.writeContract({
        ...contract,
        functionName: "invest",
        args: [houseId],
        value,
      }),
    investAsync: (houseId: bigint, value: bigint) =>
      write.writeContractAsync({
        ...contract,
        functionName: "invest",
        args: [houseId],
        value,
      }),
  };
}

export function usePayRent() {
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  });

  return {
    ...write,
    ...receipt,
    hash: write.data,
    payRent: (houseId: bigint, term: RentTerm, value: bigint) =>
      write.writeContract({
        ...contract,
        functionName: "payRent",
        args: [houseId, term],
        value,
      }),
    payRentAsync: (houseId: bigint, term: RentTerm, value: bigint) =>
      write.writeContractAsync({
        ...contract,
        functionName: "payRent",
        args: [houseId, term],
        value,
      }),
  };
}

export function useStoreInvestmentReview() {
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  });

  return {
    ...write,
    ...receipt,
    hash: write.data,
    isStoreInvestmentReviewPending: write.isPending || receipt.isLoading,
    storeInvestmentReview: (
      houseId: bigint,
      status: string,
      confidenceBps: bigint,
      summary: string,
      evidenceHash: `0x${string}`,
      evidenceURI: string,
    ) =>
      write.writeContract({
        ...contract,
        functionName: "storeInvestmentReview",
        args: [houseId, status, confidenceBps, summary, evidenceHash, evidenceURI],
      }),
    storeInvestmentReviewAsync: (
      houseId: bigint,
      status: string,
      confidenceBps: bigint,
      summary: string,
      evidenceHash: `0x${string}`,
      evidenceURI: string,
    ) =>
      write.writeContractAsync({
        ...contract,
        functionName: "storeInvestmentReview",
        args: [houseId, status, confidenceBps, summary, evidenceHash, evidenceURI],
      }),
  };
}

export function useStorePropertyVerificationReview() {
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
  });

  return {
    ...write,
    ...receipt,
    hash: write.data,
    isStorePropertyVerificationReviewPending: write.isPending || receipt.isLoading,
    storePropertyVerificationReview: (
      houseId: bigint,
      status: string,
      confidenceBps: bigint,
      summary: string,
      evidenceHash: `0x${string}`,
      evidenceURI: string,
    ) =>
      write.writeContract({
        ...contract,
        functionName: "storePropertyVerificationReview",
        args: [houseId, status, confidenceBps, summary, evidenceHash, evidenceURI],
      }),
    storePropertyVerificationReviewAsync: (
      houseId: bigint,
      status: string,
      confidenceBps: bigint,
      summary: string,
      evidenceHash: `0x${string}`,
      evidenceURI: string,
    ) =>
      write.writeContractAsync({
        ...contract,
        functionName: "storePropertyVerificationReview",
        args: [houseId, status, confidenceBps, summary, evidenceHash, evidenceURI],
      }),
  };
}
