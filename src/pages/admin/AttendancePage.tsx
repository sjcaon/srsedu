import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Save } from 'lucide-react';

const classes = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

export default function AttendancePage() {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!selectedClass) return;
    const fetchStudents = async () => {
      setLoading(true);
      const { data } = await supabase.rpc('get_student_roster', { _class: selectedClass });
      setStudents(data ?? []);

      // Fetch existing attendance
      const { data: existing } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('date', selectedDate)
        .in('student_id', (data ?? []).map((s) => s.id));

      const map: Record<string, string> = {};
      (data ?? []).forEach((s) => { map[s.id] = 'absent'; });
      (existing ?? []).forEach((a) => { map[a.student_id] = a.status; });
      setAttendance(map);
      setLoading(false);
    };
    fetchStudents();
  }, [selectedClass, selectedDate]);

  const toggleAttendance = (studentId: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present',
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const records = Object.entries(attendance).map(([student_id, status]) => ({
      student_id,
      date: selectedDate,
      status,
      marked_by: user?.id,
    }));

    const { error } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'student_id,date' });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Attendance saved!' });
    }
    setSaving(false);
  };

  const presentCount = Object.values(attendance).filter((s) => s === 'present').length;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Attendance</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="space-y-2 w-48">
          <Label>Class</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>
              {classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 w-48">
          <Label>Date</Label>
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>
      </div>

      {selectedClass && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              {selectedClass} — {selectedDate}
              <span className="ml-3 text-sm font-normal text-muted-foreground">
                {presentCount}/{students.length} present
              </span>
            </CardTitle>
            <Button onClick={handleSave} disabled={saving || students.length === 0}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : students.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No students in this class</p>
            ) : (
              <div className="space-y-2">
                {students.map((s) => (
                  <div
                    key={s.id}
                    className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${
                      attendance[s.id] === 'present' ? 'bg-accent border-primary/20' : 'hover:bg-muted'
                    }`}
                    onClick={() => toggleAttendance(s.id)}
                  >
                    <Checkbox
                      checked={attendance[s.id] === 'present'}
                      onCheckedChange={() => toggleAttendance(s.id)}
                    />
                    <span className="font-mono text-sm text-muted-foreground w-24">{s.roll_number}</span>
                    <span className="font-medium">{s.full_name}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
