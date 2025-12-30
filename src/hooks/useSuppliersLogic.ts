import { useCallback, useEffect, useMemo, useState } from 'react';
import { Account, AccountLevel, AccountType } from '../types/accounts.types';
import { useAccounts } from './useAccountsLogic';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4100';

export interface SupplierAccount {
  id: string;
  name: string;
  balance: number;
  glAccountId: string;
  glCode: string;
  isActive: boolean;
  commercialRecord?: string;
  taxCard?: string;
  bankAccountNumber?: string;
  iban?: string;
  bankName?: string;
  address?: string;
  contactNumbers?: string;
  hasPreviousBalance: boolean;
}

export const useSuppliersLogic = () => {
  const { accounts, addAccount, getNextCode, findByCode } = useAccounts();
  const storeCtx = (typeof window !== 'undefined' && (window as any).store) || null;
  const schoolCode = useMemo(() => {
    const activeSchool = storeCtx?.activeSchool;
    return (
      activeSchool?.School_Code ||
      activeSchool?.Code ||
      activeSchool?.ID ||
      activeSchool?.id ||
      'DEFAULT'
    ).toString();
  }, [storeCtx]);
  const [suppliers, setSuppliers] = useState<SupplierAccount[]>([]);

  useEffect(() => {
    if (!schoolCode) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/finance/suppliers/${encodeURIComponent(schoolCode)}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && Array.isArray(data)) setSuppliers(data as SupplierAccount[]);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [schoolCode]);

  useEffect(() => {
    if (!schoolCode) return;
    (async () => {
      try {
        await fetch(`${API_BASE}/finance/suppliers/${encodeURIComponent(schoolCode)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(suppliers || [])
        });
      } catch {
        /* ignore */
      }
    })();
  }, [suppliers, schoolCode]);

  const ensureSuppliersFolder = useCallback((): Account => {
    const liabilitiesRoot = findByCode('2');
    if (!liabilitiesRoot) {
      throw new Error('حساب الخصوم غير موجود في دليل الحسابات.');
    }
    const existing = accounts.find(
      (account) => account.parentId === liabilitiesRoot.id && account.name.trim() === 'موردون'
    );
    if (existing) return existing;

    const folderId = crypto.randomUUID ? crypto.randomUUID() : `ACC-${Date.now()}`;
    const folder: Account = {
      id: folderId,
      code: getNextCode(liabilitiesRoot.id),
      name: 'موردون',
      type: AccountType.LIABILITY,
      level: Math.min(liabilitiesRoot.level + 1, AccountLevel.BRANCH),
      parentId: liabilitiesRoot.id,
      isMain: true,
      balance: 0
    };
    addAccount(folder);
    return folder;
  }, [accounts, addAccount, findByCode, getNextCode]);

  const addSupplierAccount = useCallback(
    (payload: {
      name: string;
      balance: number;
      isActive?: boolean;
      commercialRecord?: string;
      taxCard?: string;
      bankAccountNumber?: string;
      iban?: string;
      bankName?: string;
      address?: string;
      contactNumbers?: string;
      hasPreviousBalance: boolean;
    }) => {
      const parent = ensureSuppliersFolder();
      const glCode = getNextCode(parent.id);
      if (!glCode) {
        throw new Error('تعذر توليد كود الحساب للمورد.');
      }
      const glId = crypto.randomUUID ? crypto.randomUUID() : `GL-${Date.now()}`;
      addAccount({
        id: glId,
        code: glCode,
        name: payload.name,
        type: AccountType.LIABILITY,
        level: Math.min(parent.level + 1, AccountLevel.LEAF),
        parentId: parent.id,
        isMain: false,
        balance: payload.balance
      });

      const entry: SupplierAccount = {
        id: crypto.randomUUID ? crypto.randomUUID() : `SUP-${Date.now()}`,
        name: payload.name,
        balance: payload.balance,
        glAccountId: glId,
        glCode,
        isActive: payload.isActive ?? true,
        commercialRecord: payload.commercialRecord,
        taxCard: payload.taxCard,
        bankAccountNumber: payload.bankAccountNumber,
        iban: payload.iban,
        bankName: payload.bankName,
        address: payload.address,
        contactNumbers: payload.contactNumbers,
        hasPreviousBalance: payload.hasPreviousBalance
      };
      setSuppliers((prev) => [...prev, entry]);
      return entry;
    },
    [addAccount, ensureSuppliersFolder, getNextCode]
  );

  return {
    suppliers,
    addSupplierAccount
  };
};
