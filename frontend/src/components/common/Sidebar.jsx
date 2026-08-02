import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import {
  FiHome,
  FiUsers,
  FiBook,
  FiGrid,
  FiClipboard,
  FiAward,
  FiCalendar,
  FiLogOut,
  FiCheckSquare,
  FiFolder,
  FiBell,
  FiMenu,
  FiX,
} from 'react-icons/fi';

const Sidebar = ({ role }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const adminLinks = [
    { to: '/admin', icon: <FiHome />, label: 'Dashboard' },
    { to: '/admin/users', icon: <FiUsers />, label: 'Users' },
    { to: '/admin/classes', icon: <FiGrid />, label: 'Classes' },
    { to: '/admin/courses', icon: <FiBook />, label: 'Courses' },
    { to: '/admin/assignments', icon: <FiClipboard />, label: 'Assignments' },
    { to: '/admin/assessment', icon: <FiClipboard />, label: 'Assessment Config' },
    { to: '/admin/scores', icon: <FiClipboard />, label: 'Enter Scores' },
    { to: '/admin/ranking', icon: <FiAward />, label: 'Ranking' },
    { to: '/admin/attendance', icon: <FiCheckSquare />, label: 'Attendance' },
    { to: '/admin/church-cloth', icon: <FiCheckSquare />, label: 'Church Cloth' },
    { to: '/admin/practices', icon: <FiCalendar />, label: 'Practice Days' },
  ];

  const teacherLinks = [
    { to: '/teacher', icon: <FiHome />, label: 'Dashboard' },
    { to: '/teacher/courses', icon: <FiBook />, label: 'My Courses' },
    { to: '/teacher/enter-marks', icon: <FiClipboard />, label: 'Enter Marks' },
    { to: '/teacher/students', icon: <FiUsers />, label: 'Student List' },
    { to: '/teacher/attendance', icon: <FiCheckSquare />, label: 'Take Attendance' },
    { to: '/teacher/practices', icon: <FiCalendar />, label: 'Practice Days' },
  ];

  const studentLinks = [
    { to: '/student', icon: <FiHome />, label: 'Dashboard' },
    { to: '/student/marks', icon: <FiClipboard />, label: 'My Marks' },
    { to: '/student/rank', icon: <FiAward />, label: 'My Rank' },
    { to: '/student/attendance', icon: <FiCheckSquare />, label: 'My Attendance' },
    { to: '/student/materials', icon: <FiFolder />, label: 'My Courses' },
    { to: '/student/notifications', icon: <FiBell />, label: 'Notifications' },
    { to: '/student/practices', icon: <FiCalendar />, label: 'Practice Days' },
  ];

  const links =
    role === 'admin' ? adminLinks : role === 'teacher' ? teacherLinks : studentLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Hamburger button – visible only on mobile */}
      <button
        className={`sidebar-toggle ${isOpen ? 'sidebar-toggle-open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h3>የተማሪ ሥርዓት</h3>
          <span>{role.toUpperCase()}</span>
        </div>
        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === `/${role}`}
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={() => setIsOpen(false)}  // close after tap on mobile
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info-sidebar">
            <strong>{user?.fullName}</strong>
            <span>{user?.email}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <FiLogOut />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;