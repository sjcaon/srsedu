import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function GuardianFees() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: guardians } = await supabase.from('guardians').select('id').eq('user_id', user.id);
      if (!guardians?.length) { setLoading(false); return; }
      const { data: students } = await supabase.from('students').select('id, full_name, current_class').in('guardian_id', guardians.map((g) => g.id));
      if (!students?.length) { setLoading(false); return; }

      const [fp, fs] = await Promise.all([
        supabase.from('fee_payments').select('*, fee_structures(fee_type, amount, class)').in('student_id', students.map((s) => s.id)).order('payment_date', { ascending: false }),
        supabase.from('fee_structures').select('*').in('class', students.map((s) => s.current_class)),
      ]);
      setPayments(fp.data ?? []);
      setStructures(fs.data ?? []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Fee Details</h1>

      {structures.length > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Fee Structure</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Class</TableHead><TableHead>Fee Type</TableHead><TableHead>Amount</TableHead><TableHead>Due Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {structures.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.class}</TableCell>
                    <TableCell className="font-medium">{s.fee_type}</TableCell>
                    <TableCell>৳{s.amount}</TableCell>
                    <TableCell>{s.due_date || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payment History</CardTitle>
          <Button variant="outline" size="sm" onClick={() => toast({ title: 'Payment Gateway', description: 'Online payment integration coming soon!' })}>
            Pay Now (Mock)
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {payments.length === 0 ? <p className="text-center text-muted-foreground py-8">No payment records</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Fee Type</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.fee_structures?.fee_type}</TableCell>
                    <TableCell>৳{p.amount_paid}</TableCell>
                    <TableCell>{p.payment_date}</TableCell>
                    <TableCell><Badge variant={p.status === 'paid' ? 'default' : 'destructive'}>{p.status}</Badge></TableCell>
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
