"use client";

import type { Company } from "@/lib/db/types";
import { type ReactNode, useState } from "react";
import { createContext, useContext } from "react";

export interface CompanyProviderProps {
  selectedAccount: Company;
  setSelectedAccount: (account: Company) => void;
  accounts: Company[];
}

const CompanyContext = createContext<CompanyProviderProps | undefined>(
  undefined,
);

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }

  return context;
};

export function CompanyProvider({
  children,
  accounts,
  defaultAccount,
}: {
  children: ReactNode;
  accounts: Company[];
  defaultAccount: Company;
}) {
  if (accounts.length === 0) {
    throw new Error("CompanyProvider must be used with at least one account");
  }

  const [selectedAccount, setSelectedAccount] =
    useState<Company>(defaultAccount);

  return (
    <CompanyContext.Provider
      value={{ selectedAccount, accounts, setSelectedAccount }}
    >
      {children}
    </CompanyContext.Provider>
  );
}
