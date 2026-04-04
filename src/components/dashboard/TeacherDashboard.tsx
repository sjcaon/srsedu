import { Routes, Route } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import TeacherSidebar from './TeacherSidebar';
import TeacherOverview from '@/pages/teacher/TeacherOverview';
import TeacherAttendance from '@/pages/teacher/TeacherAttendance';
import TeacherResults from '@/pages/teacher/TeacherResults';
import TeacherRoutine from '@/pages/teacher/TeacherRoutine';
import TeacherMessages from '@/pages/teacher/TeacherMessages';
import StudentNotices from '@/pages/student/StudentNotices';

export default function TeacherDashboard() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <TeacherSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-card px-4">
            <SidebarTrigger />
            <h2 className="ml-4 text-lg font-display font-semibold text-foreground">Teacher Dashboard</h2>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route index element={<TeacherOverview />} />
              <Route path="attendance" element={<TeacherAttendance />} />
              <Route path="results" element={<TeacherResults />} />
              <Route path="routine" element={<TeacherRoutine />} />
              <Route path="notices" element={<StudentNotices />} />
              <Route path="messages" element={<TeacherMessages />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
