import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Teacher = {
  id: string;
  full_name: string;
  parents_names: string | null;
  dob: string | null;
  gender: string | null;
  nid: string | null;
  mobile: string | null;
  email: string | null;
  address: string | null;
  qualification: string | null;
  subject: string | null;
  salary: number | null;
  joining_date: string | null;
};

const emptyForm = {
  full_name: '', parents_names: '', dob: '', gender: '', nid: '',
  mobile: '', email: '', address: '', qualification: '', subject: '',
  salary: '', joining_date: '',
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchTeachers = async () => {
    setLoading(true);
    const { data } = await supabase.from('teachers').select('*').order('created_at', { ascending: false });
    setTeachers(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchTeachers(); }, []);

  const handleChange = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      full_name: form.full_name,
      parents_names: form.parents_names || null,
      dob: form.dob || null,
      gender: form.gender || null,
      nid: form.nid || null,
      mobile: form.mobile || null,
      email: form.email || null,
      address: form.address || null,
      qualification: form.qualification || null,
      subject: form.subject || null,
      salary: form.salary ? Number(form.salary) : null,
      joining_date: form.joining_date || null,
    };

    let error;
    if (editId) {
      ({ error } = await supabase.from('teachers').update(payload).eq('id', editId));
    } else {
      ({ error } = await supabase.from('teachers').insert([payload]));
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editId ? 'Teacher updated!' : 'Teacher added!' });
      setDialogOpen(false);
      setForm(emptyForm);
      setEditId(null);
      fetchTeachers();
    }
    setSaving(false);
  };

  const handleEdit = (t: Teacher) => {
    setForm({
      full_name: t.full_name,
      parents_names: t.parents_names ?? '',
      dob: t.dob ?? '',
      gender: t.gender ?? '',
      nid: t.nid ?? '',
      mobile: t.mobile ?? '',
      email: t.email ?? '',
      address: t.address ?? '',
      qualification: t.qualification ?? '',
      subject: t.subject ?? '',
      salary: t.salary?.toString() ?? '',
      joining_date: t.joining_date ?? '',
    });
    setEditId(t.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('teachers').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Teacher deleted' });
      fetchTeachers();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Teachers</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setForm(emptyForm); setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Teacher</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? 'Edit Teacher' : 'Add Teacher'}</DialogTitle>
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
                <Label>Date of Birth</Label>
                <Input type="date" value={form.dob} onChange={(e) => handleChange('dob', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => handleChange('gender', v)}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>NID</Label>
                <Input value={form.nid} onChange={(e) => handleChange('nid', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Mobile</Label>
                <Input value={form.mobile} onChange={(e) => handleChange('mobile', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Qualification</Label>
                <Input value={form.qualification} onChange={(e) => handleChange('qualification', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={form.subject} onChange={(e) => handleChange('subject', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Salary</Label>
                <Input type="number" value={form.salary} onChange={(e) => handleChange('salary', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Joining Date</Label>
                <Input type="date" value={form.joining_date} onChange={(e) => handleChange('joining_date', e.target.value)} />
              </div>
              <div className="col-span-full">
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editId ? 'Update' : 'Add'} Teacher
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
          ) : teachers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No teachers added yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Qualification</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.full_name}</TableCell>
                      <TableCell>{t.subject}</TableCell>
                      <TableCell>{t.mobile}</TableCell>
                      <TableCell>{t.email}</TableCell>
                      <TableCell>{t.qualification}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
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
