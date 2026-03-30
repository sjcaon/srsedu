import { Routes, Route } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AdminSidebar from './AdminSidebar';
import OverviewPage from '@/pages/admin/OverviewPage';
import TeachersPage from '@/pages/admin/TeachersPage';
import StudentsPage from '@/pages/admin/StudentsPage';
import GuardiansPage from '@/pages/admin/GuardiansPage';
import AttendancePage from '@/pages/admin/AttendancePage';
import ExamsPage from '@/pages/admin/ExamsPage';
import NoticesPage from '@/pages/admin/NoticesPage';

export default function AdminDashboard() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-card px-4">
            <SidebarTrigger />
            <h2 className="ml-4 text-lg font-display font-semibold text-foreground">
              Dashboard
            </h2>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route index element={<OverviewPage />} />
              <Route path="teachers" element={<TeachersPage />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="guardians" element={<GuardiansPage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="exams" element={<ExamsPage />} />
              <Route path="notices" element={<NoticesPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
