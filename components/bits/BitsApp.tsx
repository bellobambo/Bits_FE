"use client";

import { motion } from "framer-motion";
import { useCallback, useState } from "react";
import { formatUnits } from "viem";
import { useAccount, useBalance, useConnect, useDisconnect } from "wagmi";
import { AddPropertyModal } from "@/components/bits/AddPropertyModal";
import { AppNavbar } from "@/components/bits/AppNavbar";
import { PropertyList } from "@/components/bits/PropertyList";
import { RegisterModal } from "@/components/bits/RegisterModal";
import {
  getRegisteredUser,
  getRoleLabel,
  MANTLE_SEPOLIA_CHAIN_ID,
  ROLE_IDS,
  type RegisteredProfile,
} from "@/components/bits/utils";
import { useUser } from "@/hooks/useContract";

export function BitsApp() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isPropertyOpen, setIsPropertyOpen] = useState(false);
  const [localProfile, setLocalProfile] = useState<RegisteredProfile | null>(null);
  const { address, isConnected } = useAccount();
  const { data: mntBalance, isLoading: isBalanceLoading } = useBalance({
    address,
    chainId: MANTLE_SEPOLIA_CHAIN_ID,
    query: {
      enabled: Boolean(address),
    },
  });
  const { data: userData, refetch: refetchUser } = useUser(address);
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const preferredConnector = connectors[0];
  const registeredUser = getRegisteredUser(userData);
  const isUserRegistered = Boolean(registeredUser?.registered) || Boolean(localProfile);
  const profileName = registeredUser?.registered
    ? registeredUser.name
    : localProfile?.name;
  const profileRoleNumber =
    registeredUser?.registered ? registeredUser.role : localProfile?.role ?? null;
  const profileRole = profileRoleNumber !== null ? getRoleLabel(profileRoleNumber) : "";
  const studentMatricNumber = registeredUser?.registered
    ? registeredUser.matricNumber
    : localProfile?.matricNumber;
  const studentSchoolName = registeredUser?.registered
    ? registeredUser.schoolName
    : localProfile?.schoolName;
  const isLandlord = profileRoleNumber === ROLE_IDS.landlord;
  const formattedBalance = mntBalance
    ? formatUnits(mntBalance.value, mntBalance.decimals)
    : "0";
  const displayedBalance = mntBalance
    ? `${Number(formattedBalance).toLocaleString(undefined, {
        maximumFractionDigits: 4,
      })} ${mntBalance.symbol}`
    : "0 MNT";

  const handleRegistered = useCallback(
    (profile: RegisteredProfile) => {
      setLocalProfile(profile);
      void refetchUser();
    },
    [refetchUser],
  );

  if (!isConnected) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F1E2D1] px-6 text-[#810B38]">
        <motion.button
          type="button"
          disabled={!preferredConnector || isPending}
          onClick={() => {
            if (preferredConnector) {
              connect({ connector: preferredConnector });
            }
          }}
          className="h-12 min-w-44 cursor-pointer rounded-md bg-[#810B38] px-6 text-base font-semibold text-[#F1E2D1] shadow-sm transition-colors hover:bg-[#6d092f] focus:outline-none focus:ring-2 focus:ring-[#810B38] focus:ring-offset-2 focus:ring-offset-[#F1E2D1] disabled:cursor-not-allowed disabled:opacity-60"
          whileHover={{
            scale: preferredConnector && !isPending ? 1.04 : 1,
            transition: { duration: 0.2 },
          }}
          whileTap={{ scale: 0.95 }}
        >
          {isPending ? "Connecting..." : "Connect Wallet"}
        </motion.button>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1E2D1] text-[#810B38]">
      <AppNavbar
        address={address}
        balanceLabel={displayedBalance}
        isBalanceLoading={isBalanceLoading}
        isUserRegistered={isUserRegistered}
        onDisconnect={() => disconnect()}
        onRegister={() => setIsRegisterOpen(true)}
      />

      {isUserRegistered ? (
        <section className="w-full px-5 py-4 sm:px-8">
          <div className="flex max-w-lg items-center gap-2 text-base font-bold">
            <span>{profileName}</span>
            <span aria-hidden="true">•</span>
            <span>{profileRole}</span>
          </div>

          <div className="mx-auto mt-6 w-full max-w-[92rem]">
            {isLandlord && (
              <button
                type="button"
                onClick={() => setIsPropertyOpen(true)}
                className="h-11 rounded-md bg-[#810B38] px-5 text-sm font-semibold text-[#F1E2D1] transition-colors hover:bg-[#6d092f] focus:outline-none focus:ring-2 focus:ring-[#810B38] focus:ring-offset-2 focus:ring-offset-[#F1E2D1]"
              >
                Add Property
              </button>
            )}

            <PropertyList
              studentMatricNumber={studentMatricNumber}
              studentSchoolName={studentSchoolName}
              userAddress={address}
              userRole={profileRoleNumber ?? undefined}
            />
          </div>
        </section>
      ) : null}

      <RegisterModal
        open={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegistered={handleRegistered}
      />
      <AddPropertyModal
        landlordName={profileName}
        open={isPropertyOpen}
        onClose={() => setIsPropertyOpen(false)}
      />
    </div>
  );
}
