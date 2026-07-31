export const FEE_COMPONENTS = [
  { key: 'tuition', label: 'Tuition' },
  { key: 'hostel', label: 'Hostel' },
  { key: 'food', label: 'Food' },
  { key: 'transport', label: 'Transport' },
  { key: 'exam_fee', label: 'Exam Fee' },
  { key: 'library', label: 'Library' },
  { key: 'development', label: 'Development' },
  { key: 'admission', label: 'Admission' },
  { key: 'session_charge', label: 'Session Charge' },
  { key: 'special_coaching', label: 'Special Coaching' },
] as const;

export const SALARY_EARNINGS = [
  { key: 'basic_salary', label: 'Basic Salary' },
  { key: 'house_rent', label: 'House Rent' },
  { key: 'medical', label: 'Medical' },
  { key: 'transport', label: 'Transport' },
  { key: 'festival_bonus', label: 'Festival Bonus' },
  { key: 'overtime', label: 'Overtime / Extra Class' },
  { key: 'seniority_allowance', label: 'Seniority Allowance' },
] as const;

export const SALARY_DEDUCTIONS = [
  { key: 'provident_fund', label: 'Provident Fund (PF)' },
  { key: 'tax', label: 'Tax' },
  { key: 'loan_installment', label: 'Loan Installment' },
  { key: 'absence_deduction', label: 'Absence / Late Deduction' },
] as const;

export const EXPENSE_CATEGORIES = [
  { key: 'food_mess', label: 'Food / Mess', hints: 'Groceries, meat, vegetables, gas, cook salary' },
  { key: 'utilities', label: 'Utilities', hints: 'Electricity, water, gas, internet, telephone' },
  { key: 'staff_salaries', label: 'Staff Salaries', hints: 'Non-teaching staff, security, cleaners' },
  { key: 'maintenance', label: 'Maintenance', hints: 'Building, electrical, painting' },
  { key: 'transport', label: 'Transport', hints: 'Fuel, servicing, insurance' },
  { key: 'admin_academic', label: 'Admin / Academic', hints: 'Stationery, printing, office equipment' },
  { key: 'others', label: 'Others', hints: 'Medical, events, sports, marketing, emergency' },
] as const;

export const PAYMENT_METHODS = [
  { key: 'bkash', label: 'bKash' },
  { key: 'nagad', label: 'Nagad' },
  { key: 'bank', label: 'Bank' },
  { key: 'cash', label: 'Cash' },
] as const;

export const SALARY_METHODS = [
  { key: 'bank', label: 'Bank' },
  { key: 'bkash', label: 'bKash' },
  { key: 'nagad', label: 'Nagad' },
  { key: 'cash', label: 'Cash' },
] as const;

export const categoryLabel = (key: string) =>
  EXPENSE_CATEGORIES.find((c) => c.key === key)?.label ??
  key.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

export const num = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatBDT = (value: unknown) =>
  `Tk ${num(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const currentMonthISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const monthToDate = (month: string) => `${month}-01`;

export const monthLabel = (value: string) => {
  const date = new Date(value.length === 7 ? `${value}-01` : value);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

type FeeProfileLike = Record<string, unknown> & { discount_type?: string };

export function computeFeeTotals(profile: FeeProfileLike) {
  const gross = FEE_COMPONENTS.reduce((sum, c) => sum + num(profile[c.key]), 0);
  const discount =
    profile.discount_type === 'percentage'
      ? (gross * num(profile.discount_value)) / 100
      : profile.discount_type === 'fixed'
        ? num(profile.discount_value)
        : 0;
  const base = Math.max(gross - discount, 0) + num(profile.previous_arrears) - num(profile.advance_balance) + num(profile.late_fee);
  const override = profile.manual_override === null || profile.manual_override === undefined || profile.manual_override === ''
    ? null
    : num(profile.manual_override);
  return { gross, discount, payable: Math.max(override ?? base, 0), override };
}

export function computeSalaryTotals(profile: Record<string, unknown>) {
  const gross = SALARY_EARNINGS.reduce((sum, c) => sum + num(profile[c.key]), 0);
  const deductions = SALARY_DEDUCTIONS.reduce((sum, c) => sum + num(profile[c.key]), 0);
  return { gross, deductions, net: Math.max(gross - deductions, 0) };
}
