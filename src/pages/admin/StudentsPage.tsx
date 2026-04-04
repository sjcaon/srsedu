import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, Search, Download } from 'lucide-react';
import { exportToCSV } from '@/lib/csvExport';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const [s, g] = await Promise.all([
      supabase.from('students').select('*').order('created_at', { ascending: false }),
      supabase.from('guardians').select('id, name').order('name'),
    ]);

    if (s.error || g.error) {
      toast({ title: 'Error', description: s.error?.message ?? g.error?.message, variant: 'destructive' });
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

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch = !searchQuery || 
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.mobile?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = filterClass === 'all' || s.current_class === filterClass;
      return matchesSearch && matchesClass;
    });
  }, [students, searchQuery, filterClass]);

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
    let saved: any = null;
    if (editId) {
      const res = await supabase.from('students').update(payload).eq('id', editId).select().single();
      error = res.error;
      saved = res.data;
    } else {
      const res = await supabase.from('students').insert([payload]).select().single();
      error = res.error;
      saved = res.data;
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      const guardianName = saved?.guardian_id
        ? guardians.find((g) => g.id === saved.guardian_id)?.name ?? null
        : null;
      const enriched = { ...saved, guardian_name: guardianName };

      setStudents((current) =>
        editId
          ? current.map((s) => (s.id === enriched.id ? enriched : s))
          : [enriched, ...current]
      );
      toast({ title: editId ? 'Student updated!' : 'Student added!' });
      setDialogOpen(false);
      setForm(emptyForm);
      setEditId(null);
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
      setStudents((current) => current.filter((s) => s.id !== id));
      toast({ title: 'Student deleted' });
    }
  };

  const handleExport = () => {
    exportToCSV(
      filteredStudents.map((s) => ({
        roll_number: s.roll_number,
        full_name: s.full_name,
        class: s.current_class,
        group: s.student_group,
        guardian: s.guardian_name,
        mobile: s.mobile,
        email: s.email,
        address: s.address,
      })),
      'students'
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-display font-bold">Students</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredStudents.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
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
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, roll, or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filteredStudents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {students.length === 0 ? 'No students added yet' : 'No students match your search'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="hidden md:table-cell">Group</TableHead>
                    <TableHead className="hidden md:table-cell">Guardian</TableHead>
                    <TableHead className="hidden sm:table-cell">Mobile</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-sm">{s.roll_number}</TableCell>
                      <TableCell className="font-medium">{s.full_name}</TableCell>
                      <TableCell>{s.current_class}</TableCell>
                      <TableCell className="hidden md:table-cell">{s.student_group}</TableCell>
                      <TableCell className="hidden md:table-cell">{s.guardian_name}</TableCell>
                      <TableCell className="hidden sm:table-cell">{s.mobile}</TableCell>
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
