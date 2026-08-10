import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useContext } from 'react';
import AuthContext from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy load pages for code splitting
const Login = lazy(() => import('./pages/Login'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const TeacherPage = lazy(() => import('./pages/TeacherPage'));
const StudentPage = lazy(() => import('./pages/StudentPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

/**
 * Main application router with authentication and role-based access control.
 */
function App() {
  const { user, loading } = useContext(AuthContext);

  // Show loading spinner while auth state is being restored
  if (loading) {
    return <LoadingSpinner fullPage message="Checking authentication..." />;
  }

  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Loading page..." />}>
      <Routes>
        {/* Login route - redirect if already authenticated */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={`/${user.role}`} replace />
            ) : (
              <Login />
            )
          }
        />

        {/* Protected routes - require authentication + specific role */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/*"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentPage />
            </ProtectedRoute>
          }
        />

        {/* Root redirect - send to dashboard or login */}
        <Route
          path="/"
          element={
            <Navigate to={user ? `/${user.role}` : '/login'} replace />
          }
        />

        {/* 404 fallback - must be last */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;