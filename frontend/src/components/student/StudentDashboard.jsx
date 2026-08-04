import { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import {
  FiBook,
  FiCalendar,
  FiAward,
  FiCheckSquare,
  FiClipboard,
  FiBell,
  FiFolder,
  FiArrowRight,
  FiClock,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user: authUser } = useContext(AuthContext);
  const [data, setData] = useState({
    user: authUser || { fullName: 'Student', class: { name: 'Grade 5' } },
    upcomingPractices: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/v1/dashboard/student')
      .then((res) => {
        if (res.data?.data) {
          setData(res.data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const student = data.user || authUser || {};
  const upcomingPractices = data.upcomingPractices || [];

  const statCards = [
    {
      id: 'class',
      title: 'Current Class',
      value: student.class?.name || 'Assigned Class',
      icon: FiBook,
      link: '/student/materials',
      color: '#6b1a24',
    },
    {
      id: 'attendance',
      title: 'My Attendance',
      value: 'Good Standing',
      icon: FiCheckSquare,
      link: '/student/attendance',
      color: '#1e7e40',
    },
    {
      id: 'rank',
      title: 'Academic Rank',
      value: 'View Rank',
      icon: FiAward,
      link: '/student/rank',
      color: '#d97706',
    },
    {
      id: 'practices',
      title: 'Upcoming Practices',
      value: `${upcomingPractices.length} Scheduled`,
      icon: FiCalendar,
      link: '/student/practices',
      color: '#3b82f6',
    },
  ];

  return (
    <div className="student-dashboard-wrapper">
      {/* Background Overlay */}
      <div className="student-bg-layer" />

      <div className="student-dashboard-content">
        {/* Welcome Header */}
        <div className="student-header">
          <div className="header-greeting">
            <span className="greeting-pill">እንኳን ደህና መጡ 👋</span>
            <h1 className="student-title">
              {student.fullName ? student.fullName : 'የተማሪ መቆጣጠሪያ ሰሌዳ'}
            </h1>
            <p className="student-subtitle">
              መስቀለ ብርሃን ሰንበት ትምህርት ቤት | Student Dashboard
            </p>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="student-stats-grid">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="student-stat-card"
                onClick={() => navigate(card.link)}
                role="button"
                tabIndex={0}
              >
                <div className="stat-card-icon-box" style={{ color: card.color }}>
                  <Icon size={24} />
                </div>
                <div className="stat-card-info">
                  <span className="stat-card-title">{card.title}</span>
                  <h3 className="stat-card-val">{card.value}</h3>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions Bar */}
        <div className="student-card quick-actions-card">
          <h2 className="card-heading-sm">Quick Actions</h2>
          <div className="quick-buttons-row">
            <button
              className="student-action-btn"
              onClick={() => navigate('/student/marks')}
            >
              <FiClipboard /> My Exam Marks
            </button>
            <button
              className="student-action-btn"
              onClick={() => navigate('/student/rank')}
            >
              <FiAward /> My Rank & Standing
            </button>
            <button
              className="student-action-btn"
              onClick={() => navigate('/student/materials')}
            >
              <FiFolder /> Course Materials
            </button>
            <button
              className="student-action-btn"
              onClick={() => navigate('/student/attendance')}
            >
              <FiCheckSquare /> Attendance History
            </button>
            <button
              className="student-action-btn"
              onClick={() => navigate('/student/notifications')}
            >
              <FiBell /> Notifications
            </button>
          </div>
        </div>

        {/* Bottom Section: Upcoming Practices & School Announcements */}
        <div className="student-bottom-grid">
          {/* Upcoming Practices */}
          <div className="student-card practices-card">
            <div className="card-header-flex">
              <h2 className="card-heading">Upcoming Practices</h2>
              <button
                className="btn-text-link"
                onClick={() => navigate('/student/practices')}
              >
                Full Calendar <FiArrowRight />
              </button>
            </div>

            <div className="card-body-content">
              {upcomingPractices.length > 0 ? (
                <div className="practices-list">
                  {upcomingPractices.map((p) => (
                    <div key={p._id} className="practice-row-item">
                      <div className="practice-row-main">
                        <FiClock className="practice-row-icon" />
                        <div>
                          <h4 className="practice-row-title">{p.title}</h4>
                          <p className="practice-row-meta">
                            {p.startTime || 'Scheduled Time'}{' '}
                            {p.supervisor?.fullName && `• Supervisor: ${p.supervisor.fullName}`}
                          </p>
                        </div>
                      </div>
                      <span className="practice-status-tag">Upcoming</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state-box">
                  <FiCalendar size={32} className="empty-icon" />
                  <p>No upcoming practice sessions scheduled for this week.</p>
                </div>
              )}
            </div>
          </div>

          {/* Student Guidelines / Announcements */}
          <div className="student-card announcements-card">
            <h2 className="card-heading">Sunday School Noticeboard</h2>
            <div className="notice-list">
              <div className="notice-item">
                <div className="notice-icon"><FiBell size={18} /></div>
                <div>
                  <h4 className="notice-title">Choir & Exam Preparation</h4>
                  <p className="notice-desc">
                    Please ensure all assigned spiritual course materials are reviewed before the end-of-term evaluations.
                  </p>
                </div>
              </div>
              <div className="notice-item">
                <div className="notice-icon"><FiBook size={18} /></div>
                <div>
                  <h4 className="notice-title">Church Attire Reminder</h4>
                  <p className="notice-desc">
                    Proper Netela and Sunday School uniform must be worn during all practice days and services.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;