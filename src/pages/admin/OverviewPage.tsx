import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, UserCheck, FileText } from 'lucide-react';

export default function OverviewPage() {
  const [stats, setStats] = useState({ teachers: 0, students: 0, guardians: 0, notices: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [t, s, g, n] = await Promise.all([
        supabase.from('teachers').select('id', { count: 'exact', head: true }),
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('guardians').select('id', { count: 'exact', head: true }),
        supabase.from('notices').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        teachers: t.count ?? 0,
        students: s.count ?? 0,
        guardians: g.count ?? 0,
        notices: n.count ?? 0,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { label: 'Teachers', value: stats.teachers, icon: Users, color: 'text-info' },
    { label: 'Students', value: stats.students, icon: GraduationCap, color: 'text-success' },
    { label: 'Guardians', value: stats.guardians, icon: UserCheck, color: 'text-warning' },
    { label: 'Notices', value: stats.notices, icon: FileText, color: 'text-primary' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground mb-6">Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
