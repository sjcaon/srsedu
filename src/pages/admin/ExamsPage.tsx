import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

const classes = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

const emptyForm = { exam_name: '', class: '', subject: '', date: '', max_marks: '100', pass_marks: '33' };

export default function ExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchExams = async () => {
    setLoading(true);
    const { data } = await supabase.from('exams').select('*').order('date', { ascending: false });
    setExams(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchExams(); }, []);

  const handleChange = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      exam_name: form.exam_name,
      class: form.class,
      subject: form.subject,
      date: form.date || null,
      max_marks: Number(form.max_marks),
      pass_marks: Number(form.pass_marks),
    };

    let error;
    if (editId) {
      ({ error } = await supabase.from('exams').update(payload).eq('id', editId));
    } else {
      ({ error } = await supabase.from('exams').insert([payload]));
    }

    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: editId ? 'Exam updated!' : 'Exam created!' });
      setDialogOpen(false);
      setForm(emptyForm);
      setEditId(null);
      fetchExams();
    }
    setSaving(false);
  };

  const handleEdit = (e: any) => {
    setForm({
      exam_name: e.exam_name, class: e.class, subject: e.subject,
      date: e.date ?? '', max_marks: e.max_marks?.toString(), pass_marks: e.pass_marks?.toString(),
    });
    setEditId(e.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Exam deleted' }); fetchExams(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Exams</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setForm(emptyForm); setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Create Exam</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? 'Edit Exam' : 'Create Exam'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Exam Name *</Label><Input value={form.exam_name} onChange={(e) => handleChange('exam_name', e.target.value)} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class *</Label>
                  <Select value={form.class} onValueChange={(v) => handleChange('class', v)}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>{classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Subject *</Label><Input value={form.subject} onChange={(e) => handleChange('subject', e.target.value)} required /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => handleChange('date', e.target.value)} /></div>
                <div className="space-y-2"><Label>Max Marks</Label><Input type="number" value={form.max_marks} onChange={(e) => handleChange('max_marks', e.target.value)} /></div>
                <div className="space-y-2"><Label>Pass Marks</Label><Input type="number" value={form.pass_marks} onChange={(e) => handleChange('pass_marks', e.target.value)} /></div>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editId ? 'Update' : 'Create'} Exam
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : exams.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No exams created yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Max/Pass</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.exam_name}</TableCell>
                      <TableCell>{e.class}</TableCell>
                      <TableCell>{e.subject}</TableCell>
                      <TableCell>{e.date}</TableCell>
                      <TableCell>{e.max_marks}/{e.pass_marks}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(e)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
