import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export default function GuardianResults() {
  const { user } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: guardians } = await supabase.from('guardians').select('id').eq('user_id', user.id);
      if (!guardians?.length) { setLoading(false); return; }
      const { data: students } = await supabase.from('students').select('id, full_name').in('guardian_id', guardians.map((g) => g.id));
      if (!students?.length) { setLoading(false); return; }
      const { data } = await supabase.from('results').select('*, exams(exam_name, subject, max_marks)').in('student_id', students.map((s) => s.id)).order('created_at', { ascending: false });
      const enriched = (data ?? []).map((r) => ({ ...r, student_name: students.find((s) => s.id === r.student_id)?.full_name }));
      setResults(enriched);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Ward Results</h1>
      {results.length === 0 ? <p className="text-muted-foreground text-center py-8">No results available</p> : (
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Exam</TableHead><TableHead>Subject</TableHead><TableHead>Marks</TableHead><TableHead>Grade</TableHead></TableRow></TableHeader>
            <TableBody>
              {results.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.student_name}</TableCell>
                  <TableCell>{r.exams?.exam_name}</TableCell>
                  <TableCell>{r.exams?.subject}</TableCell>
                  <TableCell>{r.marks}/{r.exams?.max_marks}</TableCell>
                  <TableCell><Badge variant={r.grade === 'F' ? 'destructive' : 'default'}>{r.grade}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}
    </div>
  );
}
