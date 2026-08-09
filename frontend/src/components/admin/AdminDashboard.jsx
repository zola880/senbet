import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers,
  FiUserCheck,
  FiGrid,
  FiBook,
  FiArrowUpRight,
  FiActivity,
  FiCalendar,
  FiCheckCircle,
} from 'react-icons/fi';

import api from '../../services/api';
import bgImage from '../../assets/L.png';
import './AdminDashboard.css';

const INITIAL_STATS = Object.freeze({
  totalStudents: 0,
  totalTeachers: 0,
  totalClasses: 0,
  totalCourses: 0,
});

const numberFormatter = new Intl.NumberFormat();

const formatNumber = (value) =>
  numberFormatter.format(Number(value) || 0);

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState(INITIAL_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        const response = await api.get('/api/v1/dashboard/admin');
        const dashboard = response?.data?.data ?? {};

        if (!isMounted) return;

        setStats({
          totalStudents: Number(dashboard.totalStudents) || 0,
          totalTeachers: Number(dashboard.totalTeachers) || 0,
          totalClasses: Number(dashboard.totalClasses) || 0,
          totalCourses: Number(dashboard.totalCourses) || 0,
        });
      } catch (error) {
        if (!isMounted) return;

        console.error('Unable to load admin dashboard statistics.', error);
        setHasError(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboardStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const statCards = useMemo(
    () => [
      {
        id: 'students',
        label: 'Students',
        description: 'Registered students',
        count: stats.totalStudents,
        icon: FiUsers,
        link: '/admin/users',
        accent: 'blue',
      },
      {
        id: 'teachers',
        label: 'Teachers',
        description: 'Teaching staff',
        count: stats.totalTeachers,
        icon: FiUserCheck,
        link: '/admin/users',
        accent: 'violet',
      },
      {
        id: 'classes',
        label: 'Classes',
        description: 'Active classes',
        count: stats.totalClasses,
        icon: FiGrid,
        link: '/admin/classes',
        accent: 'emerald',
      },
      {
        id: 'courses',
        label: 'Courses',
        description: 'Available courses',
        count: stats.totalCourses,
        icon: FiBook,
        link: '/admin/courses',
        accent: 'orange',
      },
    ],
    [stats]
  );

  const quickActions = [
    {
      label: 'Manage Students',
      description: 'View and manage student accounts',
      icon: FiUsers,
      link: '/admin/users',
    },
    {
      label: 'Manage Classes',
      description: 'Organize school classes',
      icon: FiGrid,
      link: '/admin/classes',
    },
    {
      label: 'Manage Courses',
      description: 'View and manage courses',
      icon: FiBook,
      link: '/admin/courses',
    },
  ];

  return (
    <section className="admin-dashboard-page">
      <div
        className="admin-dashboard-background"
        style={{ backgroundImage: `url(${bgImage})` }}
        aria-hidden="true"
      />

      <div
        className="admin-dashboard-background-wash"
        aria-hidden="true"
      />

      <main className="admin-dashboard-content">
        <header className="admin-dashboard-header">
          <div className="admin-dashboard-header-left">
            <div className="admin-dashboard-badge">
              <span className="admin-dashboard-badge-dot" />
              Administration
            </div>

            <h1 className="admin-dashboard-title">
              Admin Dashboard
            </h1>

            <p className="admin-dashboard-subtitle-am">
              መስቀለ ብርሃን ስንበት ትምህርት ቤት
            </p>

            <p className="admin-dashboard-description">
              Welcome back. Manage your school community,
              classes, teachers, students, and courses from one place.
            </p>
          </div>

          <div className="admin-dashboard-header-decoration">
            <div className="admin-dashboard-decoration-icon">
              <FiActivity size={25} />
            </div>

            <div>
              <span>School Management</span>
              <strong>Overview</strong>
            </div>
          </div>
        </header>

        {hasError && (
          <div className="admin-dashboard-alert" role="alert">
            <FiActivity size={18} />
            <span>
              Unable to load live statistics. Showing the latest
              available values.
            </span>
          </div>
        )}

        <section className="admin-dashboard-section">
          <div className="admin-section-heading">
            <div>
              <span className="admin-section-label">OVERVIEW</span>
              <h2>School Statistics</h2>
            </div>

            <span className="admin-section-status">
              <FiCheckCircle size={15} />
              Live data
            </span>
          </div>

          <ul
            className="admin-dashboard-stats"
            aria-label="School statistics"
          >
            {statCards.map((card) => {
              const Icon = card.icon;

              const accessibleLabel = isLoading
                ? `Loading ${card.label.toLowerCase()} statistics`
                : `${card.label}: ${formatNumber(
                    card.count
                  )}. Open ${card.label.toLowerCase()} management.`;

              return (
                <li key={card.id}>
                  <button
                    type="button"
                    className={`admin-stat-card admin-stat-card-${card.accent}`}
                    onClick={() => navigate(card.link)}
                    aria-label={accessibleLabel}
                  >
                    <span className="admin-stat-card-top">
                      <span className="admin-stat-icon">
                        <Icon size={22} strokeWidth={2} />
                      </span>

                      <span className="admin-stat-arrow">
                        <FiArrowUpRight
                          size={18}
                          strokeWidth={2}
                        />
                      </span>
                    </span>

                    <span className="admin-stat-details">
                      <span className="admin-stat-value">
                        {isLoading ? (
                          <span
                            className="admin-stat-skeleton"
                            aria-hidden="true"
                          />
                        ) : (
                          formatNumber(card.count)
                        )}
                      </span>

                      <span className="admin-stat-label">
                        {card.label}
                      </span>

                      <span className="admin-stat-description">
                        {card.description}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="admin-dashboard-lower">
          <div className="admin-welcome-card">
            <div className="admin-welcome-content">
              <span className="admin-welcome-label">
                SCHOOL ADMINISTRATION
              </span>

              <h2>
                Everything you need,
                <br />
                in one place.
              </h2>

              <p>
                Keep your Sunday school organized and easily manage
                the most important parts of your school.
              </p>

              <div className="admin-welcome-meta">
                <span>
                  <FiCalendar size={16} />
                  School Management
                </span>

                <span>
                  <FiCheckCircle size={16} />
                  Organized &amp; Efficient
                </span>
              </div>
            </div>

            <div className="admin-welcome-cross">
              <img src={bgImage} alt="" aria-hidden="true" />
            </div>
          </div>

          <div className="admin-quick-card">
            <div className="admin-quick-header">
              <span className="admin-section-label">QUICK ACCESS</span>
              <h2>Management</h2>
            </div>

            <div className="admin-quick-list">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <button
                    key={action.label}
                    type="button"
                    className="admin-quick-action"
                    onClick={() => navigate(action.link)}
                  >
                    <span className="admin-quick-icon">
                      <Icon size={19} />
                    </span>

                    <span className="admin-quick-text">
                      <strong>{action.label}</strong>
                      <small>{action.description}</small>
                    </span>

                    <FiArrowUpRight
                      className="admin-quick-arrow"
                      size={18}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </section>
  );
};

export default AdminDashboard;