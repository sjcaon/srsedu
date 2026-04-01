import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export default function GuardianAttendance() {
  const { user } = useAuth();
  const [wardData, setWardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: guardians } = await supabase.from('guardians').select('id').eq('user_id', user.id);
      if (!guardians?.length) { setLoading(false); return; }
      const { data: students } = await supabase.from('students').select('id, full_name, current_class').in('guardian_id', guardians.map((g) => g.id));
      if (!students?.length) { setLoading(false); return; }
      const results = [];
      for (const s of students) {
        const { data } = await supabase.from('attendance').select('status').eq('student_id', s.id);
        const total = data?.length ?? 0;
        const present = data?.filter((a) => a.status === 'present').length ?? 0;
        results.push({ ...s, total, present, pct: total ? Math.round((present / total) * 100) : 0 });
      }
      setWardData(results);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Ward Attendance</h1>
      {wardData.length === 0 ? <p className="text-muted-foreground text-center py-8">No data available</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wardData.map((w) => (
            <Card key={w.id}>
              <CardHeader><CardTitle>{w.full_name} ({w.current_class})</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{w.pct}%</p>
                    <p className="text-xs text-muted-foreground">Attendance</p>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-sm"><span>Present</span><span className="font-medium">{w.present}</span></div>
                    <div className="flex justify-between text-sm"><span>Absent</span><span className="font-medium">{w.total - w.present}</span></div>
                    <div className="flex justify-between text-sm"><span>Total Days</span><span className="font-medium">{w.total}</span></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
