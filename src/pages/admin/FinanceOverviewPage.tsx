import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import {
  BarChart, Bar, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { categoryLabel, currentMonthISO, formatBDT, monthLabel, monthToDate, num } from '@/lib/finance';

const PIE_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

export default function FinanceOverviewPage() {
  const { toast } = useToast();
  const [month, setMonth] = useState(currentMonthISO());
  const [summary, setSummary] = useState<any | null>(null);
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [sm, bd, tr, lg] = await Promise.all([
      supabase.rpc('finance_summary', { _month: monthToDate(month) }),
      supabase.rpc('expense_breakdown', { _month: monthToDate(month) }),
      supabase.rpc('finance_trend', { _months: 12 }),
      supabase.from('finance_ledger').select('*').order('entry_date', { ascending: false }).limit(25),
    ]);

    const firstError = sm.error ?? bd.error ?? tr.error ?? lg.error;
    if (firstError) toast({ title: 'Error', description: firstError.message, variant: 'destructive' });

    setSummary(Array.isArray(sm.data) ? sm.data[0] : null);
    setBreakdown((bd.data ?? []).map((row: any) => ({ name: categoryLabel(row.category), value: num(row.total) })));
    setTrend((tr.data ?? []).map((row: any) => ({
      month: monthLabel(row.month), income: num(row.income), expense: num(row.expense),
    })));
    setLedger(lg.data ?? []);
    setLoading(false);
  }, [month, toast]);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  if (loading) {
    return <div className="flex justify-center p-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const billed = num(summary?.fees_billed);
  const collected = num(summary?.fees_collected);
  const collectedPct = billed > 0 ? Math.round((collected / billed) * 100) : 0;
  const net = num(summary?.net_balance);
  const profit = net >= 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Finance Ledger</h1>
          <p className="text-sm text-muted-foreground">Income, expenses and net balance across the institution</p>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Month</Label>
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-[160px]" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Fees Collected</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-bold text-emerald-600">{formatBDT(collected)}</p>
            <Progress value={collectedPct} />
            <p className="text-xs text-muted-foreground">{collectedPct}% collected · {formatBDT(num(summary?.fees_due))} due</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Salaries Paid</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(summary?.salaries_paid)}</p>
            <p className="text-xs text-muted-foreground">{formatBDT(summary?.salaries_pending)} pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Other Expenses</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBDT(summary?.other_expenses)}</p>
            <p className="text-xs text-muted-foreground">Total expense {formatBDT(summary?.total_expense)}</p>
          </CardContent>
        </Card>
        <Card className={profit ? 'border-emerald-500/50' : 'border-destructive/50'}>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Net Balance</CardTitle></CardHeader>
          <CardContent>
            <p className={`flex items-center gap-2 text-2xl font-bold ${profit ? 'text-emerald-600' : 'text-destructive'}`}>
              {profit ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              {formatBDT(net)}
            </p>
            <p className="text-xs text-muted-foreground">{profit ? 'Surplus' : 'Deficit'} for {monthLabel(month)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Expense Breakdown</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            {breakdown.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No expenses this month</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={breakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                    {breakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatBDT(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader><CardTitle className="text-base">Income vs Expense · Last 12 Months</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => formatBDT(v)} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Net Trend</CardTitle></CardHeader>
        <CardContent className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend.map((t) => ({ month: t.month, net: t.income - t.expense }))}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(v: number) => formatBDT(v)} />
              <Line type="monotone" dataKey="net" name="Net" stroke="#4f46e5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Ledger Entries</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {ledger.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">Ledger is empty</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {ledger.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.entry_date}</TableCell>
                    <TableCell>
                      <Badge variant={l.entry_type === 'income' ? 'default' : 'destructive'}>{l.entry_type}</Badge>
                    </TableCell>
                    <TableCell>{categoryLabel(l.category)}</TableCell>
                    <TableCell className="max-w-[320px] truncate">{l.description ?? '—'}</TableCell>
                    <TableCell className={`text-right font-medium ${l.entry_type === 'income' ? 'text-emerald-600' : 'text-destructive'}`}>
                      {l.entry_type === 'income' ? '+' : '-'} {formatBDT(l.amount)}
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
