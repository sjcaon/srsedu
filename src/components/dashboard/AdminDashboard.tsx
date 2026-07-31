import { Routes, Route } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AdminSidebar from './AdminSidebar';
import OverviewPage from '@/pages/admin/OverviewPage';
import TeachersPage from '@/pages/admin/TeachersPage';
import StudentsPage from '@/pages/admin/StudentsPage';

import AttendancePage from '@/pages/admin/AttendancePage';
import ExamsPage from '@/pages/admin/ExamsPage';
import ResultsPage from '@/pages/admin/ResultsPage';
import NoticesPage from '@/pages/admin/NoticesPage';
import RoutinesPage from '@/pages/admin/RoutinesPage';
import FeesPage from '@/pages/admin/FeesPage';
import StudentFeesPage from '@/pages/admin/StudentFeesPage';
import SalariesPage from '@/pages/admin/SalariesPage';
import ExpensesPage from '@/pages/admin/ExpensesPage';
import FinanceOverviewPage from '@/pages/admin/FinanceOverviewPage';
import MessagesPage from '@/pages/admin/MessagesPage';
import RolesPage from '@/pages/admin/RolesPage';


export default function AdminDashboard() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-card px-4">
            <SidebarTrigger />
            <h2 className="ml-4 text-lg font-display font-semibold text-foreground">
              Admin Dashboard
            </h2>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route index element={<OverviewPage />} />
              <Route path="teachers" element={<TeachersPage />} />
              <Route path="students" element={<StudentsPage />} />
              
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="exams" element={<ExamsPage />} />
              <Route path="results" element={<ResultsPage />} />
              <Route path="notices" element={<NoticesPage />} />
              <Route path="routines" element={<RoutinesPage />} />
              <Route path="fees" element={<FeesPage />} />
              <Route path="finance" element={<FinanceOverviewPage />} />
              <Route path="student-fees" element={<StudentFeesPage />} />
              <Route path="salaries" element={<SalariesPage />} />
              <Route path="expenses" element={<ExpensesPage />} />

              <Route path="messages" element={<MessagesPage />} />
              <Route path="roles" element={<RolesPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
