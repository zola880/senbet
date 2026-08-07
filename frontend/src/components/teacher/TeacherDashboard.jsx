import { useEffect, useMemo, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBook, FiCalendar, FiArrowRight, FiCheckCircle } from 'react-icons/fi';

import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import bgImage from '../../assets/c.jpg';
import './TeacherDashboard.css';

const INITIAL_DATA = Object.freeze({
  assignmentsCount: 0,
  assignments: [],
  upcomingPracticeCount: 0,
});

const numberFormatter = new Intl.NumberFormat();
const formatNumber = (value) => numberFormatter.format(Number(value) || 0);

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user: authUser } = useContext(AuthContext);

  const [data, setData] = useState(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchTeacherData = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        const response = await api.get('/api/v1/dashboard/teacher');

        if (!isMounted) return;

        if (response?.data?.data) {
          setData({
            assignmentsCount: Number(response.data.data.assignmentsCount) || 0,
            assignments: Array.isArray(response.data.data.assignments) ? response.data.data.assignments : [],
            upcomingPracticeCount: Number(response.data.data.upcomingPracticeCount) || 0,
          });
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Unable to load teacher dashboard data.', error);
        setHasError(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchTeacherData();

    return () => {
      isMounted = false;
    };
  }, []);

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
        accentColor: '#60a5fa',
      },
      {
        id: 'practices',
        label: 'Upcoming Practices',
        count: data.upcomingPracticeCount,
        icon: FiCalendar,
        link: '/teacher/practices',
        accentColor: '#c084fc',
      },
    ],
    [coursesCount, data.upcomingPracticeCount]
  );

  const welcomeMessage = teacher.fullName
    ? `Welcome, ${teacher.fullName}`
    : 'Sacred Chant - Wisdom for your ministry';

  return (
    <section className="teacher-dashboard-page">
      <div
        className="teacher-dashboard-background"
        style={{ backgroundImage: `url(${bgImage})` }}
        aria-hidden="true"
      />
      <div className="teacher-dashboard-overlay" aria-hidden="true" />

      <main className="teacher-dashboard-content">
        <header className="teacher-dashboard-header">
          <span className="teacher-dashboard-eyebrow">Teacher Portal</span>
          <h1 className="teacher-dashboard-title">
            የ ቤሮ ደብረ ምህረት ቅድስት ስላሴ ወ ቅዱስ ላሊበላ
          </h1>
          <p className="teacher-dashboard-subtitle-am">
            መስቀለ ብርሃን ስንበት ትምህርት ቤት
          </p>
          <p className="teacher-dashboard-subtitle-en">
            {welcomeMessage}
          </p>
        </header>

        {hasError && (
          <div className="teacher-dashboard-alert" role="alert">
            Unable to load live data. Showing latest available values.
          </div>
        )}

        <ul className="teacher-dashboard-stats" aria-label="Teaching statistics">
          {statCards.map((card) => {
            const Icon = card.icon;
            const accessibleLabel = isLoading
              ? `Loading ${card.label.toLowerCase()}`
              : `${card.label}: ${formatNumber(card.count)}. Open ${card.label.toLowerCase()}.`;

            return (
              <li key={card.id}>
                <button
                  type="button"
                  className="teacher-stat-card"
                  onClick={() => navigate(card.link)}
                  aria-label={accessibleLabel}
                  style={{ '--accent-color': card.accentColor }}
                >
                  <span className="teacher-stat-icon" aria-hidden="true">
                    <Icon size={22} strokeWidth={1.8} />
                  </span>

                  <span className="teacher-stat-details">
                    <span className="teacher-stat-value">
                      {isLoading ? (
                        <span className="teacher-stat-skeleton" aria-hidden="true" />
                      ) : (
                        formatNumber(card.count)
                      )}
                    </span>
                    <span className="teacher-stat-label">{card.label}</span>
                  </span>

                  <span className="teacher-stat-action" aria-hidden="true">
                    <FiArrowRight size={18} strokeWidth={1.8} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <article className="teacher-dashboard-assignments">
          <header className="teacher-assignments-header">
            <h2 className="teacher-assignments-title">My Teaching Assignments</h2>
            {!isLoading && data.assignments.length > 0 && (
              <span className="teacher-assignments-count">
                {data.assignments.length} Active
              </span>
            )}
          </header>

          <div className="teacher-assignments-body">
            {isLoading ? (
              <ul className="teacher-assignments-list">
                {[1, 2, 3].map((i) => (
                  <li key={i} className="teacher-assignment-item">
                    <span className="teacher-assignment-skeleton" aria-hidden="true" />
                  </li>
                ))}
              </ul>
            ) : data.assignments.length > 0 ? (
              <ul className="teacher-assignments-list">
                {data.assignments.map((assignment) => (
                  <li key={assignment._id} className="teacher-assignment-item">
                    <span className="teacher-assignment-icon" aria-hidden="true">
                      <FiCheckCircle size={16} strokeWidth={2} />
                    </span>
                    <span className="teacher-assignment-details">
                      <span className="teacher-assignment-course">
                        {assignment.course?.name || 'Assigned Course'}
                      </span>
                      <span className="teacher-assignment-class">
                        {assignment.class?.name || 'General Class'}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="teacher-assignments-empty">
                <p>No teaching assignments currently assigned.</p>
                <button
                  type="button"
                  className="teacher-assignments-action"
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