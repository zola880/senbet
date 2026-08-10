import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import AuthContext from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const KNOWN_DASHBOARDS = ['admin', 'teacher', 'student'];

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading = false } = useContext(AuthContext);
  const location = useLocation();

  /* ----------------------------------------------------------------------
     1) Auth state is still being restored (e.g., validating a stored token).
        Show a themed loader instead of flashing a redirect to /login.
     ---------------------------------------------------------------------- */
  if (loading) {
    return <LoadingSpinner fullPage message="Checking your session..." />;
  }

  /* ----------------------------------------------------------------------
     2) Not authenticated → go to login, but remember where they were headed
        so the Login page can redirect them back after signing in.
     ---------------------------------------------------------------------- */
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  const role = String(user.role || '').toLowerCase();
  const normalizedAllowed = allowedRoles.map((r) => String(r).toLowerCase());

  /* ----------------------------------------------------------------------
     3) Authenticated, but the role isn't permitted here →
        send them to their own dashboard (or home for unknown roles).
     ---------------------------------------------------------------------- */
  if (normalizedAllowed.length > 0 && !normalizedAllowed.includes(role)) {
    const home = KNOWN_DASHBOARDS.includes(role) ? `/${role}` : '/';
    return <Navigate to={home} replace />;
  }

  /* ----------------------------------------------------------------------
     4) All checks passed → render the protected content.
     ---------------------------------------------------------------------- */
  return children;
};

export default ProtectedRoute;