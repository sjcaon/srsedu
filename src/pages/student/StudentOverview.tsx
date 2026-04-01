import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function StudentOverview() {
  const { user } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('students').select('*').eq('user_id', user.id).single().then(({ data }) => {
      setStudent(data);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!student) return <p className="text-center text-muted-foreground py-8">Your student profile is not linked yet. Contact the admin.</p>;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">My Profile</h1>
      <Card>
        <CardHeader><CardTitle>{student.full_name}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
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
