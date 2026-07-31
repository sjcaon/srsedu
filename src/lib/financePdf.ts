import jsPDF from 'jspdf';
import { formatBDT, monthLabel, num } from './finance';

const SCHOOL_NAME = 'SRS Academic Coaching';
const SCHOOL_TAGLINE = 'Management System · Bangladesh';

function header(doc: jsPDF, title: string) {
  doc.setFillColor(30, 41, 82);
  doc.rect(0, 0, 210, 30, 'F');

  doc.setFillColor(99, 102, 241);
  doc.circle(20, 15, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('SRS', 20, 16.5, { align: 'center' });

  doc.setFontSize(15);
  doc.text(SCHOOL_NAME, 33, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(SCHOOL_TAGLINE, 33, 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(title, 190, 17, { align: 'right' });
  doc.setTextColor(20, 20, 20);
}

function metaRows(doc: jsPDF, rows: [string, string][], startY: number) {
  let y = startY;
  doc.setFontSize(10);
  rows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '—', 60, y);
    y += 6;
  });
  return y;
}

function breakdown(doc: jsPDF, title: string, entries: [string, number][], startY: number) {
  let y = startY;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(title, 14, y);
  y += 3;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, 196, y);
  y += 6;
  doc.setFontSize(10);
  entries.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.text(label, 16, y);
    doc.text(formatBDT(value), 194, y, { align: 'right' });
    y += 6;
  });
  return y;
}

function totalLine(doc: jsPDF, label: string, value: number, y: number) {
  doc.setFillColor(240, 242, 250);
  doc.rect(14, y - 5, 182, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(label, 16, y + 1.5);
  doc.text(formatBDT(value), 194, y + 1.5, { align: 'right' });
  return y + 14;
}

function footer(doc: jsPDF) {
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Computer generated document · ${new Date().toLocaleString('en-GB')} · ${SCHOOL_NAME}`,
    105,
    288,
    { align: 'center' },
  );
}

export function downloadFeeReceipt(payment: any, invoice: any, student: any) {
  const doc = new jsPDF();
  header(doc, 'FEE RECEIPT');

  let y = metaRows(doc, [
    ['Receipt No', payment.receipt_no],
    ['Invoice No', invoice?.invoice_no ?? '—'],
    ['Payment Date', payment.payment_date],
    ['Student', student?.full_name ?? '—'],
    ['Student ID', student?.roll_number ?? '—'],
    ['Class / Section', `${student?.current_class ?? '—'} ${student?.section ? `· ${student.section}` : ''}`],
    ['Billing Month', invoice?.billing_month ? monthLabel(invoice.billing_month) : '—'],
    ['Method', String(payment.method ?? '').toUpperCase()],
    ['Reference', payment.reference_no ?? '—'],
  ], 42);

  y += 6;
  const components = (invoice?.components ?? {}) as Record<string, number>;
  const entries = Object.entries(components)
    .filter(([, value]) => num(value) > 0)
    .map(([key, value]) => [key.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()), num(value)] as [string, number]);

  y = breakdown(doc, 'Invoice Breakdown', entries.length ? entries : [['No fee components', 0]], y);
  y += 2;

  y = breakdown(doc, 'Adjustments', [
    ['Discount / Scholarship', -num(invoice?.discount_amount)],
    ['Previous Arrears', num(invoice?.arrears)],
    ['Advance Applied', -num(invoice?.advance_applied)],
    ['Late Fee', num(invoice?.late_fee)],
  ], y + 4);

  y = totalLine(doc, 'Total Payable', num(invoice?.total_payable), y + 8);
  y = totalLine(doc, 'Amount Paid (this receipt)', num(payment.amount), y);
  y = totalLine(doc, 'Total Paid to Date', num(invoice?.amount_paid), y);
  totalLine(doc, 'Balance Due', Math.max(num(invoice?.total_payable) - num(invoice?.amount_paid), 0), y);

  footer(doc);
  doc.save(`${payment.receipt_no}.pdf`);
}

export function downloadPayslip(payslip: any, teacher: any) {
  const doc = new jsPDF();
  header(doc, 'SALARY PAYSLIP');

  let y = metaRows(doc, [
    ['Payslip No', payslip.payslip_no],
    ['Salary Month', monthLabel(payslip.salary_month)],
    ['Teacher', teacher?.full_name ?? '—'],
    ['Employee ID', teacher?.nid ?? '—'],
    ['Department', teacher?.department ?? '—'],
    ['Status', String(payslip.status ?? '').toUpperCase()],
    ['Payment Method', payslip.method ? String(payslip.method).toUpperCase() : '—'],
    ['Paid On', payslip.paid_on ?? '—'],
  ], 42);

  const toEntries = (source: Record<string, number>) =>
    Object.entries(source ?? {}).map(([key, value]) =>
      [key.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()), num(value)] as [string, number]);

  y = breakdown(doc, 'Earnings', toEntries(payslip.earnings), y + 6);
  y = totalLine(doc, 'Gross Earnings', num(payslip.gross_earnings), y + 4);
  y = breakdown(doc, 'Deductions', toEntries(payslip.deductions), y);
  y = totalLine(doc, 'Total Deductions', num(payslip.total_deductions), y + 4);
  totalLine(doc, 'Net Salary Payable', num(payslip.net_salary), y);

  footer(doc);
  doc.save(`${payslip.payslip_no}.pdf`);
}
