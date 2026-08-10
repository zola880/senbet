import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiAlertTriangle, FiAward, FiBookOpen, FiCheckCircle,
  FiInbox, FiRefreshCw, FiTrendingUp, FiX
} from 'react-icons/fi';
import { FaCrown, FaMedal } from 'react-icons/fa';

import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import bgImage from '../../assets/L.png';
import './MyRank.css';

/* --------------------------------------------------------------------------
   Data Hook: Student Rank & Courses
   -------------------------------------------------------------------------- */
const useStudentRank = (userId) => {
  const [rankData, setRankData] = useState(null);
  const [courseArray, setCourseArray] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setStatus('success');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;

    setStatus('loading');
    setError(null);

    try {
      const [rankRes, coursesRes] = await Promise.all([
        api.get(`/api/v1/rankings/student/${userId}`, { signal }),
        api.get('/api/v1/courses', { signal }),
      ]);

      const ranking = rankRes.data?.data;
      setRankData(ranking);

      const courses = Array.isArray(coursesRes.data?.data) ? coursesRes.data.data : [];
      const nameMap = {};
      courses.forEach((c) => {
        nameMap[c._id] = c.name;
      });

      const breakdown = ranking?.courseBreakdown;
      if (breakdown) {
        const arr = Object.entries(breakdown).map(([courseId, details]) => ({
          courseId,
          courseName: nameMap[courseId] || details.courseName || 'Unknown Course',
          total: details.courseTotal || 0,
        }));
        setCourseArray(arr);
      } else {
        setCourseArray([]);
      }
      setStatus('success');
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
      console.error('Failed to load rank data:', err);
      if (err.response?.status === 404) {
        setError('No ranking data yet. Your teacher may not have entered marks.');
      } else {
        setError('Could not load your rank. Please try again.');
      }
      setStatus('error');
    }
  }, [userId]);

  useEffect(() => {
    reload();
    return () => abortRef.current?.abort();
  }, [reload]);

  return { rankData, courseArray, status, error, reload };
};

/* --------------------------------------------------------------------------
   Main Component
   -------------------------------------------------------------------------- */
const MyRank = () => {
  const { user } = useContext(AuthContext);
  const { rankData, courseArray, status, error, reload } = useStudentRank(user?._id);
  const [toast, setToast] = useState({ type: '', message: '' });

  const isLoading = status === 'loading';
  const hasRankData = Boolean(rankData);
  const hasCourseBreakdown = courseArray.length > 0;

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'mr-rank-gold';
    if (rank === 2) return 'mr-rank-silver';
    if (rank === 3) return 'mr-rank-bronze';
    return 'mr-rank-default';
  };

  const getMotivationalMessage = (rank) => {
    if (rank === 1) return { text: 'ብቁ ሆነህ አገልግል! አሁን ላገኘኸው ክብር ምስጋና ይግባህ።', sub: 'Well done, faithful servant!' };
    if (rank <= 3) return { text: 'በጣም ጥሩ ሥራ! ልብህን አጽንተህ ቀጥል።', sub: 'Excellent work! Keep striving for excellence.' };
    if (rank <= 10) return { text: 'መልካም ጥረት! ጠንክረህ ተማር።', sub: 'Great effort! Keep pushing forward.' };
    return { text: 'እያንዳንዱ እርምጃ እድገት ነው። መማርህን ቀጥል!', sub: 'Every step is progress. Keep learning and growing!' };
  };

  const maxCourseScore = useMemo(() => {
    if (!hasCourseBreakdown) return 100;
    return Math.max(...courseArray.map(c => c.total || 0), 100);
  }, [courseArray, hasCourseBreakdown]);

  const averageScore = useMemo(() => {
    if (!hasCourseBreakdown) return 0;
    const total = courseArray.reduce((sum, c) => sum + (c.total || 0), 0);
    return (total / courseArray.length).toFixed(1);
  }, [courseArray, hasCourseBreakdown]);

  // Loading State
  if (isLoading) {
    return (
      <section className="mr-page">
        <div className="mr-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
        <div className="mr-wash" aria-hidden="true" />
        <div className="mr-state" role="status">
          <span className="mr-spinner" />
          <p>Calculating your rank…</p>
        </div>
      </section>
    );
  }

  // Error State
  if (status === 'error' && !hasRankData) {
    return (
      <section className="mr-page">
        <div className="mr-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
        <div className="mr-wash" aria-hidden="true" />
        <div className="mr-state mr-state--error" role="alert">
          <FiAlertTriangle size={32} />
          <h3>Unable to Load Rank</h3>
          <p>{error}</p>
          <button className="mr-btn mr-btn--primary" onClick={reload}>
            <FiRefreshCw size={16} /> Try Again
          </button>
        </div>
      </section>
    );
  }

  // Empty State
  if (!hasRankData) {
    return (
      <section className="mr-page">
        <div className="mr-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
        <div className="mr-wash" aria-hidden="true" />
        <main className="mr-content">
          <header className="mr-header">
            <h1 className="mr-title">My Rank</h1>
            <p className="mr-subtitle">View your academic standing within your class.</p>
          </header>
          <div className="mr-state">
            <FiInbox size={40} />
            <h3>No Ranking Available</h3>
            <p>Your teacher hasn't entered marks yet. Check back later!</p>
          </div>
        </main>
      </section>
    );
  }

  const { rank, overallTotal } = rankData;
  const rankColorClass = getRankColor(rank);
  const motivation = getMotivationalMessage(rank);

  return (
    <section className="mr-page">
      <div className="mr-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="mr-wash" aria-hidden="true" />

      {toast.message && (
        <div className={`mr-toast mr-toast--${toast.type}`} role="alert">
          {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button className="mr-toast-close" onClick={() => setToast({ type: '', message: '' })} aria-label="Close">
            <FiX size={16} />
          </button>
        </div>
      )}

      <main className="mr-content">
        <header className="mr-header">
          <h1 className="mr-title">My Rank</h1>
          <p className="mr-subtitle">View your academic standing within your class.</p>
        </header>

        {/* Hero Rank Card */}
        <div className="mr-hero">
          <div className={`mr-rank-badge ${rankColorClass}`} aria-label={`Rank ${rank}`}>
            {rank === 1 ? <FaCrown size={32} /> : rank <= 3 ? <FaMedal size={28} /> : <span className="mr-rank-number">{rank}</span>}
          </div>
          <h2 className="mr-hero-title">Your Overall Rank</h2>
          <div className="mr-hero-score">
            <span className="mr-hero-score-value">#{rank}</span>
            <span className="mr-hero-score-label">of your class</span>
          </div>
          <p className="mr-hero-total">
            Total Score: <strong>{overallTotal?.toFixed(2) ?? '—'}</strong>
          </p>
          
          {rank <= 3 && (
            <div className="mr-hero-achievement">
              <FiAward size={18} />
              <span>
                {rank === 1 ? 'Champion' : rank === 2 ? 'Runner-up' : 'Third Place'}
              </span>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mr-summary">
          <div className="mr-summary-card">
            <FiAward size={20} />
            <div>
              <strong>#{rank}</strong>
              <span>Your Rank</span>
            </div>
          </div>
          <div className="mr-summary-card">
            <FiTrendingUp size={20} />
            <div>
              <strong>{overallTotal?.toFixed(2) ?? '—'}</strong>
              <span>Total Score</span>
            </div>
          </div>
          <div className="mr-summary-card">
            <FiBookOpen size={20} />
            <div>
              <strong>{courseArray.length}</strong>
              <span>Courses Graded</span>
            </div>
          </div>
        </div>

        {/* Course Breakdown */}
        {hasCourseBreakdown && (
          <div className="mr-breakdown-card">
            <h2 className="mr-card-title">
              <FiBookOpen size={20} style={{ marginRight: '0.5rem' }} />
              Course Breakdown
            </h2>
            <div className="mr-breakdown-list">
              {courseArray.map((course) => {
                const percentage = course.total || 0;
                const barWidth = (percentage / maxCourseScore) * 100;
                const colorClass = percentage >= 80 ? 'mr-pct-high' : percentage >= 60 ? 'mr-pct-mid' : percentage >= 40 ? 'mr-pct-low' : 'mr-pct-fail';
                
                return (
                  <div key={course.courseId} className="mr-course-row">
                    <div className="mr-course-header">
                      <span className="mr-course-name">{course.courseName}</span>
                      <span className={`mr-course-pct ${colorClass}`}>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mr-progress-bar">
                      <div
                        className={`mr-progress-fill ${colorClass}`}
                        style={{ width: `${Math.min(barWidth, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Motivational Message */}
        <div className="mr-motivation">
          <div className="mr-motivation-icon" aria-hidden="true">
            <FiTrendingUp size={24} />
          </div>
          <p className="mr-motivation-text">{motivation.text}</p>
          <p className="mr-motivation-sub">{motivation.sub}</p>
          <div className="mr-motivation-verse">
            <span className="mr-verse-mark">&ldquo;</span>
            <p>በትጋት ያለው ሁሉ ይበልጣል፤ ሰነፉ ግን ያሳፍራል</p>
            <span className="mr-verse-author">– ምሳሌ 10:4</span>
          </div>
        </div>
      </main>
    </section>
  );
};

export default MyRank;