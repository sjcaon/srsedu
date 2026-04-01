import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export default function StudentAttendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: students } = await supabase.from('students').select('id').eq('user_id', user.id);
      if (!students?.length) { setLoading(false); return; }
      const { data } = await supabase.from('attendance').select('*').eq('student_id', students[0].id).order('date', { ascending: false }).limit(60);
      setRecords(data ?? []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const present = records.filter((r) => r.status === 'present').length;
  const total = records.length;
  const pct = total ? Math.round((present / total) * 100) : 0;

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">My Attendance</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-primary">{pct}%</p><p className="text-sm text-muted-foreground">Attendance Rate</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-foreground">{present}</p><p className="text-sm text-muted-foreground">Days Present</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-foreground">{total - present}</p><p className="text-sm text-muted-foreground">Days Absent</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Recent Records</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {records.length === 0 ? <p className="text-muted-foreground">No attendance records</p> :
              records.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span>{r.date}</span>
                  <Badge variant={r.status === 'present' ? 'default' : 'destructive'}>{r.status}</Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
