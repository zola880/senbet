import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useContext } from 'react';
import AuthContext from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

const Login = lazy(() => import('./pages/Login'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const TeacherPage = lazy(() => import('./pages/TeacherPage'));
const StudentPage = lazy(() => import('./pages/StudentPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="full-page-loader">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="full-page-loader"><div className="spinner" /><p>Loading...</p></div>}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={`/${user.role}`} /> : <Login />} />
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
        <Route path="/" element={<Navigate to={user ? `/${user.role}` : '/login'} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;