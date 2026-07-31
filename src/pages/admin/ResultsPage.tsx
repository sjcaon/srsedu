import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Download } from 'lucide-react';
import { exportToCSV } from '@/lib/csvExport';

const classes = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

function calcGrade(marks: number, max: number): string {
  const pct = (marks / max) * 100;
  if (pct >= 80) return 'A+';
  if (pct >= 70) return 'A';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 33) return 'D';
  return 'F';
}

export default function ResultsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [existingResults, setExistingResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.from('exams').select('*').order('date', { ascending: false }).then(({ data }) => setExams(data ?? []));
  }, []);

  const selectedExamObj = exams.find((e) => e.id === selectedExam);

  useEffect(() => {
    if (!selectedExam || !selectedClass) return;
    const fetchData = async () => {
      setLoading(true);
      const [s, r] = await Promise.all([
        supabase.rpc('get_student_roster', { _class: selectedClass }),
        supabase.from('results').select('*').eq('exam_id', selectedExam),
      ]);
      setStudents(s.data ?? []);
      setExistingResults(r.data ?? []);
      const m: Record<string, string> = {};
      (s.data ?? []).forEach((st) => {
        const existing = (r.data ?? []).find((res) => res.student_id === st.id);
        m[st.id] = existing ? String(existing.marks) : '';
      });
      setMarks(m);
      setLoading(false);
    };
    fetchData();
  }, [selectedExam, selectedClass]);

  const handleSave = async () => {
    if (!selectedExamObj) return;
    setSaving(true);
    const records = Object.entries(marks)
      .filter(([, v]) => v !== '')
      .map(([student_id, m]) => ({
        student_id,
        exam_id: selectedExam,
        marks: Number(m),
        grade: calcGrade(Number(m), selectedExamObj.max_marks),
      }));

    const { error } = await supabase.from('results').upsert(records, { onConflict: 'student_id,exam_id' });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else toast({ title: 'Results saved!' });
    setSaving(false);
  };

  const handleExport = () => {
    if (!selectedExamObj) return;
    const data = students
      .filter((s) => marks[s.id] !== '')
      .map((s) => ({
        roll_number: s.roll_number,
        name: s.full_name,
        marks: marks[s.id],
        max_marks: selectedExamObj.max_marks,
        grade: calcGrade(Number(marks[s.id]), selectedExamObj.max_marks),
      }));
    exportToCSV(data, `results-${selectedExamObj.exam_name}`);
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Results</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="space-y-2 w-56">
          <Label>Exam</Label>
          <Select value={selectedExam} onValueChange={setSelectedExam}>
            <SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger>
            <SelectContent>
              {exams.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.exam_name} ({e.subject})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 w-48">
          <Label>Class</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>
              {classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedExam && selectedClass && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              {selectedExamObj?.exam_name} — {selectedClass}
              <span className="ml-3 text-sm font-normal text-muted-foreground">
                Max: {selectedExamObj?.max_marks} | Pass: {selectedExamObj?.pass_marks}
              </span>
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport} disabled={students.length === 0}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving || students.length === 0}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : students.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No students in this class</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-32">Marks</TableHead>
                    <TableHead className="w-20">Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-sm">{s.roll_number}</TableCell>
                      <TableCell className="font-medium">{s.full_name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          max={selectedExamObj?.max_marks}
                          value={marks[s.id] ?? ''}
                          onChange={(e) => setMarks((prev) => ({ ...prev, [s.id]: e.target.value }))}
                          className="w-24 h-8"
                        />
                      </TableCell>
                      <TableCell>
                        {marks[s.id] !== '' && (
                          <span className={`font-semibold ${calcGrade(Number(marks[s.id]), selectedExamObj?.max_marks) === 'F' ? 'text-destructive' : 'text-foreground'}`}>
                            {calcGrade(Number(marks[s.id]), selectedExamObj?.max_marks)}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
