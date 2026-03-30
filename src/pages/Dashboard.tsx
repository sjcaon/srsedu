import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // For now, all authenticated users see admin dashboard
  // Role-based dashboards will be added incrementally
  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'teacher':
    case 'student':
    case 'guardian':
    default:
      return <AdminDashboard />;
  }
}
