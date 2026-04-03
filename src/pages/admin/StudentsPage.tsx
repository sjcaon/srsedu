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

const emptyForm = {
  full_name: '', parents_names: '', mobile: '', email: '', address: '',
  current_class: '', student_group: '', admission_date: '', guardian_id: '',
};

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [guardians, setGuardians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const [s, g] = await Promise.all([
      supabase.from('students').select('*').order('created_at', { ascending: false }),
      supabase.from('guardians').select('id, name').order('name'),
    ]);

    if (s.error || g.error) {
      toast({
        title: 'Error',
        description: s.error?.message ?? g.error?.message ?? 'Failed to load students.',
        variant: 'destructive',
      });
      setStudents([]);
      setGuardians([]);
      setLoading(false);
      return;
    }

    const guardiansList = g.data ?? [];
    const guardianMap = new Map(guardiansList.map((guardian) => [guardian.id, guardian.name]));

    setStudents(
      (s.data ?? []).map((student) => ({
        ...student,
        guardian_name: student.guardian_id ? guardianMap.get(student.guardian_id) ?? null : null,
      }))
    );
    setGuardians(guardiansList);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const generateRollNumber = async (currentClass: string) => {
    const { count } = await supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('current_class', currentClass);
    const num = ((count ?? 0) + 1).toString().padStart(3, '0');
    return `${currentClass.replace(/\s/g, '-').toUpperCase()}-${num}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const rollNumber = editId ? undefined : await generateRollNumber(form.current_class);

    const payload: any = {
      full_name: form.full_name,
      parents_names: form.parents_names || null,
      mobile: form.mobile || null,
      email: form.email || null,
      address: form.address || null,
      current_class: form.current_class,
      student_group: form.student_group || null,
      admission_date: form.admission_date || null,
      guardian_id: form.guardian_id || null,
    };
    if (rollNumber) payload.roll_number = rollNumber;

    let error;
    if (editId) {
      ({ error } = await supabase.from('students').update(payload).eq('id', editId));
    } else {
      ({ error } = await supabase.from('students').insert([payload]));
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editId ? 'Student updated!' : 'Student added!' });
      setDialogOpen(false);
      setForm(emptyForm);
      setEditId(null);
      fetchData();
    }
    setSaving(false);
  };

  const handleEdit = (s: any) => {
    setForm({
      full_name: s.full_name,
      parents_names: s.parents_names ?? '',
      mobile: s.mobile ?? '',
      email: s.email ?? '',
      address: s.address ?? '',
      current_class: s.current_class,
      student_group: s.student_group ?? '',
      admission_date: s.admission_date ?? '',
      guardian_id: s.guardian_id ?? '',
    });
    setEditId(s.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Student deleted' });
      fetchData();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Students</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setForm(emptyForm); setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Student</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? 'Edit Student' : 'Add Student'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={form.full_name} onChange={(e) => handleChange('full_name', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Parents' Names</Label>
                <Input value={form.parents_names} onChange={(e) => handleChange('parents_names', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Mobile</Label>
                <Input value={form.mobile} onChange={(e) => handleChange('mobile', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
              </div>
              <div className="space-y-2 col-span-full">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Class *</Label>
                <Select value={form.current_class} onValueChange={(v) => handleChange('current_class', v)}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Group</Label>
                <Select value={form.student_group} onValueChange={(v) => handleChange('student_group', v)}>
                  <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="Commerce">Commerce</SelectItem>
                    <SelectItem value="Arts">Arts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Admission Date</Label>
                <Input type="date" value={form.admission_date} onChange={(e) => handleChange('admission_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Guardian</Label>
                <Select value={form.guardian_id} onValueChange={(v) => handleChange('guardian_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Select guardian" /></SelectTrigger>
                  <SelectContent>
                    {guardians.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-full">
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editId ? 'Update' : 'Add'} Student
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : students.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No students added yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Guardian</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-sm">{s.roll_number}</TableCell>
                      <TableCell className="font-medium">{s.full_name}</TableCell>
                      <TableCell>{s.current_class}</TableCell>
                      <TableCell>{s.student_group}</TableCell>
                      <TableCell>{s.guardian_name}</TableCell>
                      <TableCell>{s.mobile}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
