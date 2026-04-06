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
import { Plus, Pencil, Trash2, Loader2, Search, Download, Eye } from 'lucide-react';
import { exportToCSV } from '@/lib/csvExport';
import { Separator } from '@/components/ui/separator';

const classes = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

const emptyForm = {
  full_name: '', gender: '', dob: '', mobile: '', email: '', address: '',
  current_class: '', student_group: '', admission_date: '',
  guardian_name: '', guardian_relation: '', guardian_phone: '',
  guardian_occupation: '', guardian_address: '',
};

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setStudents([]);
    } else {
      setStudents(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload: any = {
      full_name: form.full_name,
      gender: form.gender || null,
      dob: form.dob || null,
      mobile: form.mobile || null,
      email: form.email || null,
      address: form.address || null,
      current_class: form.current_class,
      student_group: form.student_group || null,
      admission_date: form.admission_date || null,
      guardian_name: form.guardian_name || null,
      guardian_relation: form.guardian_relation || null,
      guardian_phone: form.guardian_phone || null,
      guardian_occupation: form.guardian_occupation || null,
      guardian_address: form.guardian_address || null,
    };

    let error;
    let saved: any = null;
    let createdLoginId: string | null = null;

    if (editId) {
      const res = await supabase.from('students').update(payload).eq('id', editId).select().single();
      error = res.error;
      saved = res.data;
    } else {
      const res = await supabase.functions.invoke('provision-managed-user', {
        body: { type: 'student', payload },
      });
      error = res.error ?? (res.data?.error ? { message: res.data.error } : null);
      saved = res.data?.record;
      createdLoginId = res.data?.loginId ?? null;
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setStudents((current) =>
        editId
          ? current.map((s) => (s.id === saved.id ? saved : s))
          : [saved, ...current]
      );
      toast({
        title: editId ? 'Student updated!' : 'Student account created!',
        description: editId ? undefined : `Student ID: ${createdLoginId} · Default password: 123456`,
      });
      setDialogOpen(false);
      setForm(emptyForm);
      setEditId(null);
    }
    setSaving(false);
  };

  const handleEdit = (s: any) => {
    setForm({
      full_name: s.full_name,
      gender: s.gender ?? '',
      dob: s.dob ?? '',
      mobile: s.mobile ?? '',
      email: s.email ?? '',
      address: s.address ?? '',
      current_class: s.current_class,
      student_group: s.student_group ?? '',
      admission_date: s.admission_date ?? '',
      guardian_name: s.guardian_name ?? '',
      guardian_relation: s.guardian_relation ?? '',
      guardian_phone: s.guardian_phone ?? '',
      guardian_occupation: s.guardian_occupation ?? '',
      guardian_address: s.guardian_address ?? '',
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
        gender: s.gender,
        guardian_name: s.guardian_name,
        guardian_phone: s.guardian_phone,
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
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* ── Student Details ── */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Student Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input value={form.full_name} onChange={(e) => handleChange('full_name', e.target.value)} required />
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
                      <Label>Date of Birth</Label>
                      <Input type="date" value={form.dob} onChange={(e) => handleChange('dob', e.target.value)} />
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
                      <Label>Mobile</Label>
                      <Input value={form.mobile} onChange={(e) => handleChange('mobile', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Admission Date</Label>
                      <Input type="date" value={form.admission_date} onChange={(e) => handleChange('admission_date', e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-full">
                      <Label>Address</Label>
                      <Input value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* ── Guardian Information ── */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Guardian Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Guardian Name</Label>
                      <Input value={form.guardian_name} onChange={(e) => handleChange('guardian_name', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Relationship</Label>
                      <Select value={form.guardian_relation} onValueChange={(v) => handleChange('guardian_relation', v)}>
                        <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Father">Father</SelectItem>
                          <SelectItem value="Mother">Mother</SelectItem>
                          <SelectItem value="Brother">Brother</SelectItem>
                          <SelectItem value="Sister">Sister</SelectItem>
                          <SelectItem value="Uncle">Uncle</SelectItem>
                          <SelectItem value="Aunt">Aunt</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Guardian Phone</Label>
                      <Input value={form.guardian_phone} onChange={(e) => handleChange('guardian_phone', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Occupation</Label>
                      <Input value={form.guardian_occupation} onChange={(e) => handleChange('guardian_occupation', e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-full">
                      <Label>Guardian Address</Label>
                      <Input value={form.guardian_address} onChange={(e) => handleChange('guardian_address', e.target.value)} />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editId ? 'Update' : 'Add'} Student
                </Button>
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
                    <TableHead className="hidden md:table-cell">Guardian</TableHead>
                    <TableHead className="hidden sm:table-cell">Mobile</TableHead>
                    <TableHead className="w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-sm">{s.roll_number}</TableCell>
                      <TableCell className="font-medium">{s.full_name}</TableCell>
                      <TableCell>{s.current_class}</TableCell>
                      <TableCell className="hidden md:table-cell">{s.guardian_name ?? '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{s.mobile}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setViewStudent(s)} title="View details">
                            <Eye className="h-4 w-4" />
                          </Button>
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

      {/* Student Profile View Dialog */}
      <Dialog open={!!viewStudent} onOpenChange={(o) => { if (!o) setViewStudent(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Profile</DialogTitle>
          </DialogHeader>
          {viewStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Student ID:</span><p className="font-mono font-medium">{viewStudent.roll_number}</p></div>
                <div><span className="text-muted-foreground">Full Name:</span><p className="font-medium">{viewStudent.full_name}</p></div>
                <div><span className="text-muted-foreground">Class:</span><p>{viewStudent.current_class}</p></div>
                <div><span className="text-muted-foreground">Group:</span><p>{viewStudent.student_group ?? '—'}</p></div>
                <div><span className="text-muted-foreground">Gender:</span><p>{viewStudent.gender ?? '—'}</p></div>
                <div><span className="text-muted-foreground">DOB:</span><p>{viewStudent.dob ?? '—'}</p></div>
                <div><span className="text-muted-foreground">Mobile:</span><p>{viewStudent.mobile ?? '—'}</p></div>
                <div><span className="text-muted-foreground">Email:</span><p>{viewStudent.email ?? '—'}</p></div>
                <div className="col-span-2"><span className="text-muted-foreground">Address:</span><p>{viewStudent.address ?? '—'}</p></div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold mb-2">Guardian Information</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Name:</span><p className="font-medium">{viewStudent.guardian_name ?? '—'}</p></div>
                  <div><span className="text-muted-foreground">Relationship:</span><p>{viewStudent.guardian_relation ?? '—'}</p></div>
                  <div><span className="text-muted-foreground">Phone:</span><p>{viewStudent.guardian_phone ?? '—'}</p></div>
                  <div><span className="text-muted-foreground">Occupation:</span><p>{viewStudent.guardian_occupation ?? '—'}</p></div>
                  <div className="col-span-2"><span className="text-muted-foreground">Address:</span><p>{viewStudent.guardian_address ?? '—'}</p></div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
