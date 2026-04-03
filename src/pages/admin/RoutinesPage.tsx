import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Loader2 } from 'lucide-react';

const classes = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

const emptyForm = { class: '', day_of_week: '', period_number: '1', subject: '', teacher_id: '', start_time: '08:00', end_time: '08:45' };

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadRoutines = async (className?: string) => {
    setLoading(true);

    let query = supabase.from('routines').select('*').order('day_of_week').order('period_number');
    if (className) query = query.eq('class', className);

    const [routineResponse, teacherResponse] = await Promise.all([
      query,
      supabase.from('teachers').select('id, full_name').order('full_name'),
    ]);

    if (routineResponse.error || teacherResponse.error) {
      toast({
        title: 'Error',
        description: routineResponse.error?.message ?? teacherResponse.error?.message ?? 'Failed to load routines.',
        variant: 'destructive',
      });
      setRoutines([]);
      setTeachers([]);
      setLoading(false);
      return;
    }

    const teacherList = teacherResponse.data ?? [];
    const teacherMap = new Map(teacherList.map((teacher) => [teacher.id, teacher.full_name]));

    setTeachers(teacherList);
    setRoutines(
      (routineResponse.data ?? []).map((routine) => ({
        ...routine,
        teacher_name: routine.teacher_id ? teacherMap.get(routine.teacher_id) ?? null : null,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    void loadRoutines(selectedClass);
  }, []);

  useEffect(() => {
    void loadRoutines(selectedClass);
  }, [selectedClass]);

  const handleChange = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      class: form.class,
      day_of_week: form.day_of_week,
      period_number: Number(form.period_number),
      subject: form.subject,
      teacher_id: form.teacher_id || null,
      start_time: form.start_time,
      end_time: form.end_time,
    };
    const { error } = await supabase.from('routines').insert([payload]);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Routine added!' });
      setDialogOpen(false);
      setForm(emptyForm);
      const nextClass = selectedClass || form.class;
      if (!selectedClass) setSelectedClass(form.class);
      await loadRoutines(nextClass);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('routines').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Routine entry deleted' });
      setRoutines((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // Group by day
  const grouped = routines.reduce((acc, r) => {
    if (!acc[r.day_of_week]) acc[r.day_of_week] = [];
    acc[r.day_of_week].push(r);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Class Routines</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setForm(emptyForm); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Period</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Routine Period</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class *</Label>
                  <Select value={form.class} onValueChange={(v) => handleChange('class', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Day *</Label>
                  <Select value={form.day_of_week} onValueChange={(v) => handleChange('day_of_week', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{days.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Period #</Label><Input type="number" min={1} max={10} value={form.period_number} onChange={(e) => handleChange('period_number', e.target.value)} /></div>
                <div className="space-y-2"><Label>Start</Label><Input type="time" value={form.start_time} onChange={(e) => handleChange('start_time', e.target.value)} /></div>
                <div className="space-y-2"><Label>End</Label><Input type="time" value={form.end_time} onChange={(e) => handleChange('end_time', e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Subject *</Label><Input value={form.subject} onChange={(e) => handleChange('subject', e.target.value)} required /></div>
              <div className="space-y-2">
                <Label>Teacher</Label>
                <Select value={form.teacher_id} onValueChange={(v) => handleChange('teacher_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                  <SelectContent>{teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add Period
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 w-48">
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger><SelectValue placeholder="Filter by class" /></SelectTrigger>
          <SelectContent>{classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : Object.keys(grouped).length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No routine entries yet. Select a class and add periods.</p>
      ) : (
        <div className="space-y-4">
          {days.filter((d) => grouped[d]).map((day) => (
            <Card key={day}>
              <CardContent className="p-4">
                <h3 className="font-display font-semibold text-lg mb-3">{day}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Period</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grouped[day].sort((a: any, b: any) => a.period_number - b.period_number).map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono">{r.period_number}</TableCell>
                        <TableCell>{r.start_time?.slice(0, 5)} - {r.end_time?.slice(0, 5)}</TableCell>
                        <TableCell className="font-medium">{r.subject}</TableCell>
                        <TableCell>{r.teacher_name || '—'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
