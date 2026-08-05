import { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import {
  FiBook,
  FiCalendar,
  FiUsers,
  FiCheckCircle,
  FiEdit,
  FiGrid,
  FiArrowRight,
  FiClock,
  FiPlus,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user: authUser } = useContext(AuthContext);
  const [data, setData] = useState({
    assignmentsCount: 0,
    assignments: [],
    upcomingPracticeCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/v1/dashboard/teacher')
      .then((res) => {
        if (res.data?.data) {
          setData(res.data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const teacher = authUser || {};
  const { assignmentsCount, assignments, upcomingPracticeCount } = data;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const statCards = [
    {
      id: 'courses',
      title: 'My Courses',
      value: `${assignmentsCount || assignments.length || 0} Assigned`,
      icon: FiBook,
      link: '/teacher/courses',
      color: '#ff8a98',
      bg: 'rgba(107,26,36,0.5)',
    },
    {
      id: 'students',
      title: 'Student Roster',
      value: 'View Students',
      icon: FiUsers,
      link: '/teacher/students',
      color: '#7dd3fc',
      bg: 'rgba(14,90,150,0.4)',
    },
    {
      id: 'attendance',
      title: 'Take Attendance',
      value: 'Record Today',
      icon: FiCheckCircle,
      link: '/teacher/attendance',
      color: '#6ee7a0',
      bg: 'rgba(20,100,60,0.4)',
    },
    {
      id: 'practices',
      title: 'Upcoming Practices',
      value: `${upcomingPracticeCount} Sessions`,
      icon: FiCalendar,
      link: '/teacher/practices',
      color: '#fbbf24',
      bg: 'rgba(120,70,0,0.4)',
    },
  ];

  return (
    <div className="teacher-dashboard-wrapper">
      {/* Background Layer */}
      <div className="teacher-bg-layer" />

      <div className="teacher-dashboard-content">
        {/* Welcome Header */}
        <div className="teacher-header">
          <div className="header-greeting">
            <span className="greeting-pill">እንኳን ደህና መጡ 👋</span>
            <h1 className="teacher-title">
              {teacher.fullName ? teacher.fullName : 'መምህራን መቆጣጠሪያ ሰሌዳ'}
            </h1>
            <p className="teacher-subtitle">
              መስቀለ ብርሃን ሰንበት ትምህርት ቤት | Teacher Portal
            </p>
          </div>
          <div className="header-right-meta">
            <div className="header-date-chip">
              <FiCalendar size={13} />
              {dateStr}
            </div>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="teacher-stats-grid">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="teacher-stat-card"
                onClick={() => navigate(card.link)}
                role="button"
                tabIndex={0}
              >
                <div className="stat-card-icon-box" style={{ background: card.bg, color: card.color }}>
                  <Icon size={20} />
                </div>
                <div className="stat-card-info">
                  <span className="stat-card-title">{card.title}</span>
                  <h3 className="stat-card-val">{card.value}</h3>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions Card */}
        <div className="teacher-card quick-actions-card">
          <h2 className="card-heading-sm">Quick Actions</h2>
          <div className="quick-buttons-row">
            <button
              className="teacher-action-btn"
              onClick={() => navigate('/teacher/enter-marks')}
            >
              <FiEdit size={14} /> Enter Student Marks
            </button>
            <button
              className="teacher-action-btn"
              onClick={() => navigate('/teacher/attendance')}
            >
              <FiCheckCircle size={14} /> Record Attendance
            </button>
            <button
              className="teacher-action-btn"
              onClick={() => navigate('/teacher/students')}
            >
              <FiUsers size={14} /> View Student List
            </button>
            <button
              className="teacher-action-btn"
              onClick={() => navigate('/teacher/courses')}
            >
              <FiBook size={14} /> Manage My Courses
            </button>
          </div>
        </div>

        {/* Main Teaching Assignments & Practice Supervision Grid */}
        <div className="teacher-bottom-grid">
          {/* My Teaching Assignments */}
          <div className="teacher-card assignments-card">
            <div className="card-header-flex">
              <h2 className="card-heading">My Teaching Assignments</h2>
              <button
                className="btn-text-link"
                onClick={() => navigate('/teacher/courses')}
              >
                View All <FiArrowRight />
              </button>
            </div>

            <div className="card-body-content">
              {assignments && assignments.length > 0 ? (
                <div className="assignments-list">
                  {assignments.map((a) => (
                    <div key={a._id} className="assignment-row-item">
                      <div className="assignment-row-main">
                        <div className="assignment-icon-badge">
                          <FiBook size={16} />
                        </div>
                        <div>
                          <h4 className="assignment-row-title">
                            {a.course?.name || 'Assigned Course'}
                          </h4>
                          <p className="assignment-row-meta">
                            Class: {a.class?.name || 'General Class'}
                          </p>
                        </div>
                      </div>
                      <div className="assignment-actions">
                        <button
                          className="btn-pill-sm"
                          onClick={(e) => { e.stopPropagation(); navigate('/teacher/enter-marks'); }}
                        >
                          Enter Marks
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state-box">
                  <FiGrid size={28} className="empty-icon" />
                  <p>No teaching assignments currently assigned. Please contact the administrator.</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Practice Supervision */}
          <div className="teacher-card supervision-card">
            <div className="card-header-flex">
              <h2 className="card-heading">Upcoming Practice Schedule</h2>
              <button
                className="btn-text-link"
                onClick={() => navigate('/teacher/practices')}
              >
                View Schedule <FiArrowRight />
              </button>
            </div>

            <div className="card-body-content">
              <div className="supervision-info-box">
                <div className="info-icon"><FiClock size={18} /></div>
                <div>
                  <h4 className="info-title">Weekly Choir & Practice Sessions</h4>
                  <p className="info-desc">
                    Monitor attendance and coordinate with student leads during scheduled choir sessions.
                  </p>
                </div>
              </div>

              <div className="schedule-mini-badge">
                <FiCheckCircle size={12} />
                <span>Active Practice Supervisor</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;