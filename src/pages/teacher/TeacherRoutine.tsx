import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';

const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

export default function TeacherRoutine() {
  const [routines, setRoutines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [r, t] = await Promise.all([
        supabase.from('routines').select('*').order('period_number'),
        supabase.rpc('get_teacher_directory'),
      ]);
      const nameById = new Map((t.data ?? []).map((entry: any) => [entry.id, entry.full_name]));
      setRoutines((r.data ?? []).map((row: any) => ({
        ...row,
        teachers: row.teacher_id ? { full_name: nameById.get(row.teacher_id) ?? null } : null,
      })));
      setLoading(false);
    };
    load();
  }, []);

  const grouped = routines.reduce((acc, r) => {
    if (!acc[r.day_of_week]) acc[r.day_of_week] = [];
    acc[r.day_of_week].push(r);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Class Routine</h1>
      {Object.keys(grouped).length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No routine entries yet</p>
      ) : (
        <div className="space-y-4">
          {days.filter((d) => grouped[d]).map((day) => (
            <Card key={day}>
              <CardContent className="p-4">
                <h3 className="font-display font-semibold text-lg mb-3">{day}</h3>
                <Table>
                  <TableHeader><TableRow><TableHead>Period</TableHead><TableHead>Time</TableHead><TableHead>Subject</TableHead><TableHead>Class</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {grouped[day].sort((a: any, b: any) => a.period_number - b.period_number).map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono">{r.period_number}</TableCell>
                        <TableCell>{r.start_time?.slice(0, 5)} - {r.end_time?.slice(0, 5)}</TableCell>
                        <TableCell className="font-medium">{r.subject}</TableCell>
                        <TableCell>{r.class}</TableCell>
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
