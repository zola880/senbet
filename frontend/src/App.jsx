import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from './context/AuthContext';
import Login from './pages/Login';
import AdminPage from './pages/AdminPage';
import TeacherPage from './pages/TeacherPage';
import StudentPage from './pages/StudentPage';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/common/ProtectedRoute';

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
  );
}

export default App;