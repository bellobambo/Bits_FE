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
