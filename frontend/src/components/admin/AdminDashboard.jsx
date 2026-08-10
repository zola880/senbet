import { useEffect, useMemo, useRef, useState } from 'react';
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

/* --------------------------------------------------------------------------
   Scripture verses — rotate on a timer inside the illuminated ribbon.
   Add / edit verses here; the ribbon adapts to however many you provide.
   -------------------------------------------------------------------------- */
const VERSES = [
  {
    text: 'የሰማይ አምላክ ያከናውንልናል፤ እኛም ባሪያዎቹ ተነሥተን እንሠራለን።',
    source: 'ነህምያ 2:20',
  },
  {
    text: 'ሥራህን ለጌታ አደራ ስጥ፤ ሐሳብህም ይጸናል።',
    source: 'ምሳሌ 16:3',
  },
  {
    text: 'የምትሠሩትን ሁሉ ለሰው ሳይሆን ለጌታ እንደምትሠሩ በትጋት አድርጉት።',
    source: 'ቆላሲስ 3:23',
  },
  {
    text: 'መልካም ማድረግን አንታክት፤ ካልደከምን በጊዜው እናጭዳለንና።',
    source: 'ገላትያ 6:9',
  },
  {
    text: 'ኃይልን በሚሰጠኝ በክርስቶስ ሁሉን እችላለሁ።',
    source: 'ፊልጵስዩስ 4:13',
  },
];

const VERSE_INTERVAL_MS = 7000;

/* --------------------------------------------------------------------------
   Illuminated verse ribbon — the dashboard's signature element.
   Fades between scripture verses; pauses politely on hover/focus.
   -------------------------------------------------------------------------- */
const VerseRibbon = () => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const pausedRef = useRef(false);

  useEffect(() => {
    const tick = setInterval(() => {
      if (pausedRef.current) return;

      setVisible(false);

      window.setTimeout(() => {
        setIndex((prev) => (prev + 1) % VERSES.length);
        setVisible(true);
      }, 380);
    }, VERSE_INTERVAL_MS);

    return () => clearInterval(tick);
  }, []);

  const verse = VERSES[index];

  return (
    <div
      className="admin-verse-ribbon"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      onFocus={() => (pausedRef.current = true)}
      onBlur={() => (pausedRef.current = false)}
      role="region"
      aria-label="Scripture of the day"
    >
      <span className="admin-verse-mark" aria-hidden="true">
        ✝
      </span>

      <div
        className={`admin-verse-copy ${visible ? 'is-visible' : ''}`}
        key={index}
      >
        <p className="admin-verse-text">{verse.text}</p>
        <span className="admin-verse-source">{verse.source}</span>
      </div>

      <div className="admin-verse-dots" aria-hidden="true">
        {VERSES.map((v, i) => (
          <span
            key={v.source}
            className={`admin-verse-dot ${
              i === index ? 'is-active' : ''
            }`}
          />
        ))}
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   Count-up number — small bit of life for the stat cards once data lands.
   -------------------------------------------------------------------------- */
const useCountUp = (target, active) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }

    const duration = 700;
    const start = performance.now();
    const from = 0;

    let frame;
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, active]);

  return value;
};

const StatValue = ({ target, isLoading }) => {
  const value = useCountUp(target, !isLoading);

  if (isLoading) {
    return (
      <span className="admin-stat-skeleton" aria-hidden="true" />
    );
  }

  return <>{formatNumber(value)}</>;
};

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

      <div className="admin-dashboard-pattern" aria-hidden="true" />
      <div className="admin-dashboard-background-wash" aria-hidden="true" />

      <main className="admin-dashboard-content">
        <header className="admin-dashboard-header">
          <div className="admin-dashboard-header-left">
            <h1 className="admin-dashboard-title">Admin Dashboard</h1>

            <p className="admin-dashboard-subtitle-am">
              መስቀለ ብርሃን ስንበት ትምህርት ቤት
            </p>
          </div>
        </header>

        <VerseRibbon />

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
                        <FiArrowUpRight size={18} strokeWidth={2} />
                      </span>
                    </span>

                    <span className="admin-stat-details">
                      <span className="admin-stat-value">
                        <StatValue
                          target={card.count}
                          isLoading={isLoading}
                        />
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