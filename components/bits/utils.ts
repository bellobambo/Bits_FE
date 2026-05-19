export const MANTLE_SEPOLIA_CHAIN_ID = 5003;

export const ROLE_OPTIONS = [
  { label: "Student", value: 0 },
  { label: "Landlord", value: 1 },
  { label: "Investor", value: 2 },
] as const;

export type RegisteredProfile = {
  name: string;
  role: number;
};

export function formatAddress(address?: string) {
  if (!address) {
    return "";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTokenAmount(value: bigint) {
  const divisor = BigInt(10) ** BigInt(18);
  const whole = value / divisor;
  const fraction = value % divisor;
  const fractionText = fraction.toString().padStart(18, "0").slice(0, 4);
  const trimmedFraction = fractionText.replace(/0+$/, "");

  return `${whole.toLocaleString()}${trimmedFraction ? `.${trimmedFraction}` : ""} MNT`;
}

export function tokenAmountToNumber(value: bigint) {
  return Number(value) / 1e18;
}

export function ipfsToGatewayUrl(value: string) {
  if (value.startsWith("ipfs://")) {
    return `https://gateway.pinata.cloud/ipfs/${value.replace("ipfs://", "")}`;
  }

  return value;
}

export function getRoleLabel(roleValue: number) {
  return (
    ROLE_OPTIONS.find((option) => option.value === roleValue)?.label ?? "User"
  );
}

export function getRegisteredUser(data: unknown) {
  if (!Array.isArray(data)) {
    return null;
  }

  return {
    name: String(data[0] ?? ""),
    role: Number(data[1] ?? 0),
    registered: Boolean(data[4]),
  };
}

export function getReadableErrorMessage(error: unknown) {
  const message =
    error instanceof Error ? error.message : String(error ?? "Transaction failed");
  const reasonMatch =
    message.match(/Execution reverted with reason:\s*([^.]+)/i) ??
    message.match(/Details:\s*execution reverted:\s*([^\n]+)/i) ??
    message.match(/execution reverted:\s*([^\n]+)/i);

  if (reasonMatch?.[1]) {
    return reasonMatch[1].trim();
  }

  return message.split("Raw Call Arguments:")[0].trim();
}
