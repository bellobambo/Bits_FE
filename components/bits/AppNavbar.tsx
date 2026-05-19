"use client";

import { useState } from "react";
import { formatAddress } from "@/components/bits/utils";

type AppNavbarProps = {
  address?: string;
  balanceLabel: string;
  isBalanceLoading: boolean;
  isUserRegistered: boolean;
  onDisconnect: () => void;
  onRegister: () => void;
};

export function AppNavbar({
  address,
  balanceLabel,
  isBalanceLoading,
  isUserRegistered,
  onDisconnect,
  onRegister,
}: AppNavbarProps) {
  const [copied, setCopied] = useState(false);

  function handleCopyAddress() {
    if (!address) return;
    void navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <nav className="flex min-h-[72px] w-full items-center justify-between gap-4 bg-[#810B38] px-5 py-4 text-[#F1E2D1] shadow-sm sm:px-8">
      <div className="flex min-w-0 items-center gap-3 sm:gap-5">
        <span className="text-xl font-bold tracking-normal">Bits</span>
        {!isUserRegistered ? (
          <button
            type="button"
            onClick={onRegister}
            className="h-10 rounded-md bg-[#F1E2D1] px-4 text-sm font-semibold text-[#810B38] transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#F1E2D1] focus:ring-offset-2 focus:ring-offset-[#810B38]"
          >
            Register
          </button>
        ) : null}
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <span className="hidden rounded-md border border-[#F1E2D1]/45 px-3 py-2 text-sm font-medium sm:inline-flex">
          {isBalanceLoading ? "Loading MNT..." : balanceLabel}
        </span>
        <button
          type="button"
          onClick={handleCopyAddress}
          aria-label="Copy wallet address"
          className="truncate rounded-md border border-[#F1E2D1]/45 px-3 py-2 text-sm font-medium transition-colors hover:bg-[#F1E2D1]/15 focus:outline-none focus:ring-2 focus:ring-[#F1E2D1]"
        >
          {copied ? "Copied!" : formatAddress(address)}
        </button>
        <button
          type="button"
          onClick={onDisconnect}
          className="hidden h-10 rounded-md border border-[#F1E2D1]/60 px-4 text-sm font-semibold transition-colors hover:bg-[#F1E2D1] hover:text-[#810B38] focus:outline-none focus:ring-2 focus:ring-[#F1E2D1] sm:inline-flex sm:items-center"
        >
          Disconnect
        </button>
      </div>
    </nav>
  );
}
