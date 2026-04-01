import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export default function StudentResults() {
  const { user } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: students } = await supabase.from('students').select('id').eq('user_id', user.id);
      if (!students?.length) { setLoading(false); return; }
      const { data } = await supabase.from('results').select('*, exams(exam_name, subject, max_marks, date)').eq('student_id', students[0].id).order('created_at', { ascending: false });
      setResults(data ?? []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">My Results</h1>
      {results.length === 0 ? <p className="text-muted-foreground text-center py-8">No results available</p> : (
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Exam</TableHead><TableHead>Subject</TableHead><TableHead>Marks</TableHead><TableHead>Max</TableHead><TableHead>Grade</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
            <TableBody>
              {results.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.exams?.exam_name}</TableCell>
                  <TableCell>{r.exams?.subject}</TableCell>
                  <TableCell>{r.marks}</TableCell>
                  <TableCell>{r.exams?.max_marks}</TableCell>
                  <TableCell><Badge variant={r.grade === 'F' ? 'destructive' : 'default'}>{r.grade}</Badge></TableCell>
                  <TableCell>{r.exams?.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}
    </div>
  );
}
