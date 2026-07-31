import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Download } from 'lucide-react';
import { EXPENSE_CATEGORIES, SALARY_METHODS, categoryLabel, currentMonthISO, formatBDT, monthLabel, monthToDate, num } from '@/lib/finance';
import { exportToCSV } from '@/lib/csvExport';

const emptyForm = {
  category: 'utilities', subcategory: '', description: '', amount: '',
  expense_date: new Date().toISOString().split('T')[0], vendor: '', method: 'cash',
};

export default function ExpensesPage() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [month, setMonth] = useState(currentMonthISO());
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const start = monthToDate(month);
    const end = new Date(new Date(`${start}T00:00:00`).setMonth(new Date(`${start}T00:00:00`).getMonth() + 1))
      .toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .gte('expense_date', start)
      .lt('expense_date', end)
      .order('expense_date', { ascending: false });

    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    setExpenses(data ?? []);
    setLoading(false);
  }, [month, toast]);

  useEffect(() => { void fetchExpenses(); }, [fetchExpenses]);

  const visible = useMemo(
    () => (categoryFilter === 'all' ? expenses : expenses.filter((e) => e.category === categoryFilter)),
    [expenses, categoryFilter],
  );

  const total = visible.reduce((sum, e) => sum + num(e.amount), 0);
  const salaryLinked = expenses.filter((e) => e.source === 'salary').reduce((sum, e) => sum + num(e.amount), 0);

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('expenses').insert({
      category: form.category,
      subcategory: form.subcategory || null,
      description: form.description || null,
      amount: num(form.amount),
      expense_date: form.expense_date,
      vendor: form.vendor || null,
      method: form.method,
    });

    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Expense logged', description: 'Automatically posted to the finance ledger' });
      setDialog(false);
      setForm({ ...emptyForm });
      await fetchExpenses();
    }
    setSaving(false);
  };

  const removeExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Expense removed' }); await fetchExpenses(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Institutional Expenses</h1>
          <p className="text-sm text-muted-foreground">Every logged cost posts automatically to the finance ledger</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Month</Label>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-[160px]" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={() => exportToCSV(visible, `expenses-${month}`)} disabled={visible.length === 0}>
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Dialog open={dialog} onOpenChange={setDialog}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Log Expense</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Log Institutional Expense</DialogTitle></DialogHeader>
              <form onSubmit={addExpense} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Category *</Label>
                  <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{EXPENSE_CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {EXPENSE_CATEGORIES.find((c) => c.key === form.category)?.hints}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Sub-category</Label>
                    <Input value={form.subcategory} onChange={(e) => setForm((f) => ({ ...f, subcategory: e.target.value }))} placeholder="Electricity bill" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Amount *</Label>
                    <Input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Date</Label>
                    <Input type="date" value={form.expense_date} onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Method</Label>
                    <Select value={form.method} onValueChange={(v) => setForm((f) => ({ ...f, method: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{SALARY_METHODS.map((m) => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Vendor / Payee</Label>
                  <Input value={form.vendor} onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Log Expense
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total · {monthLabel(month)}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatBDT(total)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Salary-linked</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-indigo-600">{formatBDT(salaryLinked)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Entries</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{visible.length}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : visible.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">No expenses recorded for this period</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead>Details</TableHead>
                  <TableHead>Vendor</TableHead><TableHead>Amount</TableHead><TableHead>Source</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.expense_date}</TableCell>
                    <TableCell>{categoryLabel(e.category)}</TableCell>
                    <TableCell className="font-medium">
                      {e.subcategory ?? '—'}
                      {e.description && <span className="block text-xs text-muted-foreground">{e.description}</span>}
                    </TableCell>
                    <TableCell>{e.vendor ?? '—'}</TableCell>
                    <TableCell>{formatBDT(e.amount)}</TableCell>
                    <TableCell><Badge variant={e.source === 'salary' ? 'secondary' : 'outline'}>{e.source}</Badge></TableCell>
                    <TableCell>
                      {e.source === 'manual' && (
                        <Button variant="ghost" size="icon" onClick={() => removeExpense(e.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
