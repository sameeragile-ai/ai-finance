import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './features/auth/LoginPage';
import { Loader2 } from 'lucide-react';

// Code split routes with React.lazy
const DashboardView = lazy(() =>
  import('./features/dashboard/DashboardView').then((m) => ({ default: m.DashboardView }))
);
const ClientsView = lazy(() =>
  import('./features/clients/ClientsView').then((m) => ({ default: m.ClientsView }))
);
const ClientDetailView = lazy(() =>
  import('./features/clients/ClientDetailView').then((m) => ({ default: m.ClientDetailView }))
);
const PipelineView = lazy(() =>
  import('./features/pipeline/PipelineView').then((m) => ({ default: m.PipelineView }))
);
const DocumentsView = lazy(() =>
  import('./features/documents/DocumentsView').then((m) => ({ default: m.DocumentsView }))
);
const TasksView = lazy(() =>
  import('./features/tasks/TasksView').then((m) => ({ default: m.TasksView }))
);
const EmailCenterView = lazy(() =>
  import('./features/email/EmailCenterView').then((m) => ({ default: m.EmailCenterView }))
);
const UserManagementView = lazy(() =>
  import('./features/users/UserManagementView').then((m) => ({ default: m.UserManagementView }))
);
const BackupsView = lazy(() =>
  import('./features/backups/BackupsView').then((m) => ({ default: m.BackupsView }))
);
const SettingsView = lazy(() =>
  import('./features/settings/SettingsView').then((m) => ({ default: m.SettingsView }))
);

const PageLoader = () => (
  <div className="h-96 flex flex-col items-center justify-center gap-3">
    <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
    <span className="text-xs font-semibold text-slate-500">Loading Broker Workspace...</span>
  </div>
);

// Protected router wrapper
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardView />} />
          <Route path="clients" element={<ClientsView />} />
          <Route path="clients/:id" element={<ClientDetailView />} />
          <Route path="pipeline" element={<PipelineView />} />
          <Route path="documents" element={<DocumentsView />} />
          <Route path="tasks" element={<TasksView />} />
          <Route path="email" element={<EmailCenterView />} />
          <Route path="users" element={<UserManagementView />} />
          <Route path="backups" element={<BackupsView />} />
          <Route path="settings" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
