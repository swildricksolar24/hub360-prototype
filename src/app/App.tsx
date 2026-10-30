import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { RequireAuth } from './auth/RequireAuth';
import { DashboardPage } from './pages/app/dashboard/DashboardPage';
import { HelpPage } from './pages/app/HelpPage';
import { WarehousesPage } from './pages/app/inventory/WarehousesPage';
import { AccountSettingsPage } from './pages/app/account/AccountSettingsPage';
import { NewTabPage, SectionPage } from './pages/app/SectionPage';
import { ForgotPasswordPage, ResetPasswordPage, ResetSuccessPage, VerifyEmailPage } from './pages/auth/PasswordResetPages';
import { SignInPage } from './pages/auth/SignInPage';
import { SignUpPage } from './pages/auth/SignUpPage';
import { AppShell } from './shell/AppShell';
import { DEFAULT_SECTION } from './shell/navigation';

/** Signed-in users skip the sign-in screens. */
function PublicOnly() {
  const { user } = useAuth();
  return user ? <Navigate to="/app" replace /> : <Outlet />;
}

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <Routes>
          <Route element={<PublicOnly />}>
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/reset-password/success" element={<ResetSuccessPage />} />
          </Route>

          {/* One shell for every /app page, so open tabs survive navigation. */}
          <Route
            path="/app"
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to={DEFAULT_SECTION} replace />} />
            <Route path="account" element={<AccountSettingsPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="inventory/warehouses" element={<WarehousesPage />} />
            <Route path="new-tab/:id" element={<NewTabPage />} />
            {/* New sections: add `<Route path="<section>/<page>" element={…} />` above this generic route. */}
            <Route path=":section/:page?" element={<SectionPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
