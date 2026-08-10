import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiAlertTriangle, FiAward, FiCheckCircle, FiChevronDown,
  FiInbox, FiRefreshCw, FiTrendingUp, FiTrophy, FiUsers, FiX
} from 'react-icons/fi';
import { FaCrown, FaMedal } from 'react-icons/fa';

import api from '../../services/api';
import bgImage from '../../assets/L.png';
import './FullRanking.css';

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */
const formatScore = (value) =>
  typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : '—';

const getInitials = (name) => (name?.trim()?.charAt(0).toUpperCase()) || '?';

/* --------------------------------------------------------------------------
   Data Hook: Classes
   -------------------------------------------------------------------------- */
const useClasses = () => {
  const [classes, setClasses] = useState([]);
  const [status, setStatus] = useState('loading');
  const abortRef = useRef(null);

  const reload = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('loading');
    try {
      const res = await api.get('/api/v1/classes', { signal: controller.signal });
      setClasses(Array.isArray(res.data?.data) ? res.data.data : []);
      setStatus('success');
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
      console.error('Failed to load classes:', err);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    reload();
    return () => abortRef.current?.abort();
  }, [reload]);

  return { classes, status, reload };
};

/* --------------------------------------------------------------------------
   Data Hook: Ranking
   -------------------------------------------------------------------------- */
const useRanking = (selectedClass) => {
  const [ranking, setRanking] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const [retryToken, setRetryToken] = useState(0);

  const retry = useCallback(() => setRetryToken((n) => n + 1), []);

  useEffect(() => {
    if (!selectedClass) {
      setRanking([]);
      setStatus('idle');
      setError(null);
      return undefined;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('loading');
    setError(null);

    api
      .get(`/api/v1/rankings/class/${selectedClass}`, { signal: controller.signal })
      .then((res) => {
        if (controller.signal.aborted) return;
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        setRanking(data);
        if (data.length === 0) {
          setError('No ranking data available. Ensure students have scores and an assessment config is set.');
        }
        setStatus('success');
      })
      .catch((err) => {
        if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
        console.error('Failed to load ranking:', err);
        setRanking([]);
        if (err.response?.status === 400) {
          setError('Assessment configuration is missing for this class. Please set it up first.');
        } else if (!err.response) {
          setError('Network error. Check your connection and try again.');
        } else {
          setError('Failed to load ranking data.');
        }
        setStatus('error');
      });

    return () => controller.abort();
  }, [selectedClass, retryToken]);

  return { ranking, status, error, retry };
};

/* --------------------------------------------------------------------------
   Podium Component (Top 3)
   -------------------------------------------------------------------------- */
const PODIUM_META = {
  1: { position: 'fr-podium-1', label: 'Champion', icon: <FaCrown size={22} aria-hidden="true" /> },
  2: { position: 'fr-podium-2', label: 'Runner-up', icon: <FaMedal size={18} aria-hidden="true" /> },
  3: { position: 'fr-podium-3', label: 'Third Place', icon: <FaMedal size={18} aria-hidden="true" /> },
};

const PodiumSlot = ({ student, rank }) => {
  const meta = PODIUM_META[rank];

  if (!student) {
    return <div className={`fr-podium-block fr-podium-empty ${meta.position}`} aria-hidden="true" />;
  }

  return (
    <div className={`fr-podium-block ${meta.position}`}>
      <div className="fr-podium-crown">{meta.icon}</div>
      <div className="fr-podium-avatar">{getInitials(student.fullName)}</div>
      <h3 className="fr-podium-name" title={student.fullName}>{student.fullName || 'Unnamed student'}</h3>
      <span className="fr-podium-score">{formatScore(student.overallTotal)}</span>
      <span className="fr-podium-rank">{meta.label}</span>
      <div className="fr-podium-pillar" />
    </div>
  );
};

const Podium = ({ top3 }) => {
  if (top3.length === 0) return null;

  // Visual podium order is 2nd, 1st, 3rd — keeps the champion centered.
  const layout = [
    { student: top3[1], rank: 2 },
    { student: top3[0], rank: 1 },
    { student: top3[2], rank: 3 },
  ];

  return (
    <div className="fr-podium" aria-label="Top 3 students">
      {layout.map(({ student, rank }) => (
        <PodiumSlot key={student?.studentId ?? `empty-${rank}`} student={student} rank={rank} />
      ))}
    </div>
  );
};

/* --------------------------------------------------------------------------
   Small presentational helpers
   -------------------------------------------------------------------------- */
const Toast = ({ toast, onClose }) => {
  if (!toast.message) return null;
  return (
    <div className={`fr-toast fr-toast--${toast.type}`} role="alert">
      {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
      <span>{toast.message}</span>
      <button className="fr-toast-close" onClick={onClose} aria-label="Dismiss notification">
        <FiX size={16} />
      </button>
    </div>
  );
};

const EmptyState = ({ icon, title, children, action }) => (
  <div className="fr-state">
    {icon}
    <h3>{title}</h3>
    <p>{children}</p>
    {action}
  </div>
);

/* --------------------------------------------------------------------------
   Main Component
   -------------------------------------------------------------------------- */
const FullRanking = () => {
  const { classes, status: classStatus, reload: reloadClasses } = useClasses();
  const [selectedClass, setSelectedClass] = useState('');
  const [toast, setToast] = useState({ type: '', message: '' });
  const toastTimerRef = useRef(null);

  const { ranking, status, error, retry } = useRanking(selectedClass);

  const isLoading = status === 'loading';
  const hasRanking = ranking.length > 0;
  const selectedClassName = classes.find((c) => c._id === selectedClass)?.name;

  const { top3, rest, maxScore } = useMemo(() => {
    const sorted = ranking;
    const scores = sorted.map((s) => s.overallTotal || 0);
    return {
      top3: sorted.slice(0, 3),
      rest: sorted.slice(3),
      maxScore: scores.length > 0 ? Math.max(...scores) : 0,
    };
  }, [ranking]);

  const showToast = useCallback((type, message) => {
    clearTimeout(toastTimerRef.current);
    setToast({ type, message });
    toastTimerRef.current = setTimeout(() => setToast({ type: '', message: '' }), 4000);
  }, []);

  const dismissToast = useCallback(() => {
    clearTimeout(toastTimerRef.current);
    setToast({ type: '', message: '' });
  }, []);

  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  useEffect(() => {
    if (error && status === 'error') {
      showToast('error', error);
    }
  }, [error, status, showToast]);

  return (
    <section className="fr-page">
      <div className="fr-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="fr-wash" aria-hidden="true" />

      <Toast toast={toast} onClose={dismissToast} />

      <main className="fr-content">
        <header className="fr-header">
          <div className="fr-header-icon" aria-hidden="true"><FiTrophy size={28} /></div>
          <div>
            <h1 className="fr-title">Class Ranking</h1>
            <p className="fr-subtitle">View academic performance rankings across your classes.</p>
          </div>
        </header>

        {/* Class Selector */}
        <div className="fr-toolbar">
          <div className="fr-select-group">
            <label htmlFor="fr-class-select" className="fr-label">Select Class</label>
            <div className="fr-select-wrapper">
              <select
                id="fr-class-select"
                className="fr-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                disabled={classStatus === 'loading' || (classStatus === 'success' && classes.length === 0)}
              >
                <option value="">
                  {classStatus === 'loading' ? 'Loading classes…' : '-- Choose a class --'}
                </option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              <FiChevronDown className="fr-select-icon" aria-hidden="true" />
            </div>
          </div>

          {selectedClass && (
            <div className="fr-active-badge">
              <FiUsers size={16} />
              <span>Viewing: <strong>{selectedClassName}</strong></span>
            </div>
          )}

          {hasRanking && !isLoading && (
            <button className="fr-btn fr-btn--ghost fr-refresh-btn" onClick={retry}>
              <FiRefreshCw size={15} /> Refresh
            </button>
          )}
        </div>

        {/* Classes failed to load */}
        {classStatus === 'error' && (
          <EmptyState
            icon={<FiAlertTriangle size={32} />}
            title="Couldn't load classes"
            action={
              <button className="fr-btn fr-btn--primary" onClick={reloadClasses}>
                <FiRefreshCw size={16} /> Try Again
              </button>
            }
          >
            Something went wrong while fetching your class list. Please try again.
          </EmptyState>
        )}

        {/* No classes exist yet */}
        {classStatus === 'success' && classes.length === 0 && (
          <EmptyState icon={<FiInbox size={40} />} title="No classes found">
            Create a class first to start tracking rankings.
          </EmptyState>
        )}

        {/* Initial State */}
        {!selectedClass && classStatus === 'success' && classes.length > 0 && (
          <div className="fr-hero">
            <div className="fr-hero-icon" aria-hidden="true"><FiTrendingUp size={48} /></div>
            <h2>Ready to View Rankings</h2>
            <p>Select a class from the dropdown above to see student rankings based on their overall academic performance.</p>
            <div className="fr-hero-quote">
              <span className="fr-quote-mark" aria-hidden="true">&ldquo;</span>
              <p>በትጋት ያለው ሁሉ ይበልጣል፤ ሰነፉ ግን ያሳፍራል</p>
              <span className="fr-quote-author">– ምሳሌ 10:4</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="fr-state" role="status" aria-live="polite">
            <span className="fr-spinner" aria-hidden="true" />
            <p>Calculating rankings…</p>
          </div>
        )}

        {/* Ranking failed to load (and no cached data to fall back on) */}
        {!isLoading && status === 'error' && !hasRanking && error && (
          <EmptyState
            icon={<FiAlertTriangle size={32} />}
            title="Couldn't load rankings"
            action={
              <button className="fr-btn fr-btn--primary" onClick={retry}>
                <FiRefreshCw size={16} /> Try Again
              </button>
            }
          >
            {error}
          </EmptyState>
        )}

        {/* Ranking Results */}
        {!isLoading && hasRanking && (
          <>
            <div className="fr-summary">
              <div className="fr-summary-card">
                <FiUsers size={20} />
                <div>
                  <strong>{ranking.length}</strong>
                  <span>Total Students</span>
                </div>
              </div>
              <div className="fr-summary-card">
                <FiAward size={20} />
                <div>
                  <strong>{top3.length}</strong>
                  <span>Top Performers</span>
                </div>
              </div>
              <div className="fr-summary-card">
                <FiTrendingUp size={20} />
                <div>
                  <strong>{formatScore(maxScore)}</strong>
                  <span>Highest Score</span>
                </div>
              </div>
            </div>

            <Podium top3={top3} />

            {rest.length > 0 && (
              <div className="fr-ranking-list">
                <h2 className="fr-list-title">All Students</h2>
                <div className="fr-table-wrapper">
                  <table className="fr-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Student Name</th>
                        <th>Roll No</th>
                        <th className="fr-th-right">Total Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rest.map((student) => (
                        <tr key={student.studentId}>
                          <td data-label="Rank">
                            <span className="fr-rank-badge">{student.rank ?? '—'}</span>
                          </td>
                          <td data-label="Name">
                            <div className="fr-student-cell">
                              <span className="fr-avatar" aria-hidden="true">
                                {getInitials(student.fullName)}
                              </span>
                              <span className="fr-student-name">{student.fullName || 'Unnamed student'}</span>
                            </div>
                          </td>
                          <td data-label="Roll No">{student.rollNumber || '—'}</td>
                          <td data-label="Total Score" className="fr-td-right">
                            <div className="fr-score-cell">
                              <strong>{formatScore(student.overallTotal)}</strong>
                              <div className="fr-progress-bar">
                                <div
                                  className="fr-progress-fill"
                                  style={{ width: `${maxScore > 0 ? ((student.overallTotal || 0) / maxScore) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty State: class selected, request succeeded, but no data */}
        {!isLoading && !hasRanking && selectedClass && status === 'success' && (
          <EmptyState icon={<FiInbox size={40} />} title="No Rankings Available">
            No students or scores found for this class. Enter marks first to generate rankings.
          </EmptyState>
        )}
      </main>
    </section>
  );
};

export default FullRanking;