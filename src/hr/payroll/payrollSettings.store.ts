import { PayrollSettings } from './payrollSettings.types';
import { API_BASE_URL } from '../../services/api';
const API_BASE = API_BASE_URL;

export const defaultPayrollSettings: PayrollSettings = {
  insurance: {
    enabled: true,
    employeePercent: 0.11,
    employerPercent: 0.18
  },
  taxes: {
    monthlyExemptionAmount: 3750,
    taxRatePercent: 0,
    brackets: [
      { from: 0, to: 3750, percent: 0 },
      { from: 3751, to: 6000, percent: 2.5 },
      { from: 6001, to: 8000, percent: 10 },
      { from: 8001, to: 12000, percent: 15 },
      { from: 12001, to: 30000, percent: 20 },
      { from: 30001, to: 0, percent: 25 }
    ],
    isTaxEnabled: true,
    applyAfterInsurance: true,
    calculationMethod: 'monthly',
    applyTo: 'all'
  },
  emergencyFund: {
    enabled: false,
    percent: 0
  }
};

export const loadPayrollSettings = async (schoolCode: string): Promise<PayrollSettings> => {
  try {
    const res = await fetch(`${API_BASE}/hr/payroll-settings/${encodeURIComponent(schoolCode || 'DEFAULT')}`);
    if (res.ok) {
      const parsed = (await res.json()) as Partial<PayrollSettings>;
      const merged: PayrollSettings = {
        ...defaultPayrollSettings,
        ...parsed,
        insurance: {
          ...defaultPayrollSettings.insurance,
          ...(parsed?.insurance || {})
        },
        taxes: {
          ...defaultPayrollSettings.taxes,
          ...(parsed?.taxes || {}),
          brackets: parsed?.taxes?.brackets?.length ? parsed.taxes.brackets : defaultPayrollSettings.taxes.brackets
        },
        emergencyFund: {
          ...defaultPayrollSettings.emergencyFund,
          ...(parsed?.emergencyFund || {})
        }
      };
      merged.taxes.applyAfterInsurance = true;
      return merged;
    }
  } catch {
    /* ignore */
  }
  return { ...defaultPayrollSettings };
};

export const savePayrollSettings = async (schoolCode: string, settings: PayrollSettings) => {
  try {
    await fetch(`${API_BASE}/hr/payroll-settings/${encodeURIComponent(schoolCode || 'DEFAULT')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
  } catch {
    /* ignore */
  }
};
