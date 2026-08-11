import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
          assignments: Array.isArray(response.data.data.assignments)
            ? response.data.data.assignments
            : [],
          upcomingPracticeCount:
            Number(response.data.data.upcomingPracticeCount) || 0,
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
      className="td-verse-ribbon"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      onFocus={() => (pausedRef.current = true)}
      onBlur={() => (pausedRef.current = false)}
      role="region"
      aria-label="Scripture of the day"
    >
      <span className="td-verse-mark" aria-hidden="true">
        ✝
      </span>

      <div className={`td-verse-copy ${visible ? 'is-visible' : ''}`} key={index}>
        <p className="td-verse-text">{verse.text}</p>
        <span className="td-verse-source">{verse.source}</span>
      </div>

      <div className="td-verse-dots" aria-hidden="true">
        {VERSES.map((v, i) => (
          <span
            key={v.source}
            className={`td-verse-dot ${i === index ? 'is-active' : ''}`}
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

    let frame;
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, active]);

  return value;
};

const AnimatedValue = ({ target, active }) => {
  const value = useCountUp(target, active);
  return <>{formatNumber(value)}</>;
};

/* --------------------------------------------------------------------------
   Main Component
   -------------------------------------------------------------------------- */
const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user: authUser } = useContext(AuthContext);

  const { data, status, reload } = useTeacherDashboardData();
  const isLoading = status === 'loading';
  const hasError = status === 'error';
  const hasData =
    data.assignments.length > 0 ||
    data.assignmentsCount > 0 ||
    data.upcomingPracticeCount > 0;

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
      <div className="td-pattern" aria-hidden="true" />
      <div className="td-overlay" aria-hidden="true" />

      <main className="td-content">
        <header className="td-header">
          <span className="td-eyebrow">Teacher Portal</span>
          <h1 className="td-title">
            የ ቤሮ ደብረ ምህረት ቅድስት ስላሴ ወ ቅዱስ ላሊበላ
          </h1>
          <p className="td-subtitle-am">መስቀለ ብርሃን ስንበት ትምህርት ቤት</p>
          <p className="td-subtitle-en">{welcomeMessage}</p>
        </header>

        <VerseRibbon />

        {hasError && (
          <div className="td-alert" role="alert">
            <FiAlertTriangle size={18} />
            <span>Unable to load live data. Showing latest available values.</span>
            <button
              className="td-alert-btn"
              onClick={reload}
              aria-label="Retry loading data"
            >
              <FiRefreshCw size={14} />
            </button>
          </div>
        )}

        <ul className="td-stats" aria-label="Teaching statistics">
          {statCards.map((card) => {
            const Icon = card.icon;
            const accessibleLabel =
              isLoading && !hasData
                ? `Loading ${card.label.toLowerCase()}`
                : `${card.label}: ${formatNumber(
                    card.count
                  )}. Open ${card.label.toLowerCase()}.`;

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
                        <AnimatedValue target={card.count} active={!isLoading} />
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