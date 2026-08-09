import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiArrowRight,
  FiBook,
  FiCalendar,
  FiCheckCircle,
  FiInbox,
  FiRefreshCw,
} from 'react-icons/fi';

import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import bgImage from '../../assets/L.png';
import './TeacherDashboard.css';

/* --------------------------------------------------------------------------
   Data hook: Fetch Teacher Dashboard Data with AbortController
   -------------------------------------------------------------------------- */
const useTeacherDashboardData = () => {
  const [data, setData] = useState({
    assignmentsCount: 0,
    assignments: [],
    upcomingPracticeCount: 0,
  });
  const [status, setStatus] = useState('loading');
  const abortRef = useRef(null);

  const reload = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');

    try {
      const response = await api.get('/api/v1/dashboard/teacher', {
        signal: controller.signal,
      });

      if (response?.data?.data) {
        setData({
          assignmentsCount: Number(response.data.data.assignmentsCount) || 0,
          assignments: Array.isArray(response.data.data.assignments) ? response.data.data.assignments : [],
          upcomingPracticeCount: Number(response.data.data.upcomingPracticeCount) || 0,
        });
      }
      setStatus('success');
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
      console.error('Unable to load teacher dashboard data.', err);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    reload();
    return () => abortRef.current?.abort();
  }, [reload]);

  return { data, status, reload };
};

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */
const numberFormatter = new Intl.NumberFormat();
const formatNumber = (value) => numberFormatter.format(Number(value) || 0);

/* --------------------------------------------------------------------------
   Main Component
   -------------------------------------------------------------------------- */
const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user: authUser } = useContext(AuthContext);
  
  const { data, status, reload } = useTeacherDashboardData();
  const isLoading = status === 'loading';
  const hasError = status === 'error';
  const hasData = data.assignments.length > 0 || data.assignmentsCount > 0 || data.upcomingPracticeCount > 0;

  const teacher = authUser || {};
  const coursesCount = data.assignmentsCount || data.assignments.length || 0;

  const statCards = useMemo(
    () => [
      {
        id: 'courses',
        label: 'My Courses',
        count: coursesCount,
        icon: FiBook,
        link: '/teacher/courses',
      },
      {
        id: 'practices',
        label: 'Upcoming Practices',
        count: data.upcomingPracticeCount,
        icon: FiCalendar,
        link: '/teacher/practices',
      },
    ],
    [coursesCount, data.upcomingPracticeCount]
  );

  const welcomeMessage = teacher.fullName
    ? `Welcome, ${teacher.fullName}`
    : 'Sacred Chant - Wisdom for your ministry';

  return (
    <section className="td-page">
      <div
        className="td-bg"
        style={{ backgroundImage: `url(${bgImage})` }}
        aria-hidden="true"
      />
      <div className="td-overlay" aria-hidden="true" />

      <main className="td-content">
        <header className="td-header">
          <span className="td-eyebrow">Teacher Portal</span>
          <h1 className="td-title">
            የ ቤሮ ደብረ ምህረት ቅድስት ስላሴ ወ ቅዱስ ላሊበላ
          </h1>
          <p className="td-subtitle-am">
            መስቀለ ብርሃን ስንበት ትምህርት ቤት
          </p>
          <p className="td-subtitle-en">
            {welcomeMessage}
          </p>
        </header>

        {hasError && (
          <div className="td-alert" role="alert">
            <FiAlertTriangle size={18} />
            <span>Unable to load live data. Showing latest available values.</span>
            <button className="td-alert-btn" onClick={reload} aria-label="Retry loading data">
              <FiRefreshCw size={14} />
            </button>
          </div>
        )}

        <ul className="td-stats" aria-label="Teaching statistics">
          {statCards.map((card) => {
            const Icon = card.icon;
            const accessibleLabel = isLoading && !hasData
              ? `Loading ${card.label.toLowerCase()}`
              : `${card.label}: ${formatNumber(card.count)}. Open ${card.label.toLowerCase()}.`;

            return (
              <li key={card.id}>
                <button
                  type="button"
                  className="td-stat-card"
                  onClick={() => navigate(card.link)}
                  aria-label={accessibleLabel}
                  disabled={isLoading && !hasData}
                >
                  <span className="td-stat-icon" aria-hidden="true">
                    {isLoading && !hasData ? (
                      <span className="td-skeleton td-skeleton--icon" />
                    ) : (
                      <Icon size={22} strokeWidth={1.8} />
                    )}
                  </span>

                  <span className="td-stat-details">
                    <span className="td-stat-value">
                      {isLoading && !hasData ? (
                        <span className="td-skeleton td-skeleton--value" />
                      ) : (
                        formatNumber(card.count)
                      )}
                    </span>
                    <span className="td-stat-label">
                      {isLoading && !hasData ? (
                        <span className="td-skeleton td-skeleton--label" />
                      ) : (
                        card.label
                      )}
                    </span>
                  </span>

                  <span className="td-stat-action" aria-hidden="true">
                    <FiArrowRight size={18} strokeWidth={1.8} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <article className="td-assignments">
          <header className="td-assignments-header">
            <h2 className="td-assignments-title">My Teaching Assignments</h2>
            {!isLoading && data.assignments.length > 0 && (
              <span className="td-assignments-count">
                {data.assignments.length} Active
              </span>
            )}
          </header>

          <div className="td-assignments-body">
            {isLoading && !hasData ? (
              <ul className="td-assignments-list">
                {[1, 2, 3].map((i) => (
                  <li key={i} className="td-assignment-item">
                    <span className="td-skeleton td-skeleton--row" />
                  </li>
                ))}
              </ul>
            ) : data.assignments.length > 0 ? (
              <ul className="td-assignments-list">
                {data.assignments.map((assignment) => (
                  <li key={assignment._id} className="td-assignment-item">
                    <span className="td-assignment-icon" aria-hidden="true">
                      <FiCheckCircle size={18} strokeWidth={2} />
                    </span>
                    <span className="td-assignment-details">
                      <span className="td-assignment-course">
                        {assignment.course?.name || 'Assigned Course'}
                      </span>
                      <span className="td-assignment-class">
                        {assignment.class?.name || 'General Class'}
                      </span>
                    </span>
                    <span className="td-assignment-arrow" aria-hidden="true">
                      <FiArrowRight size={16} />
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="td-assignments-empty">
                <FiInbox size={32} aria-hidden="true" />
                <p>No teaching assignments currently assigned.</p>
                <button
                  type="button"
                  className="td-assignments-action"
                  onClick={() => navigate('/teacher/courses')}
                >
                  Browse available courses
                </button>
              </div>
            )}
          </div>
        </article>
      </main>
    </section>
  );
};

export default TeacherDashboard;