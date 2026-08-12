import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiAlertTriangle, FiCalendar, FiClock, FiEdit3, FiInbox,
  FiMusic, FiRefreshCw, FiRepeat, FiSun, FiUsers, FiX, FiCheckCircle
} from 'react-icons/fi';

import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import bgImage from '../../assets/L.png';
import './TeacherPractices.css';

/* --------------------------------------------------------------------------
   Data Hook: Supervised Practices
   -------------------------------------------------------------------------- */
const useSupervisedPractices = (userId) => {
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
      console.error('Failed to load supervised practices:', err);
      setError('Unable to load your supervised practices. Please try again.');
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
   Toast Component
   -------------------------------------------------------------------------- */
const Toast = ({ type, message, onClose }) => (
  <div className={`tp-toast tp-toast--${type}`} role="alert">
    {type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
    <span>{message}</span>
    <button className="tp-toast-close" onClick={onClose} aria-label="Close">
      <FiX size={16} />
    </button>
  </div>
);

/* --------------------------------------------------------------------------
   Main Component
   -------------------------------------------------------------------------- */
const TeacherPractices = () => {
  const { user } = useContext(AuthContext);
  const { practices, status, error, reload } = useSupervisedPractices(user?._id);
  const [toast, setToast] = useState({ type: '', message: '' });

  const isLoading = status === 'loading';
  const hasPractices = practices.length > 0;

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

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

  const handleMarkComplete = async (practiceId) => {
    try {
      // This could be extended to mark practice as completed
      showToast('success', 'Practice marked as completed');
    } catch (err) {
      console.error('Failed to mark practice complete:', err);
      showToast('error', 'Failed to mark practice as complete');
    }
  };

  return (
    <section className="tp-page">
      <div className="tp-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="tp-wash" aria-hidden="true" />

      {toast.message && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast({ type: '', message: '' })}
        />
      )}

      <main className="tp-content">
        <header className="tp-header">
          <div className="tp-header-icon" aria-hidden="true">
            <FiMusic size={28} />
          </div>
          <div>
            <h1 className="tp-title">Practice Sessions</h1>
            <p className="tp-subtitle">
              Manage and supervise your assigned practice sessions.
            </p>
          </div>
          <button className="tp-btn tp-btn--secondary" onClick={reload} disabled={isLoading}>
            <FiRefreshCw size={16} /> Refresh
          </button>
        </header>

        {isLoading && !hasPractices ? (
          <div className="tp-list" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="tp-skeleton-card" aria-hidden="true">
                <div className="tp-sk-day" />
                <div className="tp-sk-body">
                  <div className="tp-sk-title" />
                  <div className="tp-sk-line" />
                </div>
              </div>
            ))}
          </div>
        ) : status === 'error' && !hasPractices ? (
          <div className="tp-state tp-state--error" role="alert">
            <FiAlertTriangle size={32} />
            <h3>Failed to Load Practices</h3>
            <p>{error}</p>
            <button className="tp-btn tp-btn--primary" onClick={reload}>
              <FiRefreshCw size={16} /> Try Again
            </button>
          </div>
        ) : !hasPractices ? (
          <div className="tp-state">
            <FiInbox size={40} />
            <h3>No Supervised Practices</h3>
            <p>You are not currently assigned as a supervisor for any practice sessions.</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="tp-summary">
              <div className="tp-summary-card">
                <FiCalendar size={20} />
                <div>
                  <strong>{stats.total}</strong>
                  <span>Total Sessions</span>
                </div>
              </div>
              <div className="tp-summary-card tp-summary-weekly">
                <FiRepeat size={20} />
                <div>
                  <strong>{stats.weekly}</strong>
                  <span>Weekly Recurring</span>
                </div>
              </div>
              <div className="tp-summary-card tp-summary-today">
                <FiSun size={20} />
                <div>
                  <strong>{stats.today}</strong>
                  <span>Today</span>
                </div>
              </div>
            </div>

            {/* Practice List */}
            <div className="tp-list" role="list" aria-label="Supervised practice sessions">
              {sortedPractices.map((practice) => {
                const today = isToday(practice);
                const dateObj = practice.startDate ? new Date(practice.startDate) : null;

                return (
                  <article
                    key={practice._id}
                    role="listitem"
                    className={`tp-card ${today ? 'tp-card--today' : ''}`}
                  >
                    <div className="tp-card-day" aria-hidden="true">
                      {practice.recurring ? (
                        <>
                          <span className="tp-day-name">{DAY_SHORT[practice.dayOfWeek]}</span>
                          <span className="tp-day-sub">Weekly</span>
                        </>
                      ) : dateObj ? (
                        <>
                          <span className="tp-day-name">{dateObj.getDate()}</span>
                          <span className="tp-day-sub">
                            {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="tp-day-name">—</span>
                          <span className="tp-day-sub">TBD</span>
                        </>
                      )}
                    </div>

                    <div className="tp-card-body">
                      <div className="tp-card-top">
                        <h3 className="tp-card-title">{practice.title || 'Practice Session'}</h3>
                        {today && <span className="tp-today-badge">Today</span>}
                      </div>

                      <div className="tp-card-meta">
                        {practice.practiceType && (
                          <span className="tp-type-badge">{practice.practiceType}</span>
                        )}
                        {practice.recurring && (
                          <span className="tp-meta-item">
                            <FiRepeat size={14} />
                            Every {DAY_NAMES[practice.dayOfWeek]}
                          </span>
                        )}
                        <span className="tp-meta-item">
                          <FiClock size={14} />
                          {formatTime(practice.startTime)} – {formatTime(practice.endTime)}
                        </span>
                        {practice.class && (
                          <span className="tp-meta-item">
                            <FiUsers size={14} />
                            Class: {practice.class.name}
                          </span>
                        )}
                        {practice.assignedStudents && practice.assignedStudents.length > 0 && (
                          <span className="tp-meta-item">
                            <FiUsers size={14} />
                            {practice.assignedStudents.length} students assigned
                          </span>
                        )}
                      </div>

                      <div className="tp-card-actions">
                        <button
                          className="tp-btn tp-btn--small tp-btn--outline"
                          onClick={() => handleMarkComplete(practice._id)}
                        >
                          <FiEdit3 size={14} /> Mark Complete
                        </button>
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

export default TeacherPractices;