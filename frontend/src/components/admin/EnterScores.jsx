import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FiAlertTriangle, FiBookOpen, FiCheckCircle, FiCheckSquare,
  FiChevronDown, FiClipboard, FiInbox, FiRefreshCw, FiSave,
  FiUsers, FiX, FiUser
} from 'react-icons/fi';

import api from '../../services/api';
import bgImage from '../../assets/L.png';
import heroImage from '../../assets/c.jpg';
import './EnterScores.css';

/* --------------------------------------------------------------------------
   Data Hook: Initial Stats & Dropdowns
   -------------------------------------------------------------------------- */
const useInitialData = () => {
  const [classes, setClasses] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [status, setStatus] = useState('loading');
  const abortRef = useRef(null);

  const reload = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;

    setStatus('loading');
    try {
      const [classesRes, studentsRes] = await Promise.all([
        api.get('/api/v1/classes', { signal }),
        api.get('/api/v1/users?role=student', { signal }),
      ]);
      setClasses(Array.isArray(classesRes.data?.data) ? classesRes.data.data : []);
      setTotalStudents(Array.isArray(studentsRes.data?.data) ? studentsRes.data.data.length : 0);
      setStatus('success');
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
      console.error('Failed to load initial data:', err);
      setStatus('error');
    }
  }, []);

  useEffect(() => { reload(); return () => abortRef.current?.abort(); }, [reload]);
  return { classes, totalStudents, status, reload };
};

/* --------------------------------------------------------------------------
   Data Hook: Selection Data (Students, Config & Class-specific Courses)
   -------------------------------------------------------------------------- */
const useSelectionData = (selectedClass, selectedCourse) => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!selectedClass) {
      setStudents([]); setCourses([]); setConfig(null); setStatus('idle'); setError(null);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;

    setStatus('loading'); setError(null);
    Promise.all([
      api.get(`/api/v1/users?role=student&class=${selectedClass}`, { signal }),
      api.get(`/api/v1/assessment-configs/${selectedClass}`, { signal }).catch(err => {
        if (err.response?.status === 404) return null;
        throw err;
      }),
      // Fetch only courses assigned to this class via teacher assignments
      api.get(`/api/v1/assignments?class=${selectedClass}`, { signal }),
    ]).then(([studentsRes, configRes, assignmentsRes]) => {
      if (signal.aborted) return;
      setStudents(Array.isArray(studentsRes.data?.data) ? studentsRes.data.data : []);

      // Derive unique courses from assignments for this class
      const assignments = Array.isArray(assignmentsRes.data?.data) ? assignmentsRes.data.data : [];
      const seen = new Set();
      const classCourses = assignments
        .map(a => a.course)
        .filter(c => c && !seen.has(c._id) && seen.add(c._id));
      setCourses(classCourses);

      if (configRes?.data?.data) {
        setConfig(configRes.data.data);
      } else {
        setConfig(null);
        setError('No assessment configuration found for this class. Please configure it first.');
      }
      setStatus('success');
    }).catch(err => {
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
      console.error('Failed to load selection data:', err);
      setError('Failed to load students or configuration.');
      setStatus('error');
    });

    return () => controller.abort();
  }, [selectedClass]);

  return { students, courses, config, status, error };
};

/* --------------------------------------------------------------------------
   Main Component
   -------------------------------------------------------------------------- */
const EnterScores = () => {
  const { classes, totalStudents, status: initStatus, reload: reloadInit } = useInitialData();
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [scores, setScores] = useState({});
  const [submittingComponents, setSubmittingComponents] = useState({});
  const [toast, setToast] = useState({ type: '', message: '' });

  const { students, courses, config, status: selStatus, error: selError } = useSelectionData(selectedClass, selectedCourse);

  const hasSelection = selectedClass && selectedCourse;
  const isLoadingSelection = selStatus === 'loading';
  const hasStudents = students.length > 0;
  const hasConfig = Boolean(config);

  // Clear course selection and scores when class changes
  useEffect(() => { setSelectedCourse(''); setScores({}); }, [selectedClass]);
  // Clear scores when course changes
  useEffect(() => { setScores({}); }, [selectedCourse]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

  const handleScoreChange = (studentId, componentName, value) => {
    setScores((prev) => ({ ...prev, [`${studentId}-${componentName}`]: value }));
  };

  const getScoreStatus = (studentId, componentName, maxScore) => {
    const key = `${studentId}-${componentName}`;
    const rawValue = scores[key];
    if (rawValue === undefined || rawValue === '') return 'empty';
    const numeric = parseFloat(rawValue);
    if (isNaN(numeric) || numeric < 0 || numeric > maxScore) return 'invalid';
    return 'valid';
  };

  const submitComponentScores = async (componentName) => {
    if (!hasConfig || !hasStudents) return;
    const component = config.components.find((c) => c.name === componentName);
    if (!component) return;

    const payload = {
      class: selectedClass,
      course: selectedCourse,
      componentName,
      scores: [],
    };

    let hasInvalid = false;
    students.forEach((student) => {
      const key = `${student._id}-${componentName}`;
      const rawValue = scores[key];
      if (rawValue !== undefined && rawValue.trim() !== '') {
        const numeric = parseFloat(rawValue);
        if (!isNaN(numeric) && numeric >= 0 && numeric <= component.maxScore) {
          payload.scores.push({ student: student._id, scoreObtained: numeric, maxScore: component.maxScore });
        } else {
          hasInvalid = true;
        }
      }
    });

    if (hasInvalid) {
      showToast('error', `Please fix invalid scores (must be between 0 and ${component.maxScore}).`);
      return;
    }
    if (payload.scores.length === 0) {
      showToast('error', `No valid scores entered for "${componentName}".`);
      return;
    }

    setSubmittingComponents((prev) => ({ ...prev, [componentName]: true }));
    try {
      await api.post('/api/v1/scores', payload);
      showToast('success', `Scores for "${componentName}" saved successfully.`);
    } catch (err) {
      showToast('error', err.response?.data?.message || `Failed to save scores for "${componentName}".`);
    } finally {
      setSubmittingComponents((prev) => ({ ...prev, [componentName]: false }));
    }
  };

  return (
    <section className="es-page">
      <div className="es-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="es-wash" aria-hidden="true" />

      {toast.message && (
        <div className={`es-toast es-toast--${toast.type}`} role="alert">
          {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button className="es-toast-close" onClick={() => setToast({ type: '', message: '' })} aria-label="Close"><FiX size={16} /></button>
        </div>
      )}

      <main className="es-content">
        <header className="es-header">
          <h1 className="es-title">Enter Scores (Admin)</h1>
          <p className="es-subtitle">Select a class and course to manage and record student scores.</p>
        </header>

        {/* Selectors */}
        <div className="es-selectors">
          <div className="es-select-card">
            <div className="es-select-icon es-icon-class"><FiUsers size={22} /></div>
            <div className="es-select-body">
              <label htmlFor="es-class" className="es-label">Select Class</label>
              <div className="es-select-wrapper">
                <select id="es-class" className="es-select" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} disabled={initStatus === 'loading'}>
                  <option value="">Choose a class</option>
                  {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <FiChevronDown className="es-select-icon-arrow" />
              </div>
            </div>
          </div>

          <div className="es-select-card">
            <div className="es-select-icon es-icon-course"><FiBookOpen size={22} /></div>
            <div className="es-select-body">
              <label htmlFor="es-course" className="es-label">Select Course</label>
              <div className="es-select-wrapper">
                <select
                  id="es-course"
                  className="es-select"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  disabled={!selectedClass || selStatus === 'loading'}
                >
                  <option value="">
                    {!selectedClass
                      ? 'Select a class first'
                      : selStatus === 'loading'
                      ? 'Loading courses…'
                      : courses.length === 0
                      ? 'No courses assigned to this class'
                      : 'Choose a course'}
                  </option>
                  {courses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <FiChevronDown className="es-select-icon-arrow" />
              </div>
            </div>
          </div>
        </div>

        {/* No Selection State (Hero + Stats) */}
        {!hasSelection && (
          <>
            <div className="es-hero">
              <div className="es-hero-bg" style={{ backgroundImage: `url(${heroImage})` }} aria-hidden="true" />
              <div className="es-hero-overlay" aria-hidden="true" />
              <div className="es-hero-content">
                <div className="es-hero-icon" aria-hidden="true"><FiClipboard size={32} /></div>
                <h2>Ready to Enter Scores</h2>
                <p>Please select a class and course from the dropdowns above to view students and enter their scores.</p>
                
                <div className="es-quote">
                  <span className="es-quote-mark">&ldquo;</span>
                  <p>ልጅን በሚሄድበት መንገድ ምራው፤ በሸመገለም ጊዜ ከእርሱ ፈቀቅ አይልም</p>
                  <span className="es-quote-author">– ምሳሌ 22:6</span>
                </div>
              </div>
            </div>

            <div className="es-stats">
              <div className="es-stat-card">
                <div className="es-stat-icon es-stat-classes"><FiUsers size={20} /></div>
                <div><h3>{classes.length}</h3><p>Total Classes</p></div>
              </div>
              <div className="es-stat-card">
                <div className="es-stat-icon es-stat-courses"><FiBookOpen size={20} /></div>
                <div><h3>{courses.length}</h3><p>{selectedClass ? 'Courses in Class' : 'Courses Assigned'}</p></div>
              </div>
              <div className="es-stat-card">
                <div className="es-stat-icon es-stat-students"><FiUser size={20} /></div>
                <div><h3>{totalStudents}</h3><p>Total Students</p></div>
              </div>
              <div className="es-stat-card">
                <div className="es-stat-icon es-stat-scores"><FiCheckSquare size={20} /></div>
                <div><h3>0</h3><p>Scores Today</p></div>
              </div>
            </div>

            <p className="es-footer-text">
              <span className="es-footer-cross">✝</span> ስብሐት ለእግዚአብሔር በኵሉ!
            </p>
          </>
        )}

        {/* Selection Active State */}
        {hasSelection && (
          <>
            {isLoadingSelection ? (
              <div className="es-state" role="status"><span className="es-spinner" /> <p>Loading students and configuration…</p></div>
            ) : selError ? (
              <div className="es-state es-state--error" role="alert">
                <FiAlertTriangle size={32} />
                <h3>Configuration Missing or Error</h3>
                <p>{selError}</p>
              </div>
            ) : !hasConfig ? (
              <div className="es-state">
                <FiClipboard size={40} />
                <h3>Assessment Config Not Set</h3>
                <p>The admin has not configured assessment components for this class yet.</p>
              </div>
            ) : !hasStudents ? (
              <div className="es-state">
                <FiInbox size={40} />
                <h3>No Students Enrolled</h3>
                <p>There are no students currently enrolled in this class.</p>
              </div>
            ) : (
              <div className="es-gradebook">
                <div className="es-table-wrapper">
                  <table className="es-table">
                    <thead>
                      <tr>
                        <th className="es-sticky-col">Student Name</th>
                        {config.components.map((comp) => (
                          <th key={comp.name} className="es-th-component">
                            <span className="es-th-title">{comp.name}</span>
                            <span className="es-th-max">Max: {comp.maxScore}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student._id}>
                          <td className="es-sticky-col es-td-student">
                            <div className="es-student-info">
                              <span className="es-avatar" aria-hidden="true">{student.fullName?.charAt(0).toUpperCase() || '?'}</span>
                              <span className="es-student-name">{student.fullName}</span>
                            </div>
                          </td>
                          {config.components.map((comp) => {
                            const scoreStatus = getScoreStatus(student._id, comp.name, comp.maxScore);
                            return (
                              <td key={comp.name} className="es-td-score">
                                <input
                                  type="number" min="0" max={comp.maxScore} step="any"
                                  className={`es-score-input ${scoreStatus === 'invalid' ? 'es-score-input--invalid' : ''}`}
                                  value={scores[`${student._id}-${comp.name}`] || ''}
                                  onChange={(e) => handleScoreChange(student._id, comp.name, e.target.value)}
                                  placeholder="—"
                                  aria-label={`${comp.name} score for ${student.fullName}`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="es-actions">
                  {config.components.map((comp) => (
                    <button
                      key={comp.name}
                      className="es-btn es-btn--primary"
                      onClick={() => submitComponentScores(comp.name)}
                      disabled={submittingComponents[comp.name]}
                    >
                      {submittingComponents[comp.name] ? (
                        <><span className="es-spinner es-spinner--sm" /> Saving…</>
                      ) : (
                        <><FiSave size={16} /> Save {comp.name}</>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </section>
  );
};

export default EnterScores;