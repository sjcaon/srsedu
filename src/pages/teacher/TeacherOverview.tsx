import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CalendarCheck, ClipboardList, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TeacherOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ students: 0, attendance: 0, results: 0, messages: 0 });

  useEffect(() => {
    const fetch = async () => {
      const [s, a, r, m] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('marked_by', user?.id ?? ''),
        supabase.from('results').select('id', { count: 'exact', head: true }),
        supabase.from('messages').select('id', { count: 'exact', head: true }).eq('receiver_id', user?.id ?? '').eq('read_status', false),
      ]);
      setStats({ students: s.count ?? 0, attendance: a.count ?? 0, results: r.count ?? 0, messages: m.count ?? 0 });
    };
    fetch();
  }, [user]);

  const cards = [
    { label: 'Total Students', value: stats.students, icon: Users, color: 'text-primary' },
    { label: 'Attendance Marked', value: stats.attendance, icon: CalendarCheck, color: 'text-success' },
    { label: 'Results Entered', value: stats.results, icon: ClipboardList, color: 'text-info' },
    { label: 'Unread Messages', value: stats.messages, icon: Mail, color: 'text-warning' },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-display font-bold">Welcome Back!</h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/change-password">Change Password</Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent><p className="text-3xl font-display font-bold">{c.value}</p></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
