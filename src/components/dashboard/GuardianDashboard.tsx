import { Routes, Route } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import GuardianSidebar from './GuardianSidebar';
import GuardianOverview from '@/pages/guardian/GuardianOverview';
import GuardianResults from '@/pages/guardian/GuardianResults';
import GuardianAttendance from '@/pages/guardian/GuardianAttendance';
import GuardianFees from '@/pages/guardian/GuardianFees';
import GuardianNotices from '@/pages/guardian/GuardianNotices';
import GuardianMessages from '@/pages/guardian/GuardianMessages';

export default function GuardianDashboard() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <GuardianSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-card px-4">
            <SidebarTrigger />
            <h2 className="ml-4 text-lg font-display font-semibold text-foreground">Guardian Dashboard</h2>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route index element={<GuardianOverview />} />
              <Route path="results" element={<GuardianResults />} />
              <Route path="attendance" element={<GuardianAttendance />} />
              <Route path="fees" element={<GuardianFees />} />
              <Route path="notices" element={<GuardianNotices />} />
              <Route path="messages" element={<GuardianMessages />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
