import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { provisionManagedUser } from '@/lib/managedAuth';
import { Plus, Pencil, Trash2, Loader2, Search, Download, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportToCSV } from '@/lib/csvExport';
import { Separator } from '@/components/ui/separator';
import { WizardNav, SectionGrid } from '@/components/forms/FormWizard';
import { FileUploadField } from '@/components/forms/FileUploadField';
import { openDocument } from '@/lib/storageUpload';

const classes = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const emptyForm = {
  // Personal
  full_name: '', full_name_bn: '', photo_url: null as string | null, dob: '', birth_certificate_no: '',
  gender: '', blood_group: '', nationality: 'Bangladeshi', religion: '', mobile: '', email: '',
  // Address
  present_village: '', present_po: '', present_upazila: '', present_district: '',
  permanent_village: '', permanent_po: '', permanent_upazila: '', permanent_district: '',
  // Guardian
  father_name: '', father_profession: '', father_mobile: '', father_nid: '',
  mother_name: '', mother_profession: '', mother_mobile: '', mother_nid: '',
  annual_family_income: '',
  local_guardian_name: '', local_guardian_relation: '', local_guardian_mobile: '',
  // Previous academic
  previous_school_name: '', previous_school_address: '', last_class_passed: '',
  tc_no: '', board_roll_no: '', board_reg_no: '', last_exam_result: '',
  // Admission
  current_class: '', section: '', student_group: '', residential_status: '',
  academic_year: String(new Date().getFullYear()), admission_exam_score: '', admission_date: '',
  // Health
  disease_disability: '', allergies: '', emergency_contact_name: '', emergency_contact_mobile: '',
  // Documents
  birth_certificate_url: null as string | null,
  tc_url: null as string | null,
  marksheet_url: null as string | null,
  guardian_nid_url: null as string | null,
};

type StudentForm = typeof emptyForm;

const steps = [
  { id: 'personal', title: 'Personal' },
  { id: 'address', title: 'Address' },
  { id: 'guardian', title: 'Guardian' },
  { id: 'academic', title: 'Previous Record' },
  { id: 'admission', title: 'Admission' },
  { id: 'health', title: 'Health' },
  { id: 'documents', title: 'Documents' },
];

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [step, setStep] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(error.message);
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

  const set = <K extends keyof StudentForm>(key: K, value: StudentForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const text = (key: keyof StudentForm) => ({
    value: (form[key] as string) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      set(key, e.target.value as StudentForm[typeof key]),
  });

  const resetForm = () => { setForm(emptyForm); setEditId(null); setStep(0); };

  const buildPayload = () => {
    const nullable = (v: string) => (v.trim() === '' ? null : v.trim());
    return {
      full_name: form.full_name.trim(),
      full_name_bn: nullable(form.full_name_bn),
      photo_url: form.photo_url,
      dob: nullable(form.dob),
      birth_certificate_no: nullable(form.birth_certificate_no),
      gender: nullable(form.gender),
      blood_group: nullable(form.blood_group),
      nationality: nullable(form.nationality),
      religion: nullable(form.religion),
      mobile: nullable(form.mobile),
      email: nullable(form.email),
      present_village: nullable(form.present_village),
      present_po: nullable(form.present_po),
      present_upazila: nullable(form.present_upazila),
      present_district: nullable(form.present_district),
      permanent_village: nullable(form.permanent_village),
      permanent_po: nullable(form.permanent_po),
      permanent_upazila: nullable(form.permanent_upazila),
      permanent_district: nullable(form.permanent_district),
      address: [form.present_village, form.present_po, form.present_upazila, form.present_district]
        .filter((p) => p.trim() !== '').join(', ') || null,
      father_name: nullable(form.father_name),
      father_profession: nullable(form.father_profession),
      father_mobile: nullable(form.father_mobile),
      father_nid: nullable(form.father_nid),
      mother_name: nullable(form.mother_name),
      mother_profession: nullable(form.mother_profession),
      mother_mobile: nullable(form.mother_mobile),
      mother_nid: nullable(form.mother_nid),
      annual_family_income: form.annual_family_income ? Number(form.annual_family_income) : null,
      local_guardian_name: nullable(form.local_guardian_name),
      local_guardian_relation: nullable(form.local_guardian_relation),
      local_guardian_mobile: nullable(form.local_guardian_mobile),
      guardian_name: nullable(form.father_name) ?? nullable(form.local_guardian_name),
      guardian_relation: form.father_name.trim() ? 'Father' : nullable(form.local_guardian_relation),
      guardian_phone: nullable(form.father_mobile) ?? nullable(form.local_guardian_mobile),
      guardian_occupation: nullable(form.father_profession),
      previous_school_name: nullable(form.previous_school_name),
      previous_school_address: nullable(form.previous_school_address),
      last_class_passed: nullable(form.last_class_passed),
      tc_no: nullable(form.tc_no),
      board_roll_no: nullable(form.board_roll_no),
      board_reg_no: nullable(form.board_reg_no),
      last_exam_result: nullable(form.last_exam_result),
      current_class: form.current_class,
      section: nullable(form.section),
      student_group: nullable(form.student_group),
      residential_status: nullable(form.residential_status),
      academic_year: nullable(form.academic_year),
      admission_exam_score: nullable(form.admission_exam_score),
      admission_date: nullable(form.admission_date),
      disease_disability: nullable(form.disease_disability),
      allergies: nullable(form.allergies),
      emergency_contact_name: nullable(form.emergency_contact_name),
      emergency_contact_mobile: nullable(form.emergency_contact_mobile),
      birth_certificate_url: form.birth_certificate_url,
      tc_url: form.tc_url,
      marksheet_url: form.marksheet_url,
      guardian_nid_url: form.guardian_nid_url,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.current_class) {
      toast.error('Full Name and Applied Class are required.');
      return;
    }
    setSaving(true);
    const payload = buildPayload();

    try {
      if (editId) {
        const { error } = await supabase.from('students').update(payload as never).eq('id', editId).select().single();
        if (error) throw error;
        toast.success('Student updated successfully');
      } else {
        const result = await provisionManagedUser('student', payload);
        toast.success('Student account created', {
          description: `Student ID: ${result.loginId} · Default password: 123456`,
        });
      }
      setDialogOpen(false);
      resetForm();
      await fetchData();
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not save the student.');
    }
    setSaving(false);
  };

  const handleEdit = (s: any) => {
    const next: StudentForm = { ...emptyForm };
    (Object.keys(emptyForm) as (keyof StudentForm)[]).forEach((key) => {
      const value = s[key];
      if (value === null || value === undefined) return;
      (next as any)[key] = typeof value === 'string' ? value : String(value);
    });
    next.photo_url = s.photo_url ?? null;
    next.birth_certificate_url = s.birth_certificate_url ?? null;
    next.tc_url = s.tc_url ?? null;
    next.marksheet_url = s.marksheet_url ?? null;
    next.guardian_nid_url = s.guardian_nid_url ?? null;
    setForm(next);
    setEditId(s.id);
    setStep(0);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      setStudents((current) => current.filter((s) => s.id !== id));
      toast.success('Student deleted');
    }
  };

  const handleExport = () => {
    exportToCSV(
      filteredStudents.map((s) => ({
        roll_number: s.roll_number,
        full_name: s.full_name,
        class: s.current_class,
        section: s.section,
        group: s.student_group,
        gender: s.gender,
        father_name: s.father_name,
        mother_name: s.mother_name,
        guardian_phone: s.guardian_phone,
        mobile: s.mobile,
        email: s.email,
        address: s.address,
      })),
      'students'
    );
  };

  const isLast = step === steps.length - 1;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-display font-bold">Students</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredStudents.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Add Student</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editId ? 'Edit Student' : 'Student Registration'}</DialogTitle>
              </DialogHeader>

              <WizardNav steps={steps} current={step} onSelect={setStep} />

              <form onSubmit={handleSubmit} className="space-y-5">
                {step === 0 && (
                  <SectionGrid>
                    <div className="space-y-2">
                      <Label>Full Name (English) <span className="text-destructive">*</span></Label>
                      <Input {...text('full_name')} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Full Name (Bengali)</Label>
                      <Input {...text('full_name_bn')} />
                    </div>
                    <FileUploadField
                      label="Photo"
                      folder="students/photos"
                      accept="image/*"
                      value={form.photo_url}
                      onChange={(p) => set('photo_url', p)}
                    />
                    <div className="space-y-2">
                      <Label>Date of Birth <span className="text-destructive">*</span></Label>
                      <Input type="date" {...text('dob')} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Birth Certificate No <span className="text-destructive">*</span></Label>
                      <Input {...text('birth_certificate_no')} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender <span className="text-destructive">*</span></Label>
                      <Select value={form.gender} onValueChange={(v) => set('gender', v)}>
                        <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Blood Group (optional)</Label>
                      <Select value={form.blood_group} onValueChange={(v) => set('blood_group', v)}>
                        <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
                        <SelectContent>
                          {bloodGroups.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Nationality <span className="text-destructive">*</span></Label>
                      <Input {...text('nationality')} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Religion <span className="text-destructive">*</span></Label>
                      <Input {...text('religion')} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Mobile No <span className="text-destructive">*</span></Label>
                      <Input {...text('mobile')} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Email (optional)</Label>
                      <Input type="email" {...text('email')} />
                    </div>
                  </SectionGrid>
                )}

                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="mb-3 text-sm font-semibold">Present Address</h3>
                      <SectionGrid>
                        <div className="space-y-2"><Label>Village / Street <span className="text-destructive">*</span></Label><Input {...text('present_village')} required /></div>
                        <div className="space-y-2"><Label>Post Office <span className="text-destructive">*</span></Label><Input {...text('present_po')} required /></div>
                        <div className="space-y-2"><Label>Upazila <span className="text-destructive">*</span></Label><Input {...text('present_upazila')} required /></div>
                        <div className="space-y-2"><Label>District <span className="text-destructive">*</span></Label><Input {...text('present_district')} required /></div>
                      </SectionGrid>
                    </div>
                    <Separator />
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Permanent Address</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setForm((f) => ({
                            ...f,
                            permanent_village: f.present_village,
                            permanent_po: f.present_po,
                            permanent_upazila: f.present_upazila,
                            permanent_district: f.present_district,
                          }))}
                        >
                          Same as present
                        </Button>
                      </div>
                      <SectionGrid>
                        <div className="space-y-2"><Label>Village / Street</Label><Input {...text('permanent_village')} /></div>
                        <div className="space-y-2"><Label>Post Office</Label><Input {...text('permanent_po')} /></div>
                        <div className="space-y-2"><Label>Upazila</Label><Input {...text('permanent_upazila')} /></div>
                        <div className="space-y-2"><Label>District</Label><Input {...text('permanent_district')} /></div>
                      </SectionGrid>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="mb-3 text-sm font-semibold">Father's Information</h3>
                      <SectionGrid>
                        <div className="space-y-2"><Label>Father's Name <span className="text-destructive">*</span></Label><Input {...text('father_name')} required /></div>
                        <div className="space-y-2"><Label>Profession</Label><Input {...text('father_profession')} /></div>
                        <div className="space-y-2"><Label>Mobile <span className="text-destructive">*</span></Label><Input {...text('father_mobile')} required /></div>
                        <div className="space-y-2"><Label>NID</Label><Input {...text('father_nid')} /></div>
                      </SectionGrid>
                    </div>
                    <Separator />
                    <div>
                      <h3 className="mb-3 text-sm font-semibold">Mother's Information</h3>
                      <SectionGrid>
                        <div className="space-y-2"><Label>Mother's Name <span className="text-destructive">*</span></Label><Input {...text('mother_name')} required /></div>
                        <div className="space-y-2"><Label>Profession</Label><Input {...text('mother_profession')} /></div>
                        <div className="space-y-2"><Label>Mobile</Label><Input {...text('mother_mobile')} /></div>
                        <div className="space-y-2"><Label>NID</Label><Input {...text('mother_nid')} /></div>
                      </SectionGrid>
                    </div>
                    <Separator />
                    <div>
                      <h3 className="mb-3 text-sm font-semibold">Local Guardian</h3>
                      <SectionGrid>
                        <div className="space-y-2"><Label>Name</Label><Input {...text('local_guardian_name')} /></div>
                        <div className="space-y-2"><Label>Relation</Label><Input {...text('local_guardian_relation')} /></div>
                        <div className="space-y-2"><Label>Mobile</Label><Input {...text('local_guardian_mobile')} /></div>
                        <div className="space-y-2"><Label>Annual Family Income (optional)</Label><Input type="number" {...text('annual_family_income')} /></div>
                      </SectionGrid>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <SectionGrid>
                    <div className="space-y-2"><Label>Previous School Name</Label><Input {...text('previous_school_name')} /></div>
                    <div className="space-y-2"><Label>Previous School Address</Label><Input {...text('previous_school_address')} /></div>
                    <div className="space-y-2"><Label>Last Class Passed</Label><Input {...text('last_class_passed')} /></div>
                    <div className="space-y-2"><Label>Transfer Certificate (TC) No</Label><Input {...text('tc_no')} /></div>
                    <div className="space-y-2"><Label>Board Roll No</Label><Input {...text('board_roll_no')} /></div>
                    <div className="space-y-2"><Label>Board Registration No</Label><Input {...text('board_reg_no')} /></div>
                    <div className="space-y-2"><Label>Last Exam Result / GPA</Label><Input {...text('last_exam_result')} /></div>
                  </SectionGrid>
                )}

                {step === 4 && (
                  <SectionGrid>
                    <div className="space-y-2">
                      <Label>Applied Class <span className="text-destructive">*</span></Label>
                      <Select value={form.current_class} onValueChange={(v) => set('current_class', v)}>
                        <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>
                          {classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Section</Label><Input {...text('section')} /></div>
                    <div className="space-y-2">
                      <Label>Group</Label>
                      <Select value={form.student_group} onValueChange={(v) => set('student_group', v)}>
                        <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Science">Science</SelectItem>
                          <SelectItem value="Commerce">Commerce</SelectItem>
                          <SelectItem value="Arts">Arts</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Residential Status <span className="text-destructive">*</span></Label>
                      <Select value={form.residential_status} onValueChange={(v) => set('residential_status', v)}>
                        <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hostel">Hostel</SelectItem>
                          <SelectItem value="Non-residential">Non-residential</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Academic Year <span className="text-destructive">*</span></Label><Input {...text('academic_year')} required /></div>
                    <div className="space-y-2"><Label>Admission Exam Score (optional)</Label><Input {...text('admission_exam_score')} /></div>
                    <div className="space-y-2"><Label>Admission Date</Label><Input type="date" {...text('admission_date')} /></div>
                  </SectionGrid>
                )}

                {step === 5 && (
                  <SectionGrid>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Any specific disease / disability</Label>
                      <Textarea rows={2} {...text('disease_disability')} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Allergies (optional)</Label>
                      <Textarea rows={2} {...text('allergies')} />
                    </div>
                    <div className="space-y-2"><Label>Emergency Contact Name <span className="text-destructive">*</span></Label><Input {...text('emergency_contact_name')} required /></div>
                    <div className="space-y-2"><Label>Emergency Contact Mobile <span className="text-destructive">*</span></Label><Input {...text('emergency_contact_mobile')} required /></div>
                  </SectionGrid>
                )}

                {step === 6 && (
                  <SectionGrid>
                    <FileUploadField label="Birth Certificate Scan" folder="students/documents" value={form.birth_certificate_url} onChange={(p) => set('birth_certificate_url', p)} />
                    <FileUploadField label="Transfer Certificate Scan" folder="students/documents" value={form.tc_url} onChange={(p) => set('tc_url', p)} />
                    <FileUploadField label="Last Marksheet Scan" folder="students/documents" value={form.marksheet_url} onChange={(p) => set('marksheet_url', p)} />
                    <FileUploadField label="Guardian NID Scan" folder="students/documents" value={form.guardian_nid_url} onChange={(p) => set('guardian_nid_url', p)} />
                  </SectionGrid>
                )}

                <Separator />

                <div className="flex items-center justify-between gap-3">
                  <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
                    <ChevronLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                  <span className="text-xs text-muted-foreground">Step {step + 1} of {steps.length}</span>
                  {isLast ? (
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editId ? 'Update Student' : 'Submit Registration'}
                    </Button>
                  ) : (
                    <Button type="button" onClick={() => setStep((s) => s + 1)}>
                      Next <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}
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
                      <TableCell>{s.current_class}{s.section ? ` · ${s.section}` : ''}</TableCell>
                      <TableCell className="hidden md:table-cell">{s.father_name ?? s.guardian_name ?? '—'}</TableCell>
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Profile</DialogTitle>
          </DialogHeader>
          {viewStudent && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Detail label="Student ID" value={viewStudent.roll_number} mono />
                <Detail label="Full Name" value={viewStudent.full_name} />
                <Detail label="Name (Bengali)" value={viewStudent.full_name_bn} />
                <Detail label="Class" value={`${viewStudent.current_class}${viewStudent.section ? ` · ${viewStudent.section}` : ''}`} />
                <Detail label="Group" value={viewStudent.student_group} />
                <Detail label="Academic Year" value={viewStudent.academic_year} />
                <Detail label="Residential" value={viewStudent.residential_status} />
                <Detail label="Gender" value={viewStudent.gender} />
                <Detail label="DOB" value={viewStudent.dob} />
                <Detail label="Birth Cert. No" value={viewStudent.birth_certificate_no} />
                <Detail label="Blood Group" value={viewStudent.blood_group} />
                <Detail label="Religion" value={viewStudent.religion} />
                <Detail label="Nationality" value={viewStudent.nationality} />
                <Detail label="Mobile" value={viewStudent.mobile} />
                <Detail label="Email" value={viewStudent.email} />
              </div>

              <Separator />
              <div>
                <h4 className="mb-2 text-sm font-semibold">Address</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Detail label="Present" value={[viewStudent.present_village, viewStudent.present_po, viewStudent.present_upazila, viewStudent.present_district].filter(Boolean).join(', ') || viewStudent.address} />
                  <Detail label="Permanent" value={[viewStudent.permanent_village, viewStudent.permanent_po, viewStudent.permanent_upazila, viewStudent.permanent_district].filter(Boolean).join(', ')} />
                </div>
              </div>

              <Separator />
              <div>
                <h4 className="mb-2 text-sm font-semibold">Guardian Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Detail label="Father" value={viewStudent.father_name} />
                  <Detail label="Father's Profession" value={viewStudent.father_profession} />
                  <Detail label="Father's Mobile" value={viewStudent.father_mobile} />
                  <Detail label="Father's NID" value={viewStudent.father_nid} />
                  <Detail label="Mother" value={viewStudent.mother_name} />
                  <Detail label="Mother's Profession" value={viewStudent.mother_profession} />
                  <Detail label="Mother's Mobile" value={viewStudent.mother_mobile} />
                  <Detail label="Mother's NID" value={viewStudent.mother_nid} />
                  <Detail label="Local Guardian" value={viewStudent.local_guardian_name} />
                  <Detail label="Relation" value={viewStudent.local_guardian_relation} />
                  <Detail label="Mobile" value={viewStudent.local_guardian_mobile} />
                  <Detail label="Annual Income" value={viewStudent.annual_family_income} />
                </div>
              </div>

              <Separator />
              <div>
                <h4 className="mb-2 text-sm font-semibold">Previous Academic Record</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Detail label="School" value={viewStudent.previous_school_name} />
                  <Detail label="School Address" value={viewStudent.previous_school_address} />
                  <Detail label="Last Class Passed" value={viewStudent.last_class_passed} />
                  <Detail label="TC No" value={viewStudent.tc_no} />
                  <Detail label="Board Roll" value={viewStudent.board_roll_no} />
                  <Detail label="Board Reg." value={viewStudent.board_reg_no} />
                  <Detail label="Result / GPA" value={viewStudent.last_exam_result} />
                </div>
              </div>

              <Separator />
              <div>
                <h4 className="mb-2 text-sm font-semibold">Health & Emergency</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Detail label="Disease / Disability" value={viewStudent.disease_disability} />
                  <Detail label="Allergies" value={viewStudent.allergies} />
                  <Detail label="Emergency Contact" value={viewStudent.emergency_contact_name} />
                  <Detail label="Emergency Mobile" value={viewStudent.emergency_contact_mobile} />
                </div>
              </div>

              <Separator />
              <div>
                <h4 className="mb-2 text-sm font-semibold">Documents</h4>
                <div className="flex flex-wrap gap-2">
                  <DocButton label="Photo" path={viewStudent.photo_url} />
                  <DocButton label="Birth Certificate" path={viewStudent.birth_certificate_url} />
                  <DocButton label="TC" path={viewStudent.tc_url} />
                  <DocButton label="Marksheet" path={viewStudent.marksheet_url} />
                  <DocButton label="Guardian NID" path={viewStudent.guardian_nid_url} />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}:</span>
      <p className={mono ? 'font-mono font-medium' : 'font-medium'}>{value !== null && value !== undefined && value !== '' ? value : '—'}</p>
    </div>
  );
}

function DocButton({ label, path }: { label: string; path?: string | null }) {
  if (!path) return null;
  return (
    <Button type="button" variant="outline" size="sm" onClick={() => openDocument(path)}>
      <Eye className="mr-2 h-3.5 w-3.5" /> {label}
    </Button>
  );
}
