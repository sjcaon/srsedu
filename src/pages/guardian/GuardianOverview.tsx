import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, CalendarCheck, ClipboardList } from 'lucide-react';

export default function GuardianOverview() {
  const { user } = useAuth();
  const [wards, setWards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: guardians } = await supabase.from('guardians').select('id').eq('user_id', user.id);
      if (!guardians?.length) { setLoading(false); return; }
      const { data } = await supabase.from('students').select('*').in('guardian_id', guardians.map((g) => g.id));
      setWards(data ?? []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!wards.length) return <p className="text-center text-muted-foreground py-8">No wards linked to your account. Contact the admin.</p>;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">My Wards</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wards.map((w) => (
          <Card key={w.id}>
            <CardHeader><CardTitle>{w.full_name}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Roll:</span> {w.roll_number}</div>
                <div><span className="text-muted-foreground">Class:</span> {w.current_class}</div>
                <div><span className="text-muted-foreground">Group:</span> {w.student_group || '—'}</div>
                <div><span className="text-muted-foreground">Mobile:</span> {w.mobile || '—'}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
