import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

function App() {
  return (
    <AuthProvider>
      {/* 2. USA HashRouter AQUÍ */}
      <HashRouter>
        <Routes>
          {/* ... TODO EL CONTENIDO DE TUS RUTAS SE QUEDA EXACTAMENTE IGUAL ... */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          <Route path="/" element={<LandingPage />} />
          {/* OJO: Quita el /api/auth/ de aquí, el frontend solo necesita la ruta visual */}
          <Route path="/confirm-email/:token" element={<ConfirmEmailPage />} /> 

          <Route element={<ProtectedRoute allowedRoles={[6]} />}>
            <Route path="/dashboard/paciente" element={<PatientDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[1, 2, 3, 4]} />}>
             <Route path="/dashboard/empleado" element={<EmployeeDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
      <ToastContainer position="top-right" autoClose={3000} />
    </AuthProvider>
  );
}

export default App;