import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiAlertTriangle, FiCalendar, FiClock, FiInbox,
  FiMusic, FiRefreshCw, FiRepeat, FiSun
} from 'react-icons/fi';

import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import bgImage from '../../assets/L.png';
import './PracticeCalendar.css';

/* --------------------------------------------------------------------------
   Data Hook: My Practices
   -------------------------------------------------------------------------- */
const useMyPractices = (userId) => {
  const [practices, setPractices] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setPractices([]);
      setStatus('success');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setError(null);

    try {
      const res = await api.get('/api/v1/practices/my', { signal: controller.signal });
      setPractices(Array.isArray(res.data?.data) ? res.data.data : []);
      setStatus('success');
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
      console.error('Failed to load practices:', err);
      setError('Unable to load your practice schedule. Please try again.');
      setStatus('error');
    }
  }, [userId]);

  useEffect(() => {
    reload();
    return () => abortRef.current?.abort();
  }, [reload]);

  return { practices, status, error, reload };
};

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatTime = (time) => {
  if (!time) return '—';
  const [h, m] = String(time).split(':');
  const hour = parseInt(h, 10);
  if (isNaN(hour)) return time;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${m || '00'} ${suffix}`;
};

const isToday = (practice) => {
  const now = new Date();
  if (practice.recurring) return practice.dayOfWeek === now.getDay();
  const d = new Date(practice.startDate);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

/* --------------------------------------------------------------------------
   Main Component
   -------------------------------------------------------------------------- */
const PracticeCalendar = () => {
  const { user } = useContext(AuthContext);
  const { practices, status, error, reload } = useMyPractices(user?._id);

  const isLoading = status === 'loading';
  const hasPractices = practices.length > 0;

  const sortedPractices = useMemo(() => {
    const today = new Date().getDay();
    return [...practices].sort((a, b) => {
      if (a.recurring && b.recurring) {
        return ((a.dayOfWeek - today + 7) % 7) - ((b.dayOfWeek - today + 7) % 7);
      }
      if (a.recurring) return -1;
      if (b.recurring) return 1;
      return new Date(a.startDate) - new Date(b.startDate);
    });
  }, [practices]);

  const stats = useMemo(() => {
    const weekly = practices.filter((p) => p.recurring).length;
    const scheduled = practices.filter((p) => !p.recurring).length;
    const today = practices.filter((p) => isToday(p)).length;
    return { total: practices.length, weekly, scheduled, today };
  }, [practices]);

  return (
    <section className="pc-page">
      <div className="pc-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="pc-wash" aria-hidden="true" />

      <main className="pc-content">
        <header className="pc-header">
          <div className="pc-header-icon" aria-hidden="true">
            <FiMusic size={28} />
          </div>
          <div>
            <h1 className="pc-title">My Practice Days</h1>
            <p className="pc-subtitle">
              Your weekly and scheduled practice sessions, organized by day.
            </p>
          </div>
        </header>

        {isLoading && !hasPractices ? (
          <div className="pc-list" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="pc-skeleton-card" aria-hidden="true">
                <div className="pc-sk-day" />
                <div className="pc-sk-body">
                  <div className="pc-sk-title" />
                  <div className="pc-sk-line" />
                </div>
              </div>
            ))}
          </div>
        ) : status === 'error' && !hasPractices ? (
          <div className="pc-state pc-state--error" role="alert">
            <FiAlertTriangle size={32} />
            <h3>Failed to Load Practices</h3>
            <p>{error}</p>
            <button className="pc-btn pc-btn--primary" onClick={reload}>
              <FiRefreshCw size={16} /> Try Again
            </button>
          </div>
        ) : !hasPractices ? (
          <div className="pc-state">
            <FiInbox size={40} />
            <h3>No Practices Scheduled</h3>
            <p>You don't have any practice days assigned yet. Check back later!</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="pc-summary">
              <div className="pc-summary-card">
                <FiCalendar size={20} />
                <div>
                  <strong>{stats.total}</strong>
                  <span>Total Practices</span>
                </div>
              </div>
              <div className="pc-summary-card pc-summary-weekly">
                <FiRepeat size={20} />
                <div>
                  <strong>{stats.weekly}</strong>
                  <span>Weekly Recurring</span>
                </div>
              </div>
              <div className="pc-summary-card pc-summary-today">
                <FiSun size={20} />
                <div>
                  <strong>{stats.today}</strong>
                  <span>Today</span>
                </div>
              </div>
            </div>

            {/* Practice List */}
            <div className="pc-list" role="list" aria-label="Practice schedule">
              {sortedPractices.map((practice) => {
                const today = isToday(practice);
                const dateObj = practice.startDate ? new Date(practice.startDate) : null;

                return (
                  <article
                    key={practice._id}
                    role="listitem"
                    className={`pc-card ${today ? 'pc-card--today' : ''}`}
                  >
                    <div className="pc-card-day" aria-hidden="true">
                      {practice.recurring ? (
                        <>
                          <span className="pc-day-name">{DAY_SHORT[practice.dayOfWeek]}</span>
                          <span className="pc-day-sub">Weekly</span>
                        </>
                      ) : dateObj ? (
                        <>
                          <span className="pc-day-name">{dateObj.getDate()}</span>
                          <span className="pc-day-sub">
                            {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="pc-day-name">—</span>
                          <span className="pc-day-sub">TBD</span>
                        </>
                      )}
                    </div>

                    <div className="pc-card-body">
                      <div className="pc-card-top">
                        <h3 className="pc-card-title">{practice.title || 'Practice Session'}</h3>
                        {today && <span className="pc-today-badge">Today</span>}
                      </div>

                      <div className="pc-card-meta">
                        {practice.practiceType && (
                          <span className="pc-type-badge">{practice.practiceType}</span>
                        )}
                        {practice.recurring && (
                          <span className="pc-meta-item">
                            <FiRepeat size={14} />
                            Every {DAY_NAMES[practice.dayOfWeek]}
                          </span>
                        )}
                        <span className="pc-meta-item">
                          <FiClock size={14} />
                          {formatTime(practice.startTime)} – {formatTime(practice.endTime)}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </main>
    </section>
  );
};

export default PracticeCalendar;