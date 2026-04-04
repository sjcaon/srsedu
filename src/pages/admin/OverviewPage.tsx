import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users, GraduationCap, UserCheck, FileText, CalendarCheck,
  Award, ClipboardList, Wallet, Loader2,
} from 'lucide-react';

export default function OverviewPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    teachers: 0, students: 0, guardians: 0, notices: 0,
    exams: 0, attendance_today: 0, fee_payments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date().toISOString().split('T')[0];
      const [t, s, g, n, e, a, fp] = await Promise.all([
        supabase.from('teachers').select('id', { count: 'exact', head: true }),
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('guardians').select('id', { count: 'exact', head: true }),
        supabase.from('notices').select('id', { count: 'exact', head: true }),
        supabase.from('exams').select('id', { count: 'exact', head: true }),
        supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', today).eq('status', 'present'),
        supabase.from('fee_payments').select('id', { count: 'exact', head: true }).eq('status', 'paid'),
      ]);
      setStats({
        teachers: t.count ?? 0,
        students: s.count ?? 0,
        guardians: g.count ?? 0,
        notices: n.count ?? 0,
        exams: e.count ?? 0,
        attendance_today: a.count ?? 0,
        fee_payments: fp.count ?? 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const cards = [
    { label: 'Teachers', value: stats.teachers, icon: Users, color: 'text-blue-500' },
    { label: 'Students', value: stats.students, icon: GraduationCap, color: 'text-emerald-500' },
    { label: 'Guardians', value: stats.guardians, icon: UserCheck, color: 'text-amber-500' },
    { label: 'Notices', value: stats.notices, icon: FileText, color: 'text-violet-500' },
    { label: 'Exams', value: stats.exams, icon: ClipboardList, color: 'text-rose-500' },
    { label: 'Present Today', value: stats.attendance_today, icon: CalendarCheck, color: 'text-teal-500' },
    { label: 'Payments', value: stats.fee_payments, icon: Wallet, color: 'text-orange-500' },
  ];

  const quickActions = [
    { label: 'Take Attendance', icon: CalendarCheck, path: '/dashboard/attendance' },
    { label: 'Add Result', icon: Award, path: '/dashboard/results' },
    { label: 'Post Notice', icon: FileText, path: '/dashboard/notices' },
    { label: 'Add Student', icon: GraduationCap, path: '/dashboard/students' },
    { label: 'Create Exam', icon: ClipboardList, path: '/dashboard/exams' },
    { label: 'Manage Fees', icon: Wallet, path: '/dashboard/fees' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center p-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">Overview</h1>
        <p className="text-sm text-muted-foreground">Welcome to SRS Academic Coaching Management System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-display font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto flex flex-col items-center gap-2 py-5 px-3 hover:bg-accent hover:border-primary/30 transition-colors"
              onClick={() => navigate(action.path)}
            >
              <action.icon className="h-6 w-6 text-primary" />
              <span className="text-xs font-medium text-center leading-tight">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
