import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome, FiUsers, FiBook, FiGrid, FiClipboard, FiAward,
  FiCalendar, FiLogOut, FiCheckSquare, FiFolder, FiBell,
  FiMenu, FiX, FiChevronRight, FiBarChart2,
} from 'react-icons/fi';

import AuthContext from '../../context/AuthContext';
import crestImage from '../../assets/L.png';
import './Sidebar.css';

/* --------------------------------------------------------------------------
   Nav configuration — hoisted so it isn't rebuilt on every render
   -------------------------------------------------------------------------- */
const NAV_LINKS = {
  admin: [
    { to: '/admin', icon: FiHome, label: 'Dashboard' },
    { to: '/admin/users', icon: FiUsers, label: 'Users' },
    { to: '/admin/classes', icon: FiGrid, label: 'Classes' },
    { to: '/admin/courses', icon: FiBook, label: 'Courses' },
    { to: '/admin/scores', icon: FiClipboard, label: 'Enter Scores' },
    { to: '/admin/ranking', icon: FiAward, label: 'Ranking' },
    { to: '/admin/attendance', icon: FiCheckSquare, label: 'Attendance' },
    { to: '/admin/church-cloth', icon: FiCheckSquare, label: 'Church Cloth' },
    { to: '/admin/practices', icon: FiCalendar, label: 'Practice Days' },
    { to: '/admin/development', icon: FiBarChart2, label: 'Department Reports' },
  ],
  teacher: [
    { to: '/teacher', icon: FiHome, label: 'Dashboard' },
    { to: '/teacher/courses', icon: FiBook, label: 'My Courses' },
    { to: '/teacher/enter-marks', icon: FiClipboard, label: 'Enter Marks' },
    { to: '/teacher/students', icon: FiUsers, label: 'Student List' },
    { to: '/teacher/attendance', icon: FiCheckSquare, label: 'Take Attendance' },
    { to: '/teacher/practices', icon: FiCalendar, label: 'Practice Days' },
  ],
  student: [
    { to: '/student', icon: FiHome, label: 'Dashboard' },
    { to: '/student/marks', icon: FiClipboard, label: 'My Marks' },
    { to: '/student/rank', icon: FiAward, label: 'My Rank' },
    { to: '/student/attendance', icon: FiCheckSquare, label: 'My Attendance' },
    { to: '/student/materials', icon: FiFolder, label: 'My Courses' },
    { to: '/student/notifications', icon: FiBell, label: 'Notifications' },
    { to: '/student/practices', icon: FiCalendar, label: 'Practice Days' },
  ],
  development: [
    { to: '/development', icon: FiHome, label: 'ልማት Home' },
  ],
};

const getInitials = (name) => {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
};

/* --------------------------------------------------------------------------
   Main Component
   -------------------------------------------------------------------------- */
const Sidebar = ({ role }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const closeButtonRef = useRef(null);

  const links = useMemo(() => NAV_LINKS[role] ?? [], [role]);
  const roleLabel = role ? role.toUpperCase() : '';

  const closeSidebar = useCallback(() => setIsOpen(false), []);

  // Close the drawer whenever the route changes (covers programmatic nav too)
  useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  // Lock body scroll and allow Escape-to-close while the mobile drawer is open
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeSidebar();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeSidebar]);

  // If the viewport grows past the mobile breakpoint, drop any stuck-open drawer state
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 901px)');
    const handleChange = (e) => { if (e.matches) closeSidebar(); };
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, [closeSidebar]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout?.();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoggingOut(false);
      navigate('/login');
    }
  };

  return (
    <div className="sidebar-shell">
      {/* Hamburger button – visible only on mobile */}
      <button
        type="button"
        className={`sidebar-toggle ${isOpen ? 'sidebar-toggle-open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        aria-controls="app-sidebar"
      >
        {isOpen ? <FiX size={22} /> : <FiMenu size={22} />}
      </button>

      {/* Backdrop for mobile drawer */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="app-sidebar"
        className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}
        aria-hidden={!isOpen && undefined}
      >
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img src={crestImage} alt="" className="sidebar-crest" aria-hidden="true" />
            <h3 className="sidebar-title">
              መስቀለብርሃን ሰንበት<br />ትምህርት ቤት
            </h3>
          </div>
          {roleLabel && <span className="sidebar-role-badge">{roleLabel}</span>}
          <button
            ref={closeButtonRef}
            type="button"
            className="sidebar-close-inline"
            onClick={closeSidebar}
            aria-label="Close menu"
          >
            <FiX size={20} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === `/${role}`}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                <Icon size={19} aria-hidden="true" />
                <span>{link.label}</span>
                <FiChevronRight className="sidebar-nav-chevron" size={15} aria-hidden="true" />
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info-sidebar">
            <span className="sidebar-avatar" aria-hidden="true">{getInitials(user?.fullName)}</span>
            <div className="user-info-text">
              <strong title={user?.fullName}>{user?.fullName || 'Unknown user'}</strong>
              <span title={user?.email}>{user?.email || '—'}</span>
            </div>
          </div>
          <button
            className="logout-btn"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Logout"
            aria-label="Logout"
          >
            <FiLogOut className={isLoggingOut ? 'sidebar-spin-icon' : ''} />
          </button>
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;