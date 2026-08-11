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
  FiClipboard,
  FiRefreshCw,
  FiUsers,
} from 'react-icons/fi';

import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import bgImage from '../../assets/L.png';
import './StudentDashboard.css';

/* --------------------------------------------------------------------------
   Data hook: Fetch Student Dashboard Data with AbortController
   -------------------------------------------------------------------------- */
const useStudentDashboardData = () => {
  const [data, setData] = useState({
    user: null,
    courses: [],
  });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const reload = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setError(null);

    try {
      const response = await api.get('/api/v1/dashboard/student', {
        signal: controller.signal,
      });

      if (response?.data?.data) {
        setData(response.data.data);
      }
      setStatus('success');
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
      console.error('Unable to load student dashboard data.', err);
      setError('Unable to load dashboard data. Please try again.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    reload();
    return () => abortRef.current?.abort();
  }, [reload]);

  return { data, status, error, reload };
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
      className="std-verse-ribbon"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      onFocus={() => (pausedRef.current = true)}
      onBlur={() => (pausedRef.current = false)}
      role="region"
      aria-label="Scripture of the day"
    >
      <span className="std-verse-mark" aria-hidden="true">
        ✝
      </span>

      <div className={`std-verse-copy ${visible ? 'is-visible' : ''}`} key={index}>
        <p className="std-verse-text">{verse.text}</p>
        <span className="std-verse-source">{verse.source}</span>
      </div>

      <div className="std-verse-dots" aria-hidden="true">
        {VERSES.map((v, i) => (
          <span
            key={v.source}
            className={`std-verse-dot ${i === index ? 'is-active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   Count-up number — small bit of life for numeric stat values once data lands.
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
const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user: authUser } = useContext(AuthContext);

  const { data, status, error, reload } = useStudentDashboardData();
  const isLoading = status === 'loading';
  const hasError = status === 'error';
  const hasData = Boolean(data.user || data.courses?.length > 0);

  const student = data.user || authUser || {};

  const coursesCount = useMemo(() => {
    return (
      data.courses?.length ??
      student.class?.courses?.length ??
      student.courses?.length ??
      0
    );
  }, [data.courses, student]);

  const statCards = useMemo(
    () => [
      {
        id: 'class',
        label: 'Current Class',
        value: student.class?.name || 'Not Assigned',
        icon: FiUsers,
        link: '/student/materials',
        isText: true,
      },
      {
        id: 'courses',
        label: 'Total Courses',
        value: coursesCount,
        icon: FiBook,
        link: '/student/materials',
        isText: false,
      },
      {
        id: 'attendance',
        label: 'My Attendance',
        value: 'View',
        icon: FiClipboard,
        link: '/student/attendance',
        isText: true,
      },
    ],
    [student.class?.name, coursesCount]
  );

  const welcomeMessage = student.fullName
    ? `Welcome, ${student.fullName}`
    : 'Student Dashboard';

  return (
    <section className="std-page">
      <div
        className="std-bg"
        style={{ backgroundImage: `url(${bgImage})` }}
        aria-hidden="true"
      />
      <div className="std-pattern" aria-hidden="true" />
      <div className="std-overlay" aria-hidden="true" />

      <main className="std-content">
        <header className="std-header">
          <span className="std-eyebrow">Student Portal</span>
          <h1 className="std-title">
            የቤሮ ደብረ ምህረት ቅድስት ስላሴ ወ ቅዱስ ላሊበላ
          </h1>
          <p className="std-subtitle-am">መስቀለ ብርሃን ስንበት ትምህርት ቤት</p>
          <p className="std-subtitle-en">{welcomeMessage}</p>
        </header>

        <VerseRibbon />

        {hasError && (
          <div className="std-alert" role="alert">
            <FiAlertTriangle size={18} />
            <span>Unable to load live data. Showing latest available values.</span>
            <button
              className="std-alert-btn"
              onClick={reload}
              aria-label="Retry loading data"
            >
              <FiRefreshCw size={14} />
            </button>
          </div>
        )}

        <ul className="std-stats" aria-label="Student statistics">
          {statCards.map((card) => {
            const Icon = card.icon;
            const displayValue = card.isText
              ? card.value
              : formatNumber(card.value);

            const accessibleLabel =
              isLoading && !hasData
                ? `Loading ${card.label.toLowerCase()}`
                : `${card.label}: ${displayValue}. Open ${card.label.toLowerCase()}.`;

            return (
              <li key={card.id}>
                <button
                  type="button"
                  className="std-stat-card"
                  onClick={() => navigate(card.link)}
                  aria-label={accessibleLabel}
                  disabled={isLoading && !hasData}
                >
                  <span className="std-stat-icon" aria-hidden="true">
                    {isLoading && !hasData ? (
                      <span className="std-skeleton std-skeleton--icon" />
                    ) : (
                      <Icon size={22} strokeWidth={1.8} />
                    )}
                  </span>

                  <span className="std-stat-details">
                    <span className="std-stat-value">
                      {isLoading && !hasData ? (
                        <span className="std-skeleton std-skeleton--value" />
                      ) : card.isText ? (
                        card.value
                      ) : (
                        <AnimatedValue
                          target={card.value}
                          active={!isLoading}
                        />
                      )}
                    </span>
                    <span className="std-stat-label">
                      {isLoading && !hasData ? (
                        <span className="std-skeleton std-skeleton--label" />
                      ) : (
                        card.label
                      )}
                    </span>
                  </span>

                  <span className="std-stat-action" aria-hidden="true">
                    <FiArrowRight size={18} strokeWidth={1.8} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <article className="std-quick-actions">
          <header className="std-quick-header">
            <h2 className="std-quick-title">Quick Access</h2>
            <span className="std-quick-badge">
              <FiClipboard size={14} />
              Student Tools
            </span>
          </header>

          <div className="std-quick-list">
            {isLoading && !hasData ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="std-quick-item">
                  <span className="std-skeleton std-skeleton--quick-icon" />
                  <div className="std-quick-text">
                    <span className="std-skeleton std-skeleton--quick-title" />
                    <span className="std-skeleton std-skeleton--quick-desc" />
                  </div>
                </div>
              ))
            ) : (
              <>
                <button
                  className="std-quick-item"
                  onClick={() => navigate('/student/materials')}
                >
                  <span className="std-quick-icon" aria-hidden="true">
                    <FiBook size={19} />
                  </span>
                  <span className="std-quick-text">
                    <strong>Course Materials</strong>
                    <small>Access your study materials and resources</small>
                  </span>
                  <FiArrowRight className="std-quick-arrow" size={18} />
                </button>

                <button
                  className="std-quick-item"
                  onClick={() => navigate('/student/attendance')}
                >
                  <span className="std-quick-icon" aria-hidden="true">
                    <FiClipboard size={19} />
                  </span>
                  <span className="std-quick-text">
                    <strong>View Attendance</strong>
                    <small>Check your attendance records</small>
                  </span>
                  <FiArrowRight className="std-quick-arrow" size={18} />
                </button>

                <button
                  className="std-quick-item"
                  onClick={() => navigate('/student/ranking')}
                >
                  <span className="std-quick-icon" aria-hidden="true">
                    <FiUsers size={19} />
                  </span>
                  <span className="std-quick-text">
                    <strong>Class Ranking</strong>
                    <small>See your academic performance</small>
                  </span>
                  <FiArrowRight className="std-quick-arrow" size={18} />
                </button>
              </>
            )}
          </div>
        </article>
      </main>
    </section>
  );
};

export default StudentDashboard;