import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiAlertTriangle,
  FiBookOpen,
  FiCheckCircle,
  FiChevronDown,
  FiInbox,
  FiRefreshCw,
  FiSave,
  FiSettings,
  FiUsers,
  FiX,
} from 'react-icons/fi';

import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import bgImage from '../../assets/L.png';
import './EnterMarks.css';

/* --------------------------------------------------------------------------
   Data hook: Fetch Teacher Assignments
   -------------------------------------------------------------------------- */
const useAssignments = (teacherId) => {
  const [assignments, setAssignments] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const reload = useCallback(async () => {
    if (!teacherId) {
      setAssignments([]);
      setStatus('success');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setError(null);

    try {
      const res = await api.get(`/api/v1/assignments/teacher/${teacherId}`, {
        signal: controller.signal,
      });
      setAssignments(Array.isArray(res.data?.data) ? res.data.data : []);
      setStatus('success');
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
      console.error('Failed to load assignments:', err);
      setError('Unable to load your teaching assignments.');
      setStatus('error');
    }
  }, [teacherId]);

  useEffect(() => {
    reload();
    return () => abortRef.current?.abort();
  }, [reload]);

  return { assignments, status, error, reload };
};

/* --------------------------------------------------------------------------
   Data hook: Fetch Students & Assessment Config for a specific assignment
   -------------------------------------------------------------------------- */
const useClassData = (assignment) => {
  const [students, setStudents] = useState([]);
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!assignment?.class?._id) {
      setStudents([]);
      setConfig(null);
      setStatus('idle');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const classId = assignment.class._id;
    setStatus('loading');
    setError(null);

    const fetchStudents = api.get(`/api/v1/users?role=student&class=${classId}`, {
      signal: controller.signal,
    });
    
    const fetchConfig = api.get(`/api/v1/assessment-configs/${classId}`, {
      signal: controller.signal,
    }).catch((err) => {
      if (err.response?.status === 404) return null;
      throw err;
    });

    Promise.all([fetchStudents, fetchConfig])
      .then(([studentsRes, configRes]) => {
        if (controller.signal.aborted) return;
        setStudents(Array.isArray(studentsRes.data?.data) ? studentsRes.data.data : []);
        
        if (configRes && configRes.data?.data) {
          setConfig(configRes.data.data);
        } else {
          setConfig(null);
          setError('No assessment configuration found for this class. Please ask the admin to set it up first.');
        }
        setStatus('success');
      })
      .catch((err) => {
        if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
        console.error('Failed to load class data:', err);
        setError('Failed to load students or assessment config.');
        setStatus('error');
      });

    return () => controller.abort();
  }, [assignment]);

  return { students, config, status, error };
};

/* --------------------------------------------------------------------------
   Main Component
   -------------------------------------------------------------------------- */
const EnterMarks = () => {
  const { user } = useContext(AuthContext);
  const teacherId = user?._id;

  const { assignments, status: assignStatus, error: assignError, reload: reloadAssignments } = useAssignments(teacherId);
  
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [scores, setScores] = useState({});
  const [submittingComponents, setSubmittingComponents] = useState({});
  
  const [toast, setToast] = useState({ type: '', message: '' });

  const selectedAssignment = useMemo(
    () => assignments.find((a) => a._id === selectedAssignmentId) || null,
    [assignments, selectedAssignmentId]
  );

  const { students, config, status: classStatus, error: classError } = useClassData(selectedAssignment);

  const isLoadingClass = classStatus === 'loading';
  const hasStudents = students.length > 0;
  const hasConfig = Boolean(config);

  // Clear scores when assignment changes
  useEffect(() => {
    setScores({});
  }, [selectedAssignmentId]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

  const handleScoreChange = (studentId, componentName, value) => {
    const key = `${studentId}-${componentName}`;
    setScores((prev) => ({ ...prev, [key]: value }));
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
    if (!selectedAssignment || !config) return;

    const component = config.components.find((c) => c.name === componentName);
    if (!component) return;

    const payload = {
      class: selectedAssignment.class._id,
      course: selectedAssignment.course._id,
      componentName,
      scores: [],
    };

    let hasInvalidScores = false;

    students.forEach((student) => {
      const key = `${student._id}-${componentName}`;
      const rawValue = scores[key];
      
      if (rawValue !== undefined && rawValue.trim() !== '') {
        const numeric = parseFloat(rawValue);
        if (!isNaN(numeric) && numeric >= 0 && numeric <= component.maxScore) {
          payload.scores.push({
            student: student._id,
            scoreObtained: numeric,
            maxScore: component.maxScore,
          });
        } else {
          hasInvalidScores = true;
        }
      }
    });

    if (hasInvalidScores) {
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
    <section className="em-page">
      <div className="em-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="em-overlay" aria-hidden="true" />

      {/* Toast Notification */}
      {toast.message && (
        <div className={`em-toast em-toast--${toast.type}`} role="alert">
          {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button className="em-toast-close" onClick={() => setToast({ type: '', message: '' })} aria-label="Close">
            <FiX size={16} />
          </button>
        </div>
      )}

      <header className="em-header">
        <div>
          <h1 className="em-title">Enter Marks</h1>
          <p className="em-subtitle">
            Record and manage student assessment scores for your assigned classes.
          </p>
        </div>
      </header>

      <main className="em-content">
        {/* Toolbar: Assignment Selector */}
        <div className="em-toolbar">
          <div className="em-select-group">
            <label htmlFor="em-assignment-select" className="em-label">
              Select Course & Class
            </label>
            <div className="em-select-wrapper">
              <select
                id="em-assignment-select"
                className="em-select"
                value={selectedAssignmentId}
                onChange={(e) => setSelectedAssignmentId(e.target.value)}
                disabled={assignStatus === 'loading'}
              >
                <option value="" disabled>
                  {assignStatus === 'loading' ? 'Loading assignments...' : '-- Choose an assignment --'}
                </option>
                {assignments.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.course?.name || 'Unnamed Course'} — {a.class?.name || 'Unnamed Class'}
                  </option>
                ))}
              </select>
              <FiChevronDown className="em-select-icon" aria-hidden="true" />
            </div>
          </div>

          {assignStatus === 'error' && (
            <button className="em-icon-btn" onClick={reloadAssignments} title="Retry loading assignments">
              <FiRefreshCw size={18} />
            </button>
          )}
        </div>

        {/* Initial States (No assignment selected or loading assignments) */}
        {!selectedAssignmentId && assignStatus === 'success' && (
          <div className="em-state">
            <FiBookOpen size={40} aria-hidden="true" />
            <h3>Select an Assignment</h3>
            <p>Choose a course and class from the dropdown above to begin entering marks.</p>
          </div>
        )}

        {assignStatus === 'error' && !selectedAssignmentId && (
          <div className="em-state em-state--error" role="alert">
            <FiAlertTriangle size={32} aria-hidden="true" />
            <h3>Failed to Load Assignments</h3>
            <p>{assignError}</p>
          </div>
        )}

        {/* Class Data States */}
        {selectedAssignmentId && (
          <>
            {isLoadingClass ? (
              <div className="em-state" role="status">
                <span className="em-spinner" aria-hidden="true" />
                <p>Loading students and assessment configuration…</p>
              </div>
            ) : classError ? (
              <div className="em-state em-state--error" role="alert">
                <FiAlertTriangle size={32} aria-hidden="true" />
                <h3>Configuration Missing or Error</h3>
                <p>{classError}</p>
              </div>
            ) : !hasConfig ? (
              <div className="em-state">
                <FiSettings size={40} aria-hidden="true" />
                <h3>Assessment Config Not Set</h3>
                <p>The admin has not configured assessment components (e.g., Quiz, Exam) for this class yet.</p>
              </div>
            ) : !hasStudents ? (
              <div className="em-state">
                <FiUsers size={40} aria-hidden="true" />
                <h3>No Students Enrolled</h3>
                <p>There are no students currently enrolled in this class.</p>
              </div>
            ) : (
              /* Marks Entry Table */
              <div className="em-gradebook">
                <div className="em-table-wrapper">
                  <table className="em-table">
                    <thead>
                      <tr>
                        <th className="em-sticky-col">Student Name</th>
                        {config.components.map((comp) => (
                          <th key={comp.name} className="em-th-component">
                            <span className="em-th-title">{comp.name}</span>
                            <span className="em-th-max">Max: {comp.maxScore}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student._id}>
                          <td className="em-sticky-col em-td-student">
                            <div className="em-student-info">
                              <span className="em-avatar" aria-hidden="true">
                                {student.fullName?.charAt(0).toUpperCase() || '?'}
                              </span>
                              <span className="em-student-name">{student.fullName}</span>
                            </div>
                          </td>
                          {config.components.map((comp) => {
                            const scoreStatus = getScoreStatus(student._id, comp.name, comp.maxScore);
                            return (
                              <td key={comp.name} className="em-td-score">
                                <input
                                  type="number"
                                  min="0"
                                  max={comp.maxScore}
                                  step="any"
                                  className={`em-score-input ${scoreStatus === 'invalid' ? 'em-score-input--invalid' : ''}`}
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

                {/* Save Actions */}
                <div className="em-actions">
                  {config.components.map((comp) => (
                    <button
                      key={comp.name}
                      className="em-btn em-btn--primary"
                      onClick={() => submitComponentScores(comp.name)}
                      disabled={submittingComponents[comp.name]}
                    >
                      {submittingComponents[comp.name] ? (
                        <>
                          <span className="em-spinner em-spinner--sm" aria-hidden="true" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <FiSave size={16} /> Save {comp.name}
                        </>
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

export default EnterMarks;