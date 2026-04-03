import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Loader2, Download } from 'lucide-react';
import { exportToCSV } from '@/lib/csvExport';

const classes = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

export default function FeesPage() {
  const [structures, setStructures] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [structureForm, setStructureForm] = useState({ class: '', fee_type: '', amount: '', due_date: '' });
  const [paymentForm, setPaymentForm] = useState({ student_id: '', fee_id: '', amount_paid: '', payment_date: new Date().toISOString().split('T')[0], status: 'paid' });
  const [structureDialog, setStructureDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const [fs, fp, st] = await Promise.all([
      supabase.from('fee_structures').select('*').order('class').order('fee_type'),
      supabase.from('fee_payments').select('*').order('payment_date', { ascending: false }),
      supabase.from('students').select('id, full_name, roll_number, current_class').order('roll_number'),
    ]);

    if (fs.error || fp.error || st.error) {
      toast({
        title: 'Error',
        description: fs.error?.message ?? fp.error?.message ?? st.error?.message ?? 'Failed to load fee data.',
        variant: 'destructive',
      });
      setStructures([]);
      setPayments([]);
      setStudents([]);
      setLoading(false);
      return;
    }

    const structuresData = fs.data ?? [];
    const studentsData = st.data ?? [];
    const structureMap = new Map(structuresData.map((item) => [item.id, item]));
    const studentMap = new Map(studentsData.map((item) => [item.id, item]));

    setStructures(structuresData);
    setStudents(studentsData);
    setPayments(
      (fp.data ?? []).map((payment) => ({
        ...payment,
        students: studentMap.get(payment.student_id) ?? null,
        fee_structures: structureMap.get(payment.fee_id) ?? null,
      }))
    );
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('fee_structures').insert([{
      class: structureForm.class,
      fee_type: structureForm.fee_type,
      amount: Number(structureForm.amount),
      due_date: structureForm.due_date || null,
    }]);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Fee structure added!' });
      setStructureDialog(false);
      setStructureForm({ class: '', fee_type: '', amount: '', due_date: '' });
      fetchData();
    }
    setSaving(false);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('fee_payments').insert([{
      student_id: paymentForm.student_id,
      fee_id: paymentForm.fee_id,
      amount_paid: Number(paymentForm.amount_paid),
      payment_date: paymentForm.payment_date,
      status: paymentForm.status,
    }]);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Payment recorded!' });
      setPaymentDialog(false);
      setPaymentForm({ student_id: '', fee_id: '', amount_paid: '', payment_date: new Date().toISOString().split('T')[0], status: 'paid' });
      fetchData();
    }
    setSaving(false);
  };

  const deleteStructure = async (id: string) => {
    const { error } = await supabase.from('fee_structures').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Fee structure deleted' }); fetchData(); }
  };

  const exportPayments = () => {
    const data = payments.map((p) => ({
      student: p.students?.full_name,
      roll: p.students?.roll_number,
      fee_type: p.fee_structures?.fee_type,
      class: p.fee_structures?.class,
      amount_paid: p.amount_paid,
      payment_date: p.payment_date,
      status: p.status,
    }));
    exportToCSV(data, 'fee-payments');
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Fee Management</h1>
      <Tabs defaultValue="structures">
        <TabsList className="mb-4">
          <TabsTrigger value="structures">Fee Structures</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="structures">
          <div className="flex justify-end mb-4">
            <Dialog open={structureDialog} onOpenChange={setStructureDialog}>
              <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Fee Structure</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Fee Structure</DialogTitle></DialogHeader>
                <form onSubmit={handleAddStructure} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Class *</Label>
                      <Select value={structureForm.class} onValueChange={(v) => setStructureForm((f) => ({ ...f, class: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Fee Type *</Label><Input value={structureForm.fee_type} onChange={(e) => setStructureForm((f) => ({ ...f, fee_type: e.target.value }))} placeholder="Tuition, Exam, Lab..." required /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Amount *</Label><Input type="number" value={structureForm.amount} onChange={(e) => setStructureForm((f) => ({ ...f, amount: e.target.value }))} required /></div>
                    <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={structureForm.due_date} onChange={(e) => setStructureForm((f) => ({ ...f, due_date: e.target.value }))} /></div>
                  </div>
                  <Button type="submit" className="w-full" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add Structure</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              {loading ? <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : structures.length === 0 ? <p className="text-center text-muted-foreground py-8">No fee structures yet</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Class</TableHead><TableHead>Fee Type</TableHead><TableHead>Amount</TableHead><TableHead>Due Date</TableHead><TableHead className="w-16">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {structures.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.class}</TableCell>
                        <TableCell className="font-medium">{s.fee_type}</TableCell>
                        <TableCell>৳{s.amount}</TableCell>
                        <TableCell>{s.due_date || '—'}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => deleteStructure(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <div className="flex justify-end gap-2 mb-4">
            <Button variant="outline" onClick={exportPayments} disabled={payments.length === 0}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
            <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
              <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Record Payment</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
                <form onSubmit={handleRecordPayment} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Student *</Label>
                    <Select value={paymentForm.student_id} onValueChange={(v) => setPaymentForm((f) => ({ ...f, student_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                      <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.roll_number})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fee *</Label>
                    <Select value={paymentForm.fee_id} onValueChange={(v) => setPaymentForm((f) => ({ ...f, fee_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select fee" /></SelectTrigger>
                      <SelectContent>{structures.map((s) => <SelectItem key={s.id} value={s.id}>{s.fee_type} - {s.class} (৳{s.amount})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Amount Paid *</Label><Input type="number" value={paymentForm.amount_paid} onChange={(e) => setPaymentForm((f) => ({ ...f, amount_paid: e.target.value }))} required /></div>
                    <div className="space-y-2"><Label>Date</Label><Input type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm((f) => ({ ...f, payment_date: e.target.value }))} /></div>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={paymentForm.status} onValueChange={(v) => setPaymentForm((f) => ({ ...f, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Record Payment</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              {loading ? <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : payments.length === 0 ? <p className="text-center text-muted-foreground py-8">No payments recorded yet</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Fee Type</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.students?.full_name}</TableCell>
                        <TableCell>{p.fee_structures?.fee_type}</TableCell>
                        <TableCell>৳{p.amount_paid}</TableCell>
                        <TableCell>{p.payment_date}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === 'paid' ? 'default' : p.status === 'partial' ? 'secondary' : 'destructive'}>
                            {p.status}
                          </Badge>
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
    </div>
  );
}
