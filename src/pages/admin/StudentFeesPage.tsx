import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Settings2, Receipt, Wand2, Download, Wallet } from 'lucide-react';
import {
  FEE_COMPONENTS, PAYMENT_METHODS, computeFeeTotals, currentMonthISO,
  formatBDT, monthLabel, monthToDate, num,
} from '@/lib/finance';
import { downloadFeeReceipt } from '@/lib/financePdf';
import { exportToCSV } from '@/lib/csvExport';

type Student = { id: string; full_name: string; roll_number: string | null; current_class: string; section: string | null };

const emptyProfile = {
  tuition: '', hostel: '', food: '', transport: '', exam_fee: '', library: '',
  development: '', admission: '', session_charge: '', special_coaching: '',
  discount_type: 'none', discount_value: '', scholarship_note: '',
  manual_override: '', previous_arrears: '', advance_balance: '', late_fee: '',
};

export default function StudentFeesPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(currentMonthISO());
  const [saving, setSaving] = useState(false);

  const [profileDialog, setProfileDialog] = useState(false);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [profileForm, setProfileForm] = useState<Record<string, string>>({ ...emptyProfile });

  const [payDialog, setPayDialog] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<any | null>(null);
  const [payForm, setPayForm] = useState({ amount: '', method: 'cash', reference_no: '', payment_date: new Date().toISOString().split('T')[0] });

  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);
  const profileMap = useMemo(() => new Map(profiles.map((p) => [p.student_id, p])), [profiles]);
  const invoiceMap = useMemo(() => new Map(invoices.map((i) => [i.id, i])), [invoices]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [st, fp, inv, pay] = await Promise.all([
      supabase.from('students').select('id, full_name, roll_number, current_class, section').order('roll_number'),
      supabase.from('student_fee_profiles').select('*'),
      supabase.from('student_invoices').select('*').eq('billing_month', monthToDate(month)).order('created_at'),
      supabase.from('invoice_payments').select('*').order('payment_date', { ascending: false }).limit(300),
    ]);

    const firstError = st.error ?? fp.error ?? inv.error ?? pay.error;
    if (firstError) {
      toast({ title: 'Error', description: firstError.message, variant: 'destructive' });
    }

    setStudents((st.data ?? []) as Student[]);
    setProfiles(fp.data ?? []);
    setInvoices(inv.data ?? []);
    setPayments(pay.data ?? []);
    setLoading(false);
  }, [month, toast]);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const openProfile = (student: Student) => {
    const existing = profileMap.get(student.id);
    setActiveStudent(student);
    setProfileForm(
      existing
        ? Object.fromEntries(
            Object.keys(emptyProfile).map((key) => [
              key,
              existing[key] === null || existing[key] === undefined ? (key === 'discount_type' ? 'none' : '') : String(existing[key]),
            ]),
          ) as Record<string, string>
        : { ...emptyProfile },
    );
    setProfileDialog(true);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) return;
    setSaving(true);

    const payload: Record<string, unknown> = { student_id: activeStudent.id };
    Object.entries(profileForm).forEach(([key, value]) => {
      if (key === 'discount_type') payload[key] = value || 'none';
      else if (key === 'scholarship_note') payload[key] = value || null;
      else if (key === 'manual_override') payload[key] = value === '' ? null : num(value);
      else payload[key] = num(value);
    });

    const { error } = await supabase.from('student_fee_profiles').upsert(payload as never, { onConflict: 'student_id' });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Fee profile saved' });
      setProfileDialog(false);
      await fetchAll();
    }
    setSaving(false);
  };

  const generateInvoices = async () => {
    setSaving(true);
    const { data, error } = await supabase.rpc('generate_monthly_invoices', { _month: monthToDate(month) });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      const result = Array.isArray(data) ? data[0] : null;
      toast({ title: 'Invoices generated', description: `${result?.created_count ?? 0} created · ${result?.skipped_count ?? 0} already existed` });
      await fetchAll();
    }
    setSaving(false);
  };

  const openPayment = (invoice: any) => {
    setActiveInvoice(invoice);
    setPayForm({
      amount: String(Math.max(num(invoice.total_payable) - num(invoice.amount_paid), 0)),
      method: 'cash',
      reference_no: '',
      payment_date: new Date().toISOString().split('T')[0],
    });
    setPayDialog(true);
  };

  const recordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoice) return;
    setSaving(true);

    const { data, error } = await supabase
      .from('invoice_payments')
      .insert({
        invoice_id: activeInvoice.id,
        student_id: activeInvoice.student_id,
        amount: num(payForm.amount),
        method: payForm.method,
        reference_no: payForm.reference_no || null,
        payment_date: payForm.payment_date,
      })
      .select('*')
      .single();

    if (error || !data) {
      toast({ title: 'Error', description: error?.message ?? 'Payment failed', variant: 'destructive' });
      setSaving(false);
      return;
    }

    const { data: refreshed } = await supabase.from('student_invoices').select('*').eq('id', activeInvoice.id).single();
    toast({ title: 'Payment recorded', description: `Receipt ${data.receipt_no}` });
    downloadFeeReceipt(data, refreshed ?? activeInvoice, studentMap.get(activeInvoice.student_id));
    setPayDialog(false);
    setSaving(false);
    await fetchAll();
  };

  const preview = computeFeeTotals(profileForm);
  const billed = invoices.reduce((sum, i) => sum + num(i.total_payable), 0);
  const collected = invoices.reduce((sum, i) => sum + num(i.amount_paid), 0);
  const collectedPct = billed > 0 ? Math.round((collected / billed) * 100) : 0;

  const exportInvoices = () => {
    exportToCSV(
      invoices.map((i) => ({
        invoice_no: i.invoice_no,
        student: studentMap.get(i.student_id)?.full_name ?? '',
        student_id: studentMap.get(i.student_id)?.roll_number ?? '',
        month: i.billing_month,
        total_payable: i.total_payable,
        amount_paid: i.amount_paid,
        status: i.status,
      })),
      `invoices-${month}`,
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Student Fees</h1>
          <p className="text-sm text-muted-foreground">Fee profiles, monthly invoicing, payments and receipts</p>
        </div>
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Billing month</Label>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-[160px]" />
          </div>
          <Button onClick={generateInvoices} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Generate Invoices
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Billed · {monthLabel(month)}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatBDT(billed)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Collected</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-bold text-emerald-600">{formatBDT(collected)}</p>
            <Progress value={collectedPct} />
            <p className="text-xs text-muted-foreground">{collectedPct}% collected</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Due</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-destructive">{formatBDT(Math.max(billed - collected, 0))}</p></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="profiles">Fee Profiles</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-4">
          <div className="mb-3 flex justify-end">
            <Button variant="outline" onClick={exportInvoices} disabled={invoices.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : invoices.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">No invoices for {monthLabel(month)} — set up fee profiles then generate invoices.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead><TableHead>Student</TableHead><TableHead>Payable</TableHead>
                      <TableHead>Paid</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="font-mono text-xs">{i.invoice_no}</TableCell>
                        <TableCell className="font-medium">
                          {studentMap.get(i.student_id)?.full_name ?? '—'}
                          <span className="block text-xs text-muted-foreground">{studentMap.get(i.student_id)?.roll_number}</span>
                        </TableCell>
                        <TableCell>{formatBDT(i.total_payable)}</TableCell>
                        <TableCell>{formatBDT(i.amount_paid)}</TableCell>
                        <TableCell>
                          <Badge variant={i.status === 'paid' ? 'default' : i.status === 'partial' ? 'secondary' : 'destructive'}>{i.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => openPayment(i)} disabled={i.status === 'paid'}>
                            <Wallet className="mr-2 h-3.5 w-3.5" /> Collect
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profiles" className="mt-4">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : students.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">No students yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead>Monthly Payable</TableHead>
                      <TableHead>Discount</TableHead><TableHead>Arrears</TableHead><TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s) => {
                      const p = profileMap.get(s.id);
                      const totals = p ? computeFeeTotals(p) : null;
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">
                            {s.full_name}
                            <span className="block text-xs text-muted-foreground">{s.roll_number}</span>
                          </TableCell>
                          <TableCell>{s.current_class}{s.section ? ` · ${s.section}` : ''}</TableCell>
                          <TableCell>{totals ? formatBDT(totals.payable) : <span className="text-muted-foreground">Not set</span>}</TableCell>
                          <TableCell>{p && p.discount_type !== 'none' ? `${p.discount_type === 'percentage' ? `${p.discount_value}%` : formatBDT(p.discount_value)}` : '—'}</TableCell>
                          <TableCell>{p ? formatBDT(p.previous_arrears) : '—'}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={() => openProfile(s)}>
                              <Settings2 className="mr-2 h-3.5 w-3.5" /> {p ? 'Edit' : 'Set up'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {payments.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">No payments recorded yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt</TableHead><TableHead>Student</TableHead><TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.receipt_no}</TableCell>
                        <TableCell className="font-medium">{studentMap.get(p.student_id)?.full_name ?? '—'}</TableCell>
                        <TableCell>{formatBDT(p.amount)}</TableCell>
                        <TableCell className="uppercase text-xs">{p.method}</TableCell>
                        <TableCell>{p.payment_date}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={async () => {
                            const invoice = invoiceMap.get(p.invoice_id)
                              ?? (await supabase.from('student_invoices').select('*').eq('id', p.invoice_id).single()).data;
                            downloadFeeReceipt(p, invoice, studentMap.get(p.student_id));
                          }}>
                            <Receipt className="mr-2 h-3.5 w-3.5" /> PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fee profile dialog */}
      <Dialog open={profileDialog} onOpenChange={setProfileDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Fee Profile — {activeStudent?.full_name}</DialogTitle></DialogHeader>
          <form onSubmit={saveProfile} className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {FEE_COMPONENTS.map((c) => (
                <div key={c.key} className="space-y-1.5">
                  <Label className="text-xs">{c.label}</Label>
                  <Input type="number" min="0" step="0.01" value={profileForm[c.key] ?? ''}
                    onChange={(e) => setProfileForm((f) => ({ ...f, [c.key]: e.target.value }))} placeholder="0" />
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Discount type</Label>
                <Select value={profileForm.discount_type} onValueChange={(v) => setProfileForm((f) => ({ ...f, discount_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Discount value</Label>
                <Input type="number" min="0" step="0.01" value={profileForm.discount_value}
                  onChange={(e) => setProfileForm((f) => ({ ...f, discount_value: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Scholarship note</Label>
                <Input value={profileForm.scholarship_note}
                  onChange={(e) => setProfileForm((f) => ({ ...f, scholarship_note: e.target.value }))} placeholder="Merit scholarship" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Previous arrears</Label>
                <Input type="number" step="0.01" value={profileForm.previous_arrears}
                  onChange={(e) => setProfileForm((f) => ({ ...f, previous_arrears: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Advance balance</Label>
                <Input type="number" step="0.01" value={profileForm.advance_balance}
                  onChange={(e) => setProfileForm((f) => ({ ...f, advance_balance: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Late fee</Label>
                <Input type="number" step="0.01" value={profileForm.late_fee}
                  onChange={(e) => setProfileForm((f) => ({ ...f, late_fee: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Manual override</Label>
                <Input type="number" step="0.01" value={profileForm.manual_override}
                  onChange={(e) => setProfileForm((f) => ({ ...f, manual_override: e.target.value }))} placeholder="optional" />
              </div>
            </div>

            <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-1">
              <div className="flex justify-between"><span>Gross components</span><span>{formatBDT(preview.gross)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Discount</span><span>- {formatBDT(preview.discount)}</span></div>
              <div className="flex justify-between font-semibold text-base pt-1 border-t">
                <span>Total payable / month</span><span>{formatBDT(preview.payable)}</span>
              </div>
              {preview.override !== null && <p className="text-xs text-muted-foreground">Manual override applied</p>}
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Fee Profile
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment dialog */}
      <Dialog open={payDialog} onOpenChange={setPayDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Collect Payment — {activeInvoice?.invoice_no}</DialogTitle></DialogHeader>
          <form onSubmit={recordPayment} className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <div className="flex justify-between"><span>Total payable</span><span>{formatBDT(activeInvoice?.total_payable)}</span></div>
              <div className="flex justify-between"><span>Already paid</span><span>{formatBDT(activeInvoice?.amount_paid)}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Amount *</Label>
                <Input type="number" min="0.01" step="0.01" value={payForm.amount}
                  onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Method *</Label>
                <Select value={payForm.method} onValueChange={(v) => setPayForm((f) => ({ ...f, method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={payForm.payment_date} onChange={(e) => setPayForm((f) => ({ ...f, payment_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Reference / TrxID</Label>
                <Input value={payForm.reference_no} onChange={(e) => setPayForm((f) => ({ ...f, reference_no: e.target.value }))} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Record Payment &amp; Download Receipt
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
