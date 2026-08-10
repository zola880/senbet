import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiAlertTriangle, FiBook, FiCheckCircle, FiChevronDown,
  FiInbox, FiRefreshCw, FiTrendingUp, FiX
} from 'react-icons/fi';

import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import bgImage from '../../assets/L.png';
import './MyMarks.css';

/* --------------------------------------------------------------------------
   Data Hook: Student Courses
   -------------------------------------------------------------------------- */
const useStudentCourses = (user) => {
  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const reload = useCallback(async () => {
    if (!user?.class?._id) {
      setCourses([]);
      setStatus('success');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setError(null);

    try {
      const res = await api.get(`/api/v1/assignments?class=${user.class._id}`, {
        signal: controller.signal,
      });
      
      const assignments = Array.isArray(res.data?.data) ? res.data.data : [];
      const uniqueCourses = [];
      const seen = new Set();
      
      assignments.forEach(a => {
        if (a.course?._id && !seen.has(a.course._id)) {
          uniqueCourses.push(a.course);
          seen.add(a.course._id);
        }
      });
      
      setCourses(uniqueCourses);
      setStatus('success');
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
      console.error('Failed to load courses:', err);
      setError('Unable to load your courses. Please try again.');
      setStatus('error');
    }
  }, [user?.class?._id]);

  useEffect(() => {
    reload();
    return () => abortRef.current?.abort();
  }, [reload]);

  return { courses, status, error, reload };
};

/* --------------------------------------------------------------------------
   Data Hook: Student Marks
   -------------------------------------------------------------------------- */
const useStudentMarks = (user, selectedCourse) => {
  const [scores, setScores] = useState([]);
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!selectedCourse || !user?._id) {
      setScores([]);
      setConfig(null);
      setStatus('idle');
      setError(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;

    setStatus('loading');
    setError(null);

    const scoresPromise = api.get(`/api/v1/scores?student=${user._id}&course=${selectedCourse}`, { signal });
    const configPromise = user.class?._id
      ? api.get(`/api/v1/assessment-configs/${user.class._id}`, { signal }).catch(() => null)
      : Promise.resolve(null);

    Promise.all([scoresPromise, configPromise])
      .then(([scoresRes, configRes]) => {
        if (signal.aborted) return;
        
        setScores(Array.isArray(scoresRes.data?.data) ? scoresRes.data.data : []);
        setConfig(configRes?.data?.data || null);
        setStatus('success');
      })
      .catch((err) => {
        if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
        console.error('Failed to load marks:', err);
        setError('Failed to load your marks.');
        setStatus('error');
      });

    return () => controller.abort();
  }, [selectedCourse, user]);

  return { scores, config, status, error };
};

/* --------------------------------------------------------------------------
   Main Component
   -------------------------------------------------------------------------- */
const MyMarks = () => {
  const { user } = useContext(AuthContext);
  const { courses, status: coursesStatus, error: coursesError, reload: reloadCourses } = useStudentCourses(user);
  
  const [selectedCourse, setSelectedCourse] = useState('');
  const [toast, setToast] = useState({ type: '', message: '' });

  const { scores, config, status: marksStatus, error: marksError } = useStudentMarks(user, selectedCourse);

  const isLoadingCourses = coursesStatus === 'loading';
  const hasCourses = courses.length > 0;
  const isLoadingMarks = marksStatus === 'loading';
  const selectedCourseName = courses.find(c => c._id === selectedCourse)?.name;

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

  // Group scores by component name
  const groupedScores = useMemo(() => {
    const grouped = {};
    scores.forEach(sc => {
      if (!grouped[sc.componentName]) {
        grouped[sc.componentName] = {
          componentName: sc.componentName,
          scoreObtained: sc.scoreObtained,
          maxScore: sc.maxScore,
        };
      } else {
        grouped[sc.componentName].scoreObtained += sc.scoreObtained;
      }
    });
    return grouped;
  }, [scores]);

  // Build table rows
  const tableRows = useMemo(() => {
    const rows = [];
    
    if (config) {
      config.components.forEach(comp => {
        const scoreData = groupedScores[comp.name];
        const score = scoreData ? scoreData.scoreObtained : 0;
        const max = scoreData ? scoreData.maxScore : comp.maxScore;
        const percentage = scoreData ? (score / max) * 100 : 0;
        
        rows.push({
          component: comp.name,
          score: scoreData ? score : '-',
          max: max,
          percentage: scoreData ? percentage.toFixed(1) : null,
          percentageNum: percentage,
        });
      });
    } else {
      Object.values(groupedScores).forEach(scoreData => {
        const percentage = (scoreData.scoreObtained / scoreData.maxScore) * 100;
        rows.push({
          component: scoreData.componentName,
          score: scoreData.scoreObtained,
          max: scoreData.maxScore,
          percentage: percentage.toFixed(1),
          percentageNum: percentage,
        });
      });
    }
    
    return rows;
  }, [groupedScores, config]);

  const averageScore = useMemo(() => {
    const validRows = tableRows.filter(r => r.percentage !== null);
    if (validRows.length === 0) return null;
    const total = validRows.reduce((sum, r) => sum + r.percentageNum, 0);
    return (total / validRows.length).toFixed(1);
  }, [tableRows]);

  const getPercentageColor = (pct) => {
    if (pct >= 80) return 'mm-pct-high';
    if (pct >= 60) return 'mm-pct-mid';
    if (pct >= 40) return 'mm-pct-low';
    return 'mm-pct-fail';
  };

  return (
    <section className="mm-page">
      <div className="mm-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="mm-wash" aria-hidden="true" />

      {toast.message && (
        <div className={`mm-toast mm-toast--${toast.type}`} role="alert">
          {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button className="mm-toast-close" onClick={() => setToast({ type: '', message: '' })} aria-label="Close">
            <FiX size={16} />
          </button>
        </div>
      )}

      <main className="mm-content">
        <header className="mm-header">
          <h1 className="mm-title">My Marks</h1>
          <p className="mm-subtitle">
            View your academic performance across all courses and assessments.
          </p>
        </header>

        {/* Course Selector */}
        <div className="mm-toolbar">
          <div className="mm-select-group">
            <label htmlFor="mm-course-select" className="mm-label">Select Course</label>
            <div className="mm-select-wrapper">
              <select
                id="mm-course-select"
                className="mm-select"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                disabled={isLoadingCourses}
              >
                <option value="">{isLoadingCourses ? 'Loading courses...' : '-- Choose a course --'}</option>
                {courses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <FiChevronDown className="mm-select-icon" />
            </div>
          </div>

          {selectedCourse && (
            <div className="mm-active-badge">
              <FiBook size={16} />
              <span>Viewing: <strong>{selectedCourseName}</strong></span>
            </div>
          )}
        </div>

        {/* Initial State */}
        {!selectedCourse && !isLoadingCourses && coursesStatus === 'success' && (
          <div className="mm-state">
            <FiTrendingUp size={48} aria-hidden="true" />
            <h3>Select a Course</h3>
            <p>Choose a course from the dropdown above to view your marks and performance.</p>
          </div>
        )}

        {/* Loading Courses Error */}
        {!selectedCourse && coursesStatus === 'error' && !hasCourses && (
          <div className="mm-state mm-state--error" role="alert">
            <FiAlertTriangle size={32} />
            <h3>Failed to Load Courses</h3>
            <p>{coursesError}</p>
            <button className="mm-btn mm-btn--primary" onClick={reloadCourses}>
              <FiRefreshCw size={16} /> Try Again
            </button>
          </div>
        )}

        {/* No Courses */}
        {!selectedCourse && !isLoadingCourses && coursesStatus === 'success' && !hasCourses && (
          <div className="mm-state">
            <FiInbox size={40} />
            <h3>No Courses Available</h3>
            <p>There are no courses assigned to your class yet.</p>
          </div>
        )}

        {/* Loading Marks */}
        {selectedCourse && isLoadingMarks && (
          <div className="mm-state" role="status">
            <span className="mm-spinner" />
            <p>Loading your marks…</p>
          </div>
        )}

        {/* Marks Error */}
        {selectedCourse && !isLoadingMarks && marksStatus === 'error' && (
          <div className="mm-state mm-state--error" role="alert">
            <FiAlertTriangle size={32} />
            <h3>Failed to Load Marks</h3>
            <p>{marksError}</p>
          </div>
        )}

        {/* No Marks */}
        {selectedCourse && !isLoadingMarks && marksStatus === 'success' && tableRows.length === 0 && (
          <div className="mm-state">
            <FiInbox size={40} />
            <h3>No Marks Recorded</h3>
            <p>No marks have been recorded for this course yet.</p>
          </div>
        )}

        {/* Marks Display */}
        {selectedCourse && !isLoadingMarks && marksStatus === 'success' && tableRows.length > 0 && (
          <>
            {/* Summary Stats */}
            {averageScore && (
              <div className="mm-summary">
                <div className="mm-summary-card">
                  <FiBook size={20} />
                  <div>
                    <strong>{selectedCourseName}</strong>
                    <span>Course Name</span>
                  </div>
                </div>
                <div className="mm-summary-card">
                  <FiTrendingUp size={20} />
                  <div>
                    <strong>{averageScore}%</strong>
                    <span>Average Score</span>
                  </div>
                </div>
                <div className="mm-summary-card">
                  <FiCheckCircle size={20} />
                  <div>
                    <strong>{tableRows.length}</strong>
                    <span>Components Graded</span>
                  </div>
                </div>
              </div>
            )}

            {/* Marks Table */}
            <div className="mm-marks-card">
              <h2 className="mm-card-title">Marks Breakdown</h2>
              <div className="mm-table-wrapper">
                <table className="mm-table">
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Score</th>
                      <th>Max</th>
                      <th className="mm-th-right">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, idx) => (
                      <tr key={idx}>
                        <td data-label="Component">
                          <strong>{row.component}</strong>
                        </td>
                        <td data-label="Score">{row.score}</td>
                        <td data-label="Max">{row.max}</td>
                        <td data-label="Percentage" className="mm-td-right">
                          {row.percentage !== null ? (
                            <div className="mm-score-cell">
                              <span className={`mm-pct-badge ${getPercentageColor(row.percentageNum)}`}>
                                {row.percentage}%
                              </span>
                              <div className="mm-progress-bar">
                                <div
                                  className={`mm-progress-fill ${getPercentageColor(row.percentageNum)}`}
                                  style={{ width: `${Math.min(row.percentageNum, 100)}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="mm-pct-badge mm-pct-na">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </section>
  );
};

export default MyMarks;