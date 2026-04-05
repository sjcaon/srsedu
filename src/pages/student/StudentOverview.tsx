import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, CalendarCheck, ClipboardList, CreditCard } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function StudentOverview() {
  const { user, profile, accessContext } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ attendance: 0, totalDays: 0, results: 0, feesDue: 0 });

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // Fetch student record
      const { data: s } = await supabase.from('students').select('*').eq('user_id', user.id).single();
      setStudent(s);

      if (s) {
        // Attendance percentage
        const { count: totalDays } = await supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('student_id', s.id);
        const { count: presentDays } = await supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('student_id', s.id).eq('status', 'present');
        // Results count
        const { count: resultCount } = await supabase.from('results').select('id', { count: 'exact', head: true }).eq('student_id', s.id);
        // Fees due
        const { count: feesDue } = await supabase.from('fee_payments').select('id', { count: 'exact', head: true }).eq('student_id', s.id).eq('status', 'pending');

        setStats({
          attendance: totalDays ? Math.round(((presentDays ?? 0) / totalDays) * 100) : 0,
          totalDays: totalDays ?? 0,
          results: resultCount ?? 0,
          feesDue: feesDue ?? 0,
        });
      }
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!student) return <p className="text-center text-muted-foreground py-8">Your student profile is not linked yet. Contact the admin.</p>;

  const initials = student.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="flex items-center gap-5 p-6">
          <Avatar className="h-16 w-16 border-2 border-primary/30">
            <AvatarImage src={profile?.full_name ? undefined : undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Welcome, {student.full_name}!</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
              <span>ST ID: <strong className="text-foreground">{accessContext.loginId ?? student.roll_number}</strong></span>
              <span>Class: <strong className="text-foreground">{student.current_class}</strong></span>
              {student.student_group && <span>Group: <strong className="text-foreground">{student.student_group}</strong></span>}
            </div>
            <div className="mt-3">
              <Button asChild variant="outline" size="sm">
                <Link to="/change-password">Change Password</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center"><CalendarCheck className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Attendance</p>
              <p className="text-lg font-bold">{stats.attendance}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><ClipboardList className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Exams Taken</p>
              <p className="text-lg font-bold">{stats.results}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center"><CreditCard className="h-5 w-5 text-amber-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Fees Due</p>
              <p className="text-lg font-bold">{stats.feesDue}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center"><User className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Days</p>
              <p className="text-lg font-bold">{stats.totalDays}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader><CardTitle>My Profile</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Roll Number:</span> <span className="font-medium">{student.roll_number}</span></div>
            <div><span className="text-muted-foreground">Class:</span> <span className="font-medium">{student.current_class}</span></div>
            <div><span className="text-muted-foreground">Group:</span> <span className="font-medium">{student.student_group || '—'}</span></div>
            <div><span className="text-muted-foreground">Mobile:</span> <span className="font-medium">{student.mobile || '—'}</span></div>
            <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{student.email || '—'}</span></div>
            <div><span className="text-muted-foreground">Address:</span> <span className="font-medium">{student.address || '—'}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
