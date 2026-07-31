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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Settings2, Wand2, FileText, BadgeCheck } from 'lucide-react';
import {
  SALARY_EARNINGS, SALARY_DEDUCTIONS, SALARY_METHODS, computeSalaryTotals,
  currentMonthISO, formatBDT, monthLabel, monthToDate, num,
} from '@/lib/finance';
import { downloadPayslip } from '@/lib/financePdf';

type Teacher = { id: string; full_name: string; nid: string | null; department: string | null; subject: string | null };

const emptySalary: Record<string, string> = {
  basic_salary: '', house_rent: '', medical: '', transport: '', festival_bonus: '', overtime: '', seniority_allowance: '',
  provident_fund: '', tax: '', loan_installment: '', absence_deduction: '',
};

export default function SalariesPage() {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [month, setMonth] = useState(currentMonthISO());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profileDialog, setProfileDialog] = useState(false);
  const [activeTeacher, setActiveTeacher] = useState<Teacher | null>(null);
  const [form, setForm] = useState<Record<string, string>>({ ...emptySalary });

  const [payDialog, setPayDialog] = useState(false);
  const [activePayslip, setActivePayslip] = useState<any | null>(null);
  const [payForm, setPayForm] = useState({ method: 'bank', paid_on: new Date().toISOString().split('T')[0] });

  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers]);
  const profileMap = useMemo(() => new Map(profiles.map((p) => [p.teacher_id, p])), [profiles]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [tc, sp, ps] = await Promise.all([
      supabase.from('teachers').select('id, full_name, nid, department, subject').order('full_name'),
      supabase.from('teacher_salary_profiles').select('*'),
      supabase.from('teacher_payslips').select('*').eq('salary_month', monthToDate(month)).order('created_at'),
    ]);

    const firstError = tc.error ?? sp.error ?? ps.error;
    if (firstError) toast({ title: 'Error', description: firstError.message, variant: 'destructive' });

    setTeachers((tc.data ?? []) as Teacher[]);
    setProfiles(sp.data ?? []);
    setPayslips(ps.data ?? []);
    setLoading(false);
  }, [month, toast]);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const openProfile = (teacher: Teacher) => {
    const existing = profileMap.get(teacher.id);
    setActiveTeacher(teacher);
    setForm(
      existing
        ? (Object.fromEntries(Object.keys(emptySalary).map((k) => [k, existing[k] === null ? '' : String(existing[k])])) as Record<string, string>)
        : { ...emptySalary },
    );
    setProfileDialog(true);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeacher) return;
    setSaving(true);
    const payload: Record<string, unknown> = { teacher_id: activeTeacher.id };
    Object.entries(form).forEach(([k, v]) => { payload[k] = num(v); });

    const { error } = await supabase.from('teacher_salary_profiles').upsert(payload as never, { onConflict: 'teacher_id' });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Salary profile saved' });
      setProfileDialog(false);
      await fetchAll();
    }
    setSaving(false);
  };

  const generatePayslips = async () => {
    setSaving(true);
    const { data, error } = await supabase.rpc('generate_monthly_payslips', { _month: monthToDate(month) });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      const result = Array.isArray(data) ? data[0] : null;
      toast({ title: 'Payslips generated', description: `${result?.created_count ?? 0} created · ${result?.skipped_count ?? 0} already existed` });
      await fetchAll();
    }
    setSaving(false);
  };

  const disburse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePayslip) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('teacher_payslips')
      .update({ status: 'paid', method: payForm.method, paid_on: payForm.paid_on })
      .eq('id', activePayslip.id)
      .select('*')
      .single();

    if (error || !data) {
      toast({ title: 'Error', description: error?.message ?? 'Disbursement failed', variant: 'destructive' });
      setSaving(false);
      return;
    }

    toast({ title: 'Salary disbursed', description: `Logged to ledger · ${data.payslip_no}` });
    downloadPayslip(data, teacherMap.get(activePayslip.teacher_id));
    setPayDialog(false);
    setSaving(false);
    await fetchAll();
  };

  const preview = computeSalaryTotals(form);
  const totalNet = payslips.reduce((s, p) => s + num(p.net_salary), 0);
  const paidNet = payslips.filter((p) => p.status === 'paid').reduce((s, p) => s + num(p.net_salary), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Teacher Salaries</h1>
          <p className="text-sm text-muted-foreground">Salary profiles, monthly payslips and disbursements</p>
        </div>
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Salary month</Label>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-[160px]" />
          </div>
          <Button onClick={generatePayslips} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Generate Payslips
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Payroll · {monthLabel(month)}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatBDT(totalNet)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Disbursed</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-emerald-600">{formatBDT(paidNet)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-amber-600">{formatBDT(Math.max(totalNet - paidNet, 0))}</p></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payslips">
        <TabsList>
          <TabsTrigger value="payslips">Payslips</TabsTrigger>
          <TabsTrigger value="profiles">Salary Profiles</TabsTrigger>
        </TabsList>

        <TabsContent value="payslips" className="mt-4">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : payslips.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">No payslips for {monthLabel(month)} — set up salary profiles then generate payslips.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payslip</TableHead><TableHead>Teacher</TableHead><TableHead>Gross</TableHead>
                      <TableHead>Deductions</TableHead><TableHead>Net</TableHead><TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payslips.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.payslip_no}</TableCell>
                        <TableCell className="font-medium">{teacherMap.get(p.teacher_id)?.full_name ?? '—'}</TableCell>
                        <TableCell>{formatBDT(p.gross_earnings)}</TableCell>
                        <TableCell>{formatBDT(p.total_deductions)}</TableCell>
                        <TableCell className="font-semibold">{formatBDT(p.net_salary)}</TableCell>
                        <TableCell><Badge variant={p.status === 'paid' ? 'default' : 'secondary'}>{p.status}</Badge></TableCell>
                        <TableCell className="text-right space-x-1">
                          {p.status !== 'paid' && (
                            <Button size="sm" variant="outline" onClick={() => {
                              setActivePayslip(p);
                              setPayForm({ method: 'bank', paid_on: new Date().toISOString().split('T')[0] });
                              setPayDialog(true);
                            }}>
                              <BadgeCheck className="mr-2 h-3.5 w-3.5" /> Disburse
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => downloadPayslip(p, teacherMap.get(p.teacher_id))}>
                            <FileText className="mr-2 h-3.5 w-3.5" /> PDF
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
              ) : teachers.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">No teachers yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead><TableHead>Department</TableHead><TableHead>Gross</TableHead>
                      <TableHead>Deductions</TableHead><TableHead>Net Salary</TableHead><TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachers.map((t) => {
                      const p = profileMap.get(t.id);
                      const totals = p ? computeSalaryTotals(p) : null;
                      return (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">
                            {t.full_name}
                            <span className="block text-xs text-muted-foreground">{t.nid}</span>
                          </TableCell>
                          <TableCell>{t.department ?? t.subject ?? '—'}</TableCell>
                          <TableCell>{totals ? formatBDT(totals.gross) : <span className="text-muted-foreground">Not set</span>}</TableCell>
                          <TableCell>{totals ? formatBDT(totals.deductions) : '—'}</TableCell>
                          <TableCell className="font-semibold">{totals ? formatBDT(totals.net) : '—'}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={() => openProfile(t)}>
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
      </Tabs>

      <Dialog open={profileDialog} onOpenChange={setProfileDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Salary Profile — {activeTeacher?.full_name}</DialogTitle></DialogHeader>
          <form onSubmit={saveProfile} className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-semibold">Earnings</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {SALARY_EARNINGS.map((c) => (
                  <div key={c.key} className="space-y-1.5">
                    <Label className="text-xs">{c.label}</Label>
                    <Input type="number" min="0" step="0.01" value={form[c.key]}
                      onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.value }))} placeholder="0" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Deductions</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {SALARY_DEDUCTIONS.map((c) => (
                  <div key={c.key} className="space-y-1.5">
                    <Label className="text-xs">{c.label}</Label>
                    <Input type="number" min="0" step="0.01" value={form[c.key]}
                      onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.value }))} placeholder="0" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-1">
              <div className="flex justify-between"><span>Gross earnings</span><span>{formatBDT(preview.gross)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Total deductions</span><span>- {formatBDT(preview.deductions)}</span></div>
              <div className="flex justify-between border-t pt-1 text-base font-semibold"><span>Net salary</span><span>{formatBDT(preview.net)}</span></div>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Salary Profile
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={payDialog} onOpenChange={setPayDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Disburse Salary — {activePayslip?.payslip_no}</DialogTitle></DialogHeader>
          <form onSubmit={disburse} className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <div className="flex justify-between"><span>Net payable</span><span className="font-semibold">{formatBDT(activePayslip?.net_salary)}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Method *</Label>
                <Select value={payForm.method} onValueChange={(v) => setPayForm((f) => ({ ...f, method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SALARY_METHODS.map((m) => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Paid on</Label>
                <Input type="date" value={payForm.paid_on} onChange={(e) => setPayForm((f) => ({ ...f, paid_on: e.target.value }))} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Disburse &amp; Download Payslip
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
