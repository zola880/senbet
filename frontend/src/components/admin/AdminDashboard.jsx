import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers,
  FiUserCheck,
  FiGrid,
  FiBook,
  FiArrowRight,
} from 'react-icons/fi';

import api from '../../services/api';
import bgImage from '../../assets/c.jpg';
import './AdminDashboard.css';

const INITIAL_STATS = Object.freeze({
  totalStudents: 0,
  totalTeachers: 0,
  totalClasses: 0,
  totalCourses: 0,
});

const numberFormatter = new Intl.NumberFormat();

const formatNumber = (value) => numberFormatter.format(Number(value) || 0);

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
        count: stats.totalStudents,
        icon: FiUsers,
        link: '/admin/users',
      },
      {
        id: 'teachers',
        label: 'Teachers',
        count: stats.totalTeachers,
        icon: FiUserCheck,
        link: '/admin/users',
      },
      {
        id: 'classes',
        label: 'Classes',
        count: stats.totalClasses,
        icon: FiGrid,
        link: '/admin/classes',
      },
      {
        id: 'courses',
        label: 'Courses',
        count: stats.totalCourses,
        icon: FiBook,
        link: '/admin/courses',
      },
    ],
    [stats]
  );

  return (
    <section className="admin-dashboard-page">
      <div
        className="admin-dashboard-background"
        style={{ backgroundImage: `url(${bgImage})` }}
        aria-hidden="true"
      />

      <div className="admin-dashboard-overlay" aria-hidden="true" />

      <main className="admin-dashboard-content">
        <header className="admin-dashboard-header">
          <span className="admin-dashboard-eyebrow">Admin Dashboard</span>

          <h1 className="admin-dashboard-title">
            የቤሮ ደብረ ምህረት ቅድስት ስላሴ ወ ቅዱስ ላሊበላ
          </h1>

          <p className="admin-dashboard-subtitle-am">
            መስቀለ ብርሃን ስንበት ትምህርት ቤት
          </p>

          <p className="admin-dashboard-subtitle-en">
            Manage your school with ease and efficiency.
          </p>
        </header>

        {hasError && (
          <div className="admin-dashboard-alert" role="alert">
            Unable to load live statistics. Showing latest available values.
          </div>
        )}

        <ul className="admin-dashboard-stats" aria-label="School statistics">
          {statCards.map((card) => {
            const Icon = card.icon;

            const accessibleLabel = isLoading
              ? `Loading ${card.label.toLowerCase()} statistics`
              : `${card.label}: ${formatNumber(card.count)}. Open ${card.label.toLowerCase()} management.`;

            return (
              <li key={card.id}>
                <button
                  type="button"
                  className="admin-stat-card"
                  onClick={() => navigate(card.link)}
                  aria-label={accessibleLabel}
                  disabled={false}
                >
                  <span className="admin-stat-icon" aria-hidden="true">
                    <Icon size={22} strokeWidth={1.8} />
                  </span>

                  <span className="admin-stat-details">
                    <span className="admin-stat-value">
                      {isLoading ? (
                        <span className="admin-stat-skeleton" aria-hidden="true" />
                      ) : (
                        formatNumber(card.count)
                      )}
                    </span>

                    <span className="admin-stat-label">{card.label}</span>
                  </span>

                  <span className="admin-stat-action" aria-hidden="true">
                    <FiArrowRight size={18} strokeWidth={1.8} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </main>
    </section>
  );
};

export default AdminDashboard;