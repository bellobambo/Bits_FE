"use client";

import { AnimatePresence, motion } from "framer-motion";
import { type FormEvent, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useRegister } from "@/hooks/useContract";
import {
  getReadableErrorMessage,
  type RegisteredProfile,
  ROLE_IDS,
  ROLE_OPTIONS,
} from "@/components/bits/utils";

type RegisterModalProps = {
  open: boolean;
  onClose: () => void;
  onRegistered: (profile: RegisteredProfile) => void;
};

export function RegisterModal({ open, onClose, onRegistered }: RegisterModalProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [matricNumber, setMatricNumber] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const hasHandledSuccessRef = useRef(false);
  const {
    isRegisterPending,
    isSuccess: isRegisterSuccess,
    registerAsync,
  } = useRegister();

  useEffect(() => {
    if (!isRegisterSuccess || role === "" || hasHandledSuccessRef.current) {
      return;
    }

    hasHandledSuccessRef.current = true;
    toast.success("Registration Successful");
    onRegistered({
      matricNumber,
      name,
      role: Number(role),
      schoolName,
    });
    onClose();
  }, [
    isRegisterSuccess,
    matricNumber,
    name,
    onClose,
    onRegistered,
    role,
    schoolName,
  ]);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (role === "") {
      return;
    }

    try {
      hasHandledSuccessRef.current = false;
      await registerAsync(
        name.trim(),
        Number(role),
        Number(role) === ROLE_IDS.student ? matricNumber.trim() : "",
        Number(role) === ROLE_IDS.student ? schoolName.trim() : "",
      );
    } catch (error) {
      toast.error(getReadableErrorMessage(error));
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/35 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="register-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-lg rounded-2xl bg-[#F1E2D1] p-6 text-[#810B38] shadow-2xl"
          >
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 id="register-title" className="text-xl font-bold">
            Register
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close register modal"
            className="flex h-9 w-9 items-center justify-center rounded-md text-4xl font-medium leading-none text-[#810B38] transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#810B38]"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Full name</span>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-11 w-full rounded-md border border-[#810B38]/35 bg-white/55 px-3 text-sm outline-none transition focus:border-[#810B38] focus:ring-2 focus:ring-[#810B38]/25"
              placeholder="Jane Doe"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Role</span>
            <select
              required
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="h-11 w-full rounded-md border border-[#810B38]/35 bg-white/55 px-3 text-sm outline-none transition focus:border-[#810B38] focus:ring-2 focus:ring-[#810B38]/25"
            >
              <option value="">Select User Role</option>
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {Number(role) === ROLE_IDS.student ? (
            <>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">
                  Matric number
                </span>
                <input
                  required
                  value={matricNumber}
                  onChange={(event) => setMatricNumber(event.target.value)}
                  className="h-11 w-full rounded-md border border-[#810B38]/35 bg-white/55 px-3 text-sm outline-none transition focus:border-[#810B38] focus:ring-2 focus:ring-[#810B38]/25"
                  placeholder="BITS/2026/001"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">School name</span>
                <input
                  required
                  value={schoolName}
                  onChange={(event) => setSchoolName(event.target.value)}
                  className="h-11 w-full rounded-md border border-[#810B38]/35 bg-white/55 px-3 text-sm outline-none transition focus:border-[#810B38] focus:ring-2 focus:ring-[#810B38]/25"
                  placeholder="University of Bits"
                />
              </label>
            </>
          ) : null}

          <button
            type="submit"
            disabled={isRegisterPending}
            className="h-11 w-full rounded-md bg-[#810B38] px-4 text-sm font-bold text-[#F1E2D1] transition-colors hover:bg-[#6d092f] focus:outline-none focus:ring-2 focus:ring-[#810B38] focus:ring-offset-2 focus:ring-offset-[#F1E2D1] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Register
          </button>
        </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
