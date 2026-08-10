import { useState, useContext, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import './Sidebar.css';
import {
  FiHome, FiUsers, FiBook, FiGrid, FiClipboard, FiAward,
  FiCalendar, FiLogOut, FiCheckSquare, FiFolder, FiBell,
  FiMenu, FiX, FiTrendingUp
} from 'react-icons/fi';

const Sidebar = ({ role }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const adminLinks = [
    { to: '/admin', icon: <FiHome size={20} />, label: 'Dashboard' },
    { to: '/admin/users', icon: <FiUsers size={20} />, label: 'Users' },
    { to: '/admin/classes', icon: <FiGrid size={20} />, label: 'Classes' },
    { to: '/admin/courses', icon: <FiBook size={20} />, label: 'Courses' },
    { to: '/admin/scores', icon: <FiClipboard size={20} />, label: 'Enter Scores' },
    { to: '/admin/ranking', icon: <FiAward size={20} />, label: 'Ranking' },
    { to: '/admin/attendance', icon: <FiCheckSquare size={20} />, label: 'Attendance' },
    { to: '/admin/church-cloth', icon: <FiCheckSquare size={20} />, label: 'Church Cloth' },
    { to: '/admin/practices', icon: <FiCalendar size={20} />, label: 'Practice Days' },
  ];

  const teacherLinks = [
    { to: '/teacher', icon: <FiHome size={20} />, label: 'Dashboard' },
    { to: '/teacher/courses', icon: <FiBook size={20} />, label: 'My Courses' },
    { to: '/teacher/enter-marks', icon: <FiClipboard size={20} />, label: 'Enter Marks' },
    { to: '/teacher/students', icon: <FiUsers size={20} />, label: 'Student List' },
    { to: '/teacher/attendance', icon: <FiCheckSquare size={20} />, label: 'Take Attendance' },
    { to: '/teacher/practices', icon: <FiCalendar size={20} />, label: 'Practice Days' },
  ];

  const studentLinks = [
    { to: '/student', icon: <FiHome size={20} />, label: 'Dashboard' },
    { to: '/student/marks', icon: <FiClipboard size={20} />, label: 'My Marks' },
    { to: '/student/rank', icon: <FiAward size={20} />, label: 'My Rank' },
    { to: '/student/attendance', icon: <FiCheckSquare size={20} />, label: 'My Attendance' },
    { to: '/student/materials', icon: <FiFolder size={20} />, label: 'My Courses' },
    { to: '/student/notifications', icon: <FiBell size={20} />, label: 'Notifications' },
    { to: '/student/practices', icon: <FiCalendar size={20} />, label: 'Practice Days' },
  ];

  const links = role === 'admin' ? adminLinks : role === 'teacher' ? teacherLinks : studentLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [navigate]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Hamburger Button - Mobile Only */}
      <button
        className={`sidebar-toggle ${isOpen ? 'sidebar-toggle--open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`} role="navigation" aria-label="Main navigation">
        {/* Header */}
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <FiTrendingUp size={32} className="sidebar__logo-icon" />
            <div className="sidebar__logo-text">
              <h3 className="sidebar__title">መስቀለብርሃን ሰንበት</h3>
              <p className="sidebar__subtitle">ትምህርት ቤት</p>
            </div>
          </div>
          <span className="sidebar__role-badge">{role.toUpperCase()}</span>
        </div>

        {/* Navigation */}
        <nav className="sidebar__nav" aria-label="Main navigation">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === `/${role}`}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
              onClick={() => setIsOpen(false)}
            >
              <span className="sidebar__link-icon" aria-hidden="true">
                {link.icon}
              </span>
              <span className="sidebar__link-label">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar" aria-hidden="true">
              {user?.fullName?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="sidebar__user-info">
              <strong className="sidebar__user-name">{user?.fullName || 'User'}</strong>
              <span className="sidebar__user-email">{user?.email || ''}</span>
            </div>
          </div>
          <button
            className="sidebar__logout"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
          >
            <FiLogOut size={20} />
            <span className="sidebar__logout-label">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;