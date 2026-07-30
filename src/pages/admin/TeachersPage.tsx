import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, Eye, ChevronLeft, ChevronRight, X, Search } from 'lucide-react';
import { WizardNav, SectionGrid } from '@/components/forms/FormWizard';
import { FileUploadField, MultiFileUploadField } from '@/components/forms/FileUploadField';
import { openDocument } from '@/lib/storageUpload';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

type Qualification = { degree: string; board: string; year: string; major: string; cgpa: string };
type PreviousJob = { institution: string; post: string; duration: string; reason: string };
type Reference = { name: string; designation: string; institution: string; mobile: string };

const emptyQualification: Qualification = { degree: '', board: '', year: '', major: '', cgpa: '' };
const emptyJob: PreviousJob = { institution: '', post: '', duration: '', reason: '' };
const emptyReference: Reference = { name: '', designation: '', institution: '', mobile: '' };

const emptyForm = {
  // Personal
  full_name: '', photo_url: null as string | null, father_husband_name: '', mother_name: '',
  dob: '', national_id: '', gender: '', marital_status: '', religion: '', blood_group: '',
  mobile: '', email: '',
  // Address
  present_address: '', permanent_address: '',
  // Education
  qualifications: [{ ...emptyQualification }] as Qualification[],
  madrasa_certificates: '', bed_med: '', special_training: '',
  // Experience
  applied_post: '', subject: '', total_experience_years: '',
  previous_jobs: [{ ...emptyJob }] as PreviousJob[],
  expected_salary: '', joining_date: '', employment_type: '',
  // References
  reference_contacts: [{ ...emptyReference }, { ...emptyReference }] as Reference[],
  // Bank
  bank_account_no: '', bank_name: '', bank_branch: '', routing_no: '', mobile_banking_no: '', tin: '',
  // Health & legal
  physically_fit: false, no_criminal_record: false,
  // Documents
  nid_scan_url: null as string | null,
  education_certificate_urls: [] as string[],
  experience_certificate_url: null as string | null,
  police_clearance_url: null as string | null,
  cv_url: null as string | null,
  // Onboarding
  department: '', class_assigned: '', probation_period: '', salary: '',
};

type TeacherForm = typeof emptyForm;

const steps = [
  { id: 'personal', title: 'Personal' },
  { id: 'address', title: 'Address' },
  { id: 'education', title: 'Education' },
  { id: 'experience', title: 'Experience' },
  { id: 'references', title: 'References' },
  { id: 'bank', title: 'Bank & Salary' },
  { id: 'legal', title: 'Health & Legal' },
  { id: 'documents', title: 'Documents' },
  { id: 'onboarding', title: 'Onboarding' },
];

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<TeacherForm>(emptyForm);
  const [step, setStep] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewTeacher, setViewTeacher] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const fetchTeachers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('teachers').select('*').order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setTeachers([]);
    } else {
      setTeachers(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTeachers(); }, []);

  const filteredTeachers = useMemo(() => {
    if (!searchQuery) return teachers;
    const q = searchQuery.toLowerCase();
    return teachers.filter((t) =>
      t.full_name?.toLowerCase().includes(q) ||
      t.nid?.toLowerCase().includes(q) ||
      t.subject?.toLowerCase().includes(q) ||
      t.mobile?.toLowerCase().includes(q)
    );
  }, [teachers, searchQuery]);

  const set = <K extends keyof TeacherForm>(key: K, value: TeacherForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const text = (key: keyof TeacherForm) => ({
    value: (form[key] as string) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      set(key, e.target.value as TeacherForm[typeof key]),
  });

  const resetForm = () => { setForm(emptyForm); setEditId(null); setStep(0); };

  const buildPayload = () => {
    const nullable = (v: string) => (v.trim() === '' ? null : v.trim());
    return {
      full_name: form.full_name.trim(),
      photo_url: form.photo_url,
      father_husband_name: nullable(form.father_husband_name),
      mother_name: nullable(form.mother_name),
      parents_names: [form.father_husband_name, form.mother_name].filter((v) => v.trim() !== '').join(' & ') || null,
      dob: nullable(form.dob),
      national_id: nullable(form.national_id),
      gender: nullable(form.gender),
      marital_status: nullable(form.marital_status),
      religion: nullable(form.religion),
      blood_group: nullable(form.blood_group),
      mobile: nullable(form.mobile),
      email: nullable(form.email),
      present_address: nullable(form.present_address),
      permanent_address: nullable(form.permanent_address),
      address: nullable(form.present_address),
      qualifications: form.qualifications.filter((q) => q.degree.trim() || q.board.trim()),
      madrasa_certificates: nullable(form.madrasa_certificates),
      bed_med: nullable(form.bed_med),
      special_training: nullable(form.special_training),
      qualification: form.qualifications.map((q) => q.degree).filter(Boolean).join(', ') || null,
      applied_post: nullable(form.applied_post),
      subject: nullable(form.subject),
      total_experience_years: form.total_experience_years ? Number(form.total_experience_years) : null,
      previous_jobs: form.previous_jobs.filter((j) => j.institution.trim() || j.post.trim()),
      expected_salary: form.expected_salary ? Number(form.expected_salary) : null,
      salary: form.salary ? Number(form.salary) : (form.expected_salary ? Number(form.expected_salary) : null),
      joining_date: nullable(form.joining_date),
      employment_type: nullable(form.employment_type),
      reference_contacts: form.reference_contacts.filter((r) => r.name.trim()),
      bank_account_no: nullable(form.bank_account_no),
      bank_name: nullable(form.bank_name),
      bank_branch: nullable(form.bank_branch),
      routing_no: nullable(form.routing_no),
      mobile_banking_no: nullable(form.mobile_banking_no),
      tin: nullable(form.tin),
      physically_fit: form.physically_fit,
      no_criminal_record: form.no_criminal_record,
      nid_scan_url: form.nid_scan_url,
      education_certificate_urls: form.education_certificate_urls,
      experience_certificate_url: form.experience_certificate_url,
      police_clearance_url: form.police_clearance_url,
      cv_url: form.cv_url,
      department: nullable(form.department),
      class_assigned: nullable(form.class_assigned),
      probation_period: nullable(form.probation_period),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.mobile.trim()) {
      toast({ title: 'Missing required fields', description: 'Full Name and Mobile are required.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = buildPayload();

    let error;
    let savedTeacher: any = null;
    let createdLoginId: string | null = null;

    if (editId) {
      const response = await supabase.from('teachers').update(payload).eq('id', editId).select().single();
      error = response.error;
      savedTeacher = response.data;
    } else {
      const response = await supabase.functions.invoke('provision-managed-user', {
        body: { type: 'teacher', payload },
      });
      error = response.error ?? (response.data?.error ? { message: response.data.error } : null);
      savedTeacher = response.data?.record;
      createdLoginId = response.data?.loginId ?? null;
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      if (savedTeacher) {
        setTeachers((current) =>
          editId
            ? current.map((teacher) => (teacher.id === savedTeacher.id ? savedTeacher : teacher))
            : [savedTeacher, ...current]
        );
      }
      toast({
        title: editId ? 'Teacher updated!' : 'Teacher account created!',
        description: editId ? undefined : `Teacher ID: ${createdLoginId} · Default password: 123456`,
      });
      setDialogOpen(false);
      resetForm();
    }
    setSaving(false);
  };

  const handleEdit = (t: any) => {
    const next: TeacherForm = {
      ...emptyForm,
      qualifications: Array.isArray(t.qualifications) && t.qualifications.length ? t.qualifications : [{ ...emptyQualification }],
      previous_jobs: Array.isArray(t.previous_jobs) && t.previous_jobs.length ? t.previous_jobs : [{ ...emptyJob }],
      reference_contacts: Array.isArray(t.reference_contacts) && t.reference_contacts.length
        ? t.reference_contacts
        : [{ ...emptyReference }, { ...emptyReference }],
      education_certificate_urls: t.education_certificate_urls ?? [],
      physically_fit: !!t.physically_fit,
      no_criminal_record: !!t.no_criminal_record,
      photo_url: t.photo_url ?? null,
      nid_scan_url: t.nid_scan_url ?? null,
      experience_certificate_url: t.experience_certificate_url ?? null,
      police_clearance_url: t.police_clearance_url ?? null,
      cv_url: t.cv_url ?? null,
    };
    (Object.keys(emptyForm) as (keyof TeacherForm)[]).forEach((key) => {
      if (typeof emptyForm[key] !== 'string') return;
      const value = t[key];
      if (value === null || value === undefined) return;
      (next as any)[key] = String(value);
    });
    setForm(next);
    setEditId(t.id);
    setStep(0);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('teachers').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setTeachers((current) => current.filter((teacher) => teacher.id !== id));
      toast({ title: 'Teacher deleted' });
    }
  };

  const updateRow = <T,>(key: 'qualifications' | 'previous_jobs' | 'reference_contacts', index: number, field: string, value: string) => {
    setForm((f) => {
      const rows = [...(f[key] as any[])];
      rows[index] = { ...rows[index], [field]: value };
      return { ...f, [key]: rows };
    });
  };

  const isLast = step === steps.length - 1;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-display font-bold">Teachers</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Teacher</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? 'Edit Teacher' : 'Teacher Recruitment Form'}</DialogTitle>
            </DialogHeader>

            <WizardNav steps={steps} current={step} onSelect={setStep} />

            <form onSubmit={handleSubmit} className="space-y-5">
              {step === 0 && (
                <SectionGrid>
                  <div className="space-y-2">
                    <Label>Full Name <span className="text-destructive">*</span></Label>
                    <Input {...text('full_name')} required />
                  </div>
                  <FileUploadField label="Photo" folder="teachers/photos" accept="image/*" value={form.photo_url} onChange={(p) => set('photo_url', p)} />
                  <div className="space-y-2"><Label>Father / Husband Name <span className="text-destructive">*</span></Label><Input {...text('father_husband_name')} required /></div>
                  <div className="space-y-2"><Label>Mother's Name <span className="text-destructive">*</span></Label><Input {...text('mother_name')} required /></div>
                  <div className="space-y-2"><Label>Date of Birth <span className="text-destructive">*</span></Label><Input type="date" {...text('dob')} required /></div>
                  <div className="space-y-2"><Label>NID Number <span className="text-destructive">*</span></Label><Input {...text('national_id')} required /></div>
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
                    <Label>Marital Status</Label>
                    <Select value={form.marital_status} onValueChange={(v) => set('marital_status', v)}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Religion</Label><Input {...text('religion')} /></div>
                  <div className="space-y-2">
                    <Label>Blood Group (optional)</Label>
                    <Select value={form.blood_group} onValueChange={(v) => set('blood_group', v)}>
                      <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
                      <SelectContent>
                        {bloodGroups.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Mobile <span className="text-destructive">*</span></Label><Input {...text('mobile')} required /></div>
                  <div className="space-y-2"><Label>Email <span className="text-destructive">*</span></Label><Input type="email" {...text('email')} required /></div>
                  {editId && (
                    <div className="space-y-2">
                      <Label>Teacher ID</Label>
                      <Input value={teachers.find((teacher) => teacher.id === editId)?.nid ?? ''} readOnly />
                    </div>
                  )}
                </SectionGrid>
              )}

              {step === 1 && (
                <SectionGrid>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Present Address <span className="text-destructive">*</span></Label>
                    <Textarea rows={3} {...text('present_address')} required />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <Label>Permanent Address</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => set('permanent_address', form.present_address)}>
                        Same as present
                      </Button>
                    </div>
                    <Textarea rows={3} {...text('permanent_address')} />
                  </div>
                </SectionGrid>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Educational Qualifications <span className="text-destructive">*</span></h3>
                      <Button type="button" variant="outline" size="sm" onClick={() => set('qualifications', [...form.qualifications, { ...emptyQualification }])}>
                        <Plus className="mr-1 h-3.5 w-3.5" /> Add degree
                      </Button>
                    </div>
                    {form.qualifications.map((q, i) => (
                      <div key={i} className="relative rounded-lg border border-border p-4">
                        {form.qualifications.length > 1 && (
                          <Button
                            type="button" variant="ghost" size="icon"
                            className="absolute right-2 top-2 h-7 w-7"
                            onClick={() => set('qualifications', form.qualifications.filter((_, idx) => idx !== i))}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <SectionGrid>
                          <div className="space-y-2"><Label>Degree / Exam</Label><Input value={q.degree} onChange={(e) => updateRow('qualifications', i, 'degree', e.target.value)} /></div>
                          <div className="space-y-2"><Label>Board / University</Label><Input value={q.board} onChange={(e) => updateRow('qualifications', i, 'board', e.target.value)} /></div>
                          <div className="space-y-2"><Label>Passing Year</Label><Input value={q.year} onChange={(e) => updateRow('qualifications', i, 'year', e.target.value)} /></div>
                          <div className="space-y-2"><Label>Major / Subject</Label><Input value={q.major} onChange={(e) => updateRow('qualifications', i, 'major', e.target.value)} /></div>
                          <div className="space-y-2"><Label>CGPA / Result</Label><Input value={q.cgpa} onChange={(e) => updateRow('qualifications', i, 'cgpa', e.target.value)} /></div>
                        </SectionGrid>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <SectionGrid>
                    <div className="space-y-2"><Label>Madrasa Certificates (if applicable)</Label><Input {...text('madrasa_certificates')} /></div>
                    <div className="space-y-2"><Label>B.Ed / M.Ed</Label><Input {...text('bed_med')} /></div>
                    <div className="space-y-2 sm:col-span-2"><Label>Special Training (optional)</Label><Textarea rows={2} {...text('special_training')} /></div>
                  </SectionGrid>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <SectionGrid>
                    <div className="space-y-2"><Label>Applied Post <span className="text-destructive">*</span></Label><Input {...text('applied_post')} required /></div>
                    <div className="space-y-2"><Label>Subject to Teach <span className="text-destructive">*</span></Label><Input {...text('subject')} required /></div>
                    <div className="space-y-2"><Label>Total Experience (Years)</Label><Input type="number" step="0.5" {...text('total_experience_years')} /></div>
                    <div className="space-y-2"><Label>Expected Salary</Label><Input type="number" {...text('expected_salary')} /></div>
                    <div className="space-y-2"><Label>Joining Date</Label><Input type="date" {...text('joining_date')} /></div>
                    <div className="space-y-2">
                      <Label>Employment Type</Label>
                      <Select value={form.employment_type} onValueChange={(v) => set('employment_type', v)}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Full-time">Full-time</SelectItem>
                          <SelectItem value="Part-time">Part-time</SelectItem>
                          <SelectItem value="Contractual">Contractual</SelectItem>
                          <SelectItem value="Guest">Guest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </SectionGrid>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Previous Job Details</h3>
                      <Button type="button" variant="outline" size="sm" onClick={() => set('previous_jobs', [...form.previous_jobs, { ...emptyJob }])}>
                        <Plus className="mr-1 h-3.5 w-3.5" /> Add job
                      </Button>
                    </div>
                    {form.previous_jobs.map((j, i) => (
                      <div key={i} className="relative rounded-lg border border-border p-4">
                        {form.previous_jobs.length > 1 && (
                          <Button
                            type="button" variant="ghost" size="icon"
                            className="absolute right-2 top-2 h-7 w-7"
                            onClick={() => set('previous_jobs', form.previous_jobs.filter((_, idx) => idx !== i))}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <SectionGrid>
                          <div className="space-y-2"><Label>Institution</Label><Input value={j.institution} onChange={(e) => updateRow('previous_jobs', i, 'institution', e.target.value)} /></div>
                          <div className="space-y-2"><Label>Post</Label><Input value={j.post} onChange={(e) => updateRow('previous_jobs', i, 'post', e.target.value)} /></div>
                          <div className="space-y-2"><Label>Duration</Label><Input value={j.duration} onChange={(e) => updateRow('previous_jobs', i, 'duration', e.target.value)} /></div>
                          <div className="space-y-2"><Label>Reason for Leaving</Label><Input value={j.reason} onChange={(e) => updateRow('previous_jobs', i, 'reason', e.target.value)} /></div>
                        </SectionGrid>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  {form.reference_contacts.map((r, i) => (
                    <div key={i} className="rounded-lg border border-border p-4">
                      <h3 className="mb-3 text-sm font-semibold">Reference {i + 1} {i === 0 && <span className="text-destructive">*</span>}</h3>
                      <SectionGrid>
                        <div className="space-y-2"><Label>Name</Label><Input value={r.name} onChange={(e) => updateRow('reference_contacts', i, 'name', e.target.value)} required={i === 0} /></div>
                        <div className="space-y-2"><Label>Designation</Label><Input value={r.designation} onChange={(e) => updateRow('reference_contacts', i, 'designation', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Institution</Label><Input value={r.institution} onChange={(e) => updateRow('reference_contacts', i, 'institution', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Mobile</Label><Input value={r.mobile} onChange={(e) => updateRow('reference_contacts', i, 'mobile', e.target.value)} /></div>
                      </SectionGrid>
                    </div>
                  ))}
                </div>
              )}

              {step === 5 && (
                <SectionGrid>
                  <div className="space-y-2"><Label>Bank Account No</Label><Input {...text('bank_account_no')} /></div>
                  <div className="space-y-2"><Label>Bank Name</Label><Input {...text('bank_name')} /></div>
                  <div className="space-y-2"><Label>Branch</Label><Input {...text('bank_branch')} /></div>
                  <div className="space-y-2"><Label>Routing No</Label><Input {...text('routing_no')} /></div>
                  <div className="space-y-2"><Label>Mobile Banking No</Label><Input {...text('mobile_banking_no')} /></div>
                  <div className="space-y-2"><Label>TIN (optional)</Label><Input {...text('tin')} /></div>
                </SectionGrid>
              )}

              {step === 6 && (
                <div className="space-y-4">
                  <label className="flex items-start gap-3 rounded-lg border border-border p-4">
                    <Checkbox checked={form.physically_fit} onCheckedChange={(c) => set('physically_fit', c === true)} />
                    <span className="text-sm">
                      <span className="font-medium">Physical fitness declaration <span className="text-destructive">*</span></span>
                      <span className="block text-muted-foreground">I declare that I am physically and mentally fit to perform the duties of this post.</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 rounded-lg border border-border p-4">
                    <Checkbox checked={form.no_criminal_record} onCheckedChange={(c) => set('no_criminal_record', c === true)} />
                    <span className="text-sm">
                      <span className="font-medium">Criminal record declaration <span className="text-destructive">*</span></span>
                      <span className="block text-muted-foreground">I declare that I have never been convicted of any criminal offence.</span>
                    </span>
                  </label>
                </div>
              )}

              {step === 7 && (
                <SectionGrid>
                  <FileUploadField label="NID Scan" folder="teachers/documents" value={form.nid_scan_url} onChange={(p) => set('nid_scan_url', p)} />
                  <FileUploadField label="Experience Certificate" folder="teachers/documents" value={form.experience_certificate_url} onChange={(p) => set('experience_certificate_url', p)} />
                  <FileUploadField label="Police Clearance" folder="teachers/documents" value={form.police_clearance_url} onChange={(p) => set('police_clearance_url', p)} />
                  <FileUploadField label="CV / Resume" folder="teachers/documents" value={form.cv_url} onChange={(p) => set('cv_url', p)} />
                  <div className="sm:col-span-2">
                    <MultiFileUploadField
                      label="Educational Certificates"
                      folder="teachers/documents"
                      values={form.education_certificate_urls}
                      onChange={(paths) => set('education_certificate_urls', paths)}
                    />
                  </div>
                </SectionGrid>
              )}

              {step === 8 && (
                <SectionGrid>
                  <div className="space-y-2">
                    <Label>Employee ID</Label>
                    <Input value={editId ? (teachers.find((t) => t.id === editId)?.nid ?? '') : 'Auto-generated on submit'} readOnly />
                  </div>
                  <div className="space-y-2"><Label>Department</Label><Input {...text('department')} /></div>
                  <div className="space-y-2"><Label>Class Assigned</Label><Input {...text('class_assigned')} /></div>
                  <div className="space-y-2"><Label>Probation Period</Label><Input placeholder="e.g. 6 months" {...text('probation_period')} /></div>
                  <div className="space-y-2"><Label>Approved Salary</Label><Input type="number" {...text('salary')} /></div>
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
                    {editId ? 'Update Teacher' : 'Submit Application'}
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

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, ID, subject, or mobile..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filteredTeachers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {teachers.length === 0 ? 'No teachers added yet' : 'No teachers match your search'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="hidden sm:table-cell">Mobile</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Post</TableHead>
                    <TableHead className="w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-sm">{t.nid}</TableCell>
                      <TableCell className="font-medium">{t.full_name}</TableCell>
                      <TableCell>{t.subject}</TableCell>
                      <TableCell className="hidden sm:table-cell">{t.mobile}</TableCell>
                      <TableCell className="hidden md:table-cell">{t.email}</TableCell>
                      <TableCell className="hidden lg:table-cell">{t.applied_post ?? '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setViewTeacher(t)} title="View details">
                            <Eye className="h-4 w-4" />
                          </Button>
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

      <Dialog open={!!viewTeacher} onOpenChange={(o) => { if (!o) setViewTeacher(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Teacher Profile</DialogTitle>
          </DialogHeader>
          {viewTeacher && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Detail label="Teacher ID" value={viewTeacher.nid} mono />
                <Detail label="Full Name" value={viewTeacher.full_name} />
                <Detail label="Father / Husband" value={viewTeacher.father_husband_name} />
                <Detail label="Mother" value={viewTeacher.mother_name} />
                <Detail label="DOB" value={viewTeacher.dob} />
                <Detail label="NID" value={viewTeacher.national_id} />
                <Detail label="Gender" value={viewTeacher.gender} />
                <Detail label="Marital Status" value={viewTeacher.marital_status} />
                <Detail label="Religion" value={viewTeacher.religion} />
                <Detail label="Blood Group" value={viewTeacher.blood_group} />
                <Detail label="Mobile" value={viewTeacher.mobile} />
                <Detail label="Email" value={viewTeacher.email} />
                <Detail label="Present Address" value={viewTeacher.present_address ?? viewTeacher.address} />
                <Detail label="Permanent Address" value={viewTeacher.permanent_address} />
              </div>

              <Separator />
              <div>
                <h4 className="mb-2 text-sm font-semibold">Qualifications</h4>
                {(viewTeacher.qualifications ?? []).length === 0 ? (
                  <p className="text-muted-foreground">—</p>
                ) : (
                  <ul className="space-y-1">
                    {(viewTeacher.qualifications as Qualification[]).map((q, i) => (
                      <li key={i} className="text-muted-foreground">
                        <span className="font-medium text-foreground">{q.degree}</span> · {q.board} · {q.year} · {q.major} · {q.cgpa}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Detail label="Madrasa Certificates" value={viewTeacher.madrasa_certificates} />
                  <Detail label="B.Ed / M.Ed" value={viewTeacher.bed_med} />
                  <Detail label="Special Training" value={viewTeacher.special_training} />
                </div>
              </div>

              <Separator />
              <div>
                <h4 className="mb-2 text-sm font-semibold">Professional</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Detail label="Applied Post" value={viewTeacher.applied_post} />
                  <Detail label="Subject" value={viewTeacher.subject} />
                  <Detail label="Experience (yrs)" value={viewTeacher.total_experience_years} />
                  <Detail label="Employment Type" value={viewTeacher.employment_type} />
                  <Detail label="Expected Salary" value={viewTeacher.expected_salary} />
                  <Detail label="Approved Salary" value={viewTeacher.salary} />
                  <Detail label="Joining Date" value={viewTeacher.joining_date} />
                  <Detail label="Department" value={viewTeacher.department} />
                  <Detail label="Class Assigned" value={viewTeacher.class_assigned} />
                  <Detail label="Probation" value={viewTeacher.probation_period} />
                </div>
                {(viewTeacher.previous_jobs ?? []).length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {(viewTeacher.previous_jobs as PreviousJob[]).map((j, i) => (
                      <li key={i} className="text-muted-foreground">
                        <span className="font-medium text-foreground">{j.post}</span> at {j.institution} · {j.duration} · {j.reason}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Separator />
              <div>
                <h4 className="mb-2 text-sm font-semibold">References</h4>
                {(viewTeacher.reference_contacts ?? []).length === 0 ? (
                  <p className="text-muted-foreground">—</p>
                ) : (
                  <ul className="space-y-1">
                    {(viewTeacher.reference_contacts as Reference[]).map((r, i) => (
                      <li key={i} className="text-muted-foreground">
                        <span className="font-medium text-foreground">{r.name}</span> · {r.designation} · {r.institution} · {r.mobile}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Separator />
              <div>
                <h4 className="mb-2 text-sm font-semibold">Bank & Declarations</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Detail label="Bank Account" value={viewTeacher.bank_account_no} />
                  <Detail label="Bank" value={[viewTeacher.bank_name, viewTeacher.bank_branch].filter(Boolean).join(' · ')} />
                  <Detail label="Routing No" value={viewTeacher.routing_no} />
                  <Detail label="Mobile Banking" value={viewTeacher.mobile_banking_no} />
                  <Detail label="TIN" value={viewTeacher.tin} />
                  <Detail label="Physically Fit" value={viewTeacher.physically_fit ? 'Declared' : 'Not declared'} />
                  <Detail label="No Criminal Record" value={viewTeacher.no_criminal_record ? 'Declared' : 'Not declared'} />
                </div>
              </div>

              <Separator />
              <div>
                <h4 className="mb-2 text-sm font-semibold">Documents</h4>
                <div className="flex flex-wrap gap-2">
                  <DocButton label="Photo" path={viewTeacher.photo_url} />
                  <DocButton label="NID Scan" path={viewTeacher.nid_scan_url} />
                  <DocButton label="Experience Cert." path={viewTeacher.experience_certificate_url} />
                  <DocButton label="Police Clearance" path={viewTeacher.police_clearance_url} />
                  <DocButton label="CV" path={viewTeacher.cv_url} />
                  {(viewTeacher.education_certificate_urls ?? []).map((p: string, i: number) => (
                    <DocButton key={p} label={`Certificate ${i + 1}`} path={p} />
                  ))}
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
