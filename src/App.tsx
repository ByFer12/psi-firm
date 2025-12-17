import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './router/ProtectedRoute';
import { PublicRoute } from './router/PublicRoute';

import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ConfirmEmailPage } from './pages/auth/ConfirmEmailPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
// import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

import { PatientDashboard } from './pages/dashboard/PatientDashboard';
import { EmployeeDashboard } from './pages/dashboard/EmployeeDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas Públicas (Cualquiera puede ver, o redireccionan si ya logueado) */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            {/* <Route path="/reset-password" element={<ResetPasswordPage />} /> */}
          </Route>

          {/* Ruta Especial: Landing es pública pero el navbar cambia si estás logueado, se maneja internamente */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/api/auth/confirm-email/:token" element={<ConfirmEmailPage />} /> {/* URL que llega del email */}

          {/* Rutas Protegidas - PACIENTE */}
          <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
            <Route path="/dashboard/paciente" element={<PatientDashboard />} />
            {/* <Route path="/dashboard/paciente/citas" element={<PatientAppointments />} /> */}
          </Route>

          {/* Rutas Protegidas - EMPLEADOS/ADMIN */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'PSYCHOLOGIST', 'PSYCHIATRIST', 'ADMINISTRATIVE']} />}>
             <Route path="/dashboard/empleado" element={<EmployeeDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
    </AuthProvider>
  );
}

export default App;