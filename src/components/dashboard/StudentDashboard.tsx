import { Routes, Route } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import StudentSidebar from './StudentSidebar';
import StudentOverview from '@/pages/student/StudentOverview';
import StudentResults from '@/pages/student/StudentResults';
import StudentAttendance from '@/pages/student/StudentAttendance';
import StudentRoutine from '@/pages/student/StudentRoutine';
import StudentNotices from '@/pages/student/StudentNotices';
import StudentMessages from '@/pages/student/StudentMessages';

export default function StudentDashboard() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <StudentSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-card px-4">
            <SidebarTrigger />
            <h2 className="ml-4 text-lg font-display font-semibold text-foreground">Student Dashboard</h2>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route index element={<StudentOverview />} />
              <Route path="results" element={<StudentResults />} />
              <Route path="attendance" element={<StudentAttendance />} />
              <Route path="routine" element={<StudentRoutine />} />
              <Route path="notices" element={<StudentNotices />} />
              <Route path="messages" element={<StudentMessages />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
