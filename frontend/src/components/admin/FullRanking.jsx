import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FiAlertTriangle, FiAward, FiCheckCircle, FiChevronDown,
  FiInbox, FiRefreshCw, FiTrendingUp, FiTrophy, FiUsers, FiX
} from 'react-icons/fi';
import { FaCrown, FaMedal } from 'react-icons/fa';

import api from '../../services/api';
import bgImage from '../../assets/L.png';
import './FullRanking.css';

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

  useEffect(() => { reload(); return () => abortRef.current?.abort(); }, [reload]);
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

  useEffect(() => {
    if (!selectedClass) {
      setRanking([]); setStatus('idle'); setError(null);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('loading'); setError(null);

    api.get(`/api/v1/rankings/class/${selectedClass}`, { signal: controller.signal })
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
        if (err.response?.status === 400) {
          setError('Assessment configuration is missing for this class. Please set it up first.');
        } else {
          setError('Failed to load ranking data.');
        }
        setStatus('error');
      });

    return () => controller.abort();
  }, [selectedClass]);

  return { ranking, status, error };
};

/* --------------------------------------------------------------------------
   Podium Component (Top 3)
   -------------------------------------------------------------------------- */
const Podium = ({ top3 }) => {
  if (top3.length === 0) return null;

  const getInitials = (name) => name?.charAt(0).toUpperCase() || '?';

  const renderPodiumBlock = (student, position) => {
    if (!student) return <div className="fr-podium-slot fr-podium-empty" key={`empty-${position}`} />;

    const positionClass = `fr-podium-${position}`;
    const rankColors = {
      1: { bg: 'linear-gradient(140deg, #f59e0b, #d97706)', text: '#fffdf8', shadow: '0 8px 24px -8px rgba(245, 158, 11, 0.6)' },
      2: { bg: 'linear-gradient(140deg, #94a3b8, #64748b)', text: '#fffdf8', shadow: '0 8px 24px -8px rgba(148, 163, 184, 0.5)' },
      3: { bg: 'linear-gradient(140deg, #cd7f32, #8b4513)', text: '#fffdf8', shadow: '0 8px 24px -8px rgba(205, 127, 50, 0.5)' },
    };
    const colors = rankColors[position];

    return (
      <div className={`fr-podium-block ${positionClass}`} key={student.studentId}>
        <div className="fr-podium-crown" aria-hidden="true">
          {position === 1 ? <FaCrown size={24} /> : <FaMedal size={20} />}
        </div>
        <div className="fr-podium-avatar" style={{ background: colors.bg, color: colors.text, boxShadow: colors.shadow }}>
          {getInitials(student.fullName)}
        </div>
        <h3 className="fr-podium-name">{student.fullName}</h3>
        <span className="fr-podium-score">{student.overallTotal?.toFixed(2) ?? '—'}</span>
        <span className="fr-podium-rank">
          {position === 1 ? 'Champion' : position === 2 ? 'Runner-up' : 'Third Place'}
        </span>
        <div className="fr-podium-pillar" style={{ background: colors.bg }} />
      </div>
    );
  };

  // Reorder for podium layout: 2nd, 1st, 3rd
  const ordered = [top3[1], top3[0], top3[2]];
  const positions = [2, 1, 3];

  return (
    <div className="fr-podium" aria-label="Top 3 students">
      {ordered.map((student, idx) => renderPodiumBlock(student, positions[idx]))}
    </div>
  );
};

/* --------------------------------------------------------------------------
   Main Component
   -------------------------------------------------------------------------- */
const FullRanking = () => {
  const { classes, status: classStatus } = useClasses();
  const [selectedClass, setSelectedClass] = useState('');
  const [toast, setToast] = useState({ type: '', message: '' });

  const { ranking, status, error } = useRanking(selectedClass);

  const isLoading = status === 'loading';
  const hasRanking = ranking.length > 0;
  const selectedClassName = classes.find(c => c._id === selectedClass)?.name;

  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);
  const maxScore = ranking.length > 0 ? Math.max(...ranking.map(s => s.overallTotal || 0)) : 0;

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

  useEffect(() => {
    if (error && status !== 'loading') {
      showToast('error', error);
    }
  }, [error, status]);

  return (
    <section className="fr-page">
      <div className="fr-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="fr-wash" aria-hidden="true" />

      {toast.message && (
        <div className={`fr-toast fr-toast--${toast.type}`} role="alert">
          {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button className="fr-toast-close" onClick={() => setToast({ type: '', message: '' })} aria-label="Close"><FiX size={16} /></button>
        </div>
      )}

      <main className="fr-content">
        <header className="fr-header">
          <div className="fr-header-icon" aria-hidden="true"><FiTrophy size={28} /></div>
          <div>
            <h1 className="fr-title">Class Ranking</h1>
            <p className="fr-subtitle">
              View academic performance rankings across your classes.
            </p>
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
                disabled={classStatus === 'loading'}
              >
                <option value="">{classStatus === 'loading' ? 'Loading classes...' : '-- Choose a class --'}</option>
                {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <FiChevronDown className="fr-select-icon" />
            </div>
          </div>

          {selectedClass && (
            <div className="fr-active-badge">
              <FiUsers size={16} />
              <span>Viewing: <strong>{selectedClassName}</strong></span>
            </div>
          )}
        </div>

        {/* Initial State */}
        {!selectedClass && classStatus === 'success' && (
          <div className="fr-hero">
            <div className="fr-hero-icon" aria-hidden="true"><FiTrendingUp size={48} /></div>
            <h2>Ready to View Rankings</h2>
            <p>Select a class from the dropdown above to see student rankings based on their overall academic performance.</p>
            <div className="fr-hero-quote">
              <span className="fr-quote-mark">&ldquo;</span>
              <p>በትጋት ያለው ሁሉ ይበልጣል፤ ሰነፉ ግን ያሳፍራል</p>
              <span className="fr-quote-author">– ምሳሌ 10:4</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="fr-state" role="status">
            <span className="fr-spinner" />
            <p>Calculating rankings…</p>
          </div>
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
                  <strong>{maxScore.toFixed(2)}</strong>
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
                            <span className="fr-rank-badge">{student.rank}</span>
                          </td>
                          <td data-label="Name">
                            <div className="fr-student-cell">
                              <span className="fr-avatar" aria-hidden="true">
                                {student.fullName?.charAt(0).toUpperCase() || '?'}
                              </span>
                              <span className="fr-student-name">{student.fullName}</span>
                            </div>
                          </td>
                          <td data-label="Roll No">{student.rollNumber || '—'}</td>
                          <td data-label="Total Score" className="fr-td-right">
                            <div className="fr-score-cell">
                              <strong>{student.overallTotal?.toFixed(2) ?? '—'}</strong>
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

        {/* Empty State */}
        {!isLoading && !hasRanking && selectedClass && !error && (
          <div className="fr-state">
            <FiInbox size={40} />
            <h3>No Rankings Available</h3>
            <p>No students or scores found for this class. Enter marks first to generate rankings.</p>
          </div>
        )}
      </main>
    </section>
  );
};

export default FullRanking;