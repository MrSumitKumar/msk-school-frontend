import React from 'react';
import { Smartphone } from 'lucide-react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './app/authStore';
import { authApi } from './services/api';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import TeacherLayout from './layouts/TeacherLayout';
import StudentLayout from './layouts/StudentLayout';

// Pages — Auth
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import ModuleGuard from './components/ModuleGuard';

// Pages — Super Admin
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import SchoolsPage from './pages/superadmin/SchoolsPage';
import SchoolOwnersPage from './pages/superadmin/SchoolOwnersPage';
import PlansPage from './pages/superadmin/PlansPage';
import SubscriptionsPage from './pages/superadmin/SubscriptionsPage';
import PaymentsPage from './pages/superadmin/PaymentsPage';

// Pages — School Admin
import AdminDashboard from './pages/admin/Dashboard';
import StudentsPage from './pages/admin/StudentsPage';
import TeachersPage from './pages/admin/TeachersPage';
import AttendancePage from './pages/admin/AttendancePage';
import FeesPage from './pages/admin/FeesPage';
import ExamsPage from './pages/admin/ExamsPage';
import AcademicsPage from './pages/admin/AcademicsPage';
import TrashPage from './pages/admin/TrashPage';
import ActivityLogPage from './pages/admin/ActivityLogPage';
import SettingsPage from './pages/admin/SettingsPage';
import BillingPage from './pages/admin/BillingPage';
import MobileAppPage from './pages/admin/MobileAppPage';
import TimetablePage from './pages/admin/TimetablePage';

// Pages — Teacher
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherStudentsPage from './pages/teacher/StudentsPage';
import TeacherAttendancePage from './pages/teacher/AttendancePage';
import TeacherExamsPage from './pages/teacher/ExamsPage';

// Pages — Student
import StudentDashboard from './pages/student/Dashboard';
import StudentAttendancePage from './pages/student/AttendancePage';
import StudentFeesPage from './pages/student/FeesPage';
import StudentResultsPage from './pages/student/ResultsPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 * 5 } }
});

// Auto-redirect based on role after login
const RoleRedirect = () => {
  const { user } = useAuthStore();
  if (user?.role === 'super_admin') return <Navigate to="/super-admin" replace />;
  if (user?.role === 'teacher') return <Navigate to="/teacher" replace />;
  if (user?.role === 'student') return <Navigate to="/student" replace />;
  return <Navigate to="/admin" replace />;
};

// Theme and Profile Sync Component
const ThemeAndProfileSync = () => {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  // Global Theme Management
  React.useEffect(() => {
    if (user?.theme_preference === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [user?.theme_preference]);

  // Global Profile Synchronization (Fixes stale sidebar branding)
  // Sync on every navigation to catch backend changes (Django Admin edits)
  React.useEffect(() => {
    if (isAuthenticated) {
      authApi.me()
        .then(data => {
          // Only update if there's an actual change to avoid unnecessary re-renders
          if (data.school_name !== user?.school_name || data.school_logo !== user?.school_logo) {
            console.log('Profile change detected. Syncing:', data.school_name);
            useAuthStore.getState().updateUser(data);
          }
        })
        .catch(err => console.error('Profile sync failed:', err));
    }
  }, [isAuthenticated, location.pathname]); // Run on navigation

  return null;
};

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <ThemeAndProfileSync />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            isAuthenticated
              ? <RoleRedirect />
              : <Navigate to="/login" replace />
          } />

          {/* ── Super Admin ────────────────────────── */}
          <Route path="/super-admin" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <SuperAdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<SuperAdminDashboard />} />
            <Route path="schools" element={<SchoolsPage />} />
            <Route path="owners" element={<SchoolOwnersPage />} />
            <Route path="plans" element={<PlansPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="trash" element={<TrashPage />} />
            <Route path="activity-logs" element={<ActivityLogPage />} />

          </Route>

          {/* ── School Admin / Accountant ──────────── */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['school_admin', 'accountant']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<ModuleGuard moduleName="students"><StudentsPage /></ModuleGuard>} />
            <Route path="teachers" element={<ModuleGuard moduleName="teachers"><TeachersPage /></ModuleGuard>} />
            <Route path="attendance" element={<ModuleGuard moduleName="attendance"><AttendancePage /></ModuleGuard>} />
            <Route path="fees" element={<ModuleGuard moduleName="fees"><FeesPage /></ModuleGuard>} />
            <Route path="exams" element={<ModuleGuard moduleName="exams"><ExamsPage /></ModuleGuard>} />
            <Route path="academics" element={<ModuleGuard moduleName="academics"><AcademicsPage /></ModuleGuard>} />
            <Route path="trash" element={<ModuleGuard moduleName="trash"><TrashPage /></ModuleGuard>} />
            <Route path="activity-logs" element={<ModuleGuard moduleName="activity-logs"><ActivityLogPage /></ModuleGuard>} />
            <Route path="settings" element={<ModuleGuard moduleName="settings"><SettingsPage /></ModuleGuard>} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="timetable" element={<ModuleGuard moduleName="timetable"><TimetablePage /></ModuleGuard>} />
            <Route path="mobile-app" element={<ModuleGuard moduleName="mobile_app"><MobileAppPage /></ModuleGuard>} />

          </Route>

          {/* ── Teacher ───────────────────────────── */}
          <Route path="/teacher" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherLayout />
            </ProtectedRoute>
          }>
            <Route index element={<TeacherDashboard />} />
            <Route path="students" element={<TeacherStudentsPage />} />
            <Route path="attendance" element={<TeacherAttendancePage />} />
            <Route path="exams" element={<TeacherExamsPage />} />
          </Route>

          {/* ── Student ───────────────────────────── */}
          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['student', 'parent']}>
              <StudentLayout />
            </ProtectedRoute>
          }>
            <Route index element={<StudentDashboard />} />
            <Route path="attendance" element={<StudentAttendancePage />} />
            <Route path="fees" element={<StudentFeesPage />} />
            <Route path="results" element={<StudentResultsPage />} />
          </Route>

          {/* ── Misc ──────────────────────────────── */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1E293B', color: '#F1F5F9', border: '1px solid #334155', borderRadius: 10, fontSize: 14 },
            success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />
      </HashRouter>
    </QueryClientProvider>
  );
}
