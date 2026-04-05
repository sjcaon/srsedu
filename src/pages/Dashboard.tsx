import { useAuth } from '@/hooks/useAuth';
import { Link, Navigate } from 'react-router-dom';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import GuardianDashboard from '@/components/dashboard/GuardianDashboard';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { user, role, loading, accessContext } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if ((role === 'student' || role === 'teacher') && accessContext.isFirstLogin) {
    return <Navigate to="/change-password" replace />;
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center shadow-sm">
          <h1 className="font-display text-2xl font-bold text-foreground">Access pending</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account is signed in, but it does not have a dashboard role yet.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Button asChild variant="outline">
              <Link to="/">Go home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'student':
      return <StudentDashboard />;
    case 'guardian':
      return <GuardianDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
}
