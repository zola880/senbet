import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  FiAlertTriangle, FiCheck, FiCheckCircle, FiChevronDown,
  FiClock, FiInbox, FiRefreshCw, FiSave, FiUsers, FiX
} from 'react-icons/fi';

import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import bgImage from '../../assets/L.png';
import './TakeAttendance.css';

/* --------------------------------------------------------------------------
   Data Hook: Classes (Admin sees all, Teacher sees assigned)
   -------------------------------------------------------------------------- */
const useClasses = (user) => {
  const [classes, setClasses] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const reload = useCallback(async () => {
    if (!user?._id) {
      setClasses([]);
      setStatus('success');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setError(null);

    try {
      const isAdmin = user.role === 'admin';
      let res;
      
      if (isAdmin) {
        res = await api.get('/api/v1/classes', { signal: controller.signal });
      } else {
        res = await api.get(`/api/v1/assignments/teacher/${user._id}`, { signal: controller.signal });
      }

      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      
      if (isAdmin) {
        setClasses(data);
      } else {
        const uniqueClasses = [];
        const seen = new Set();
        data.forEach(a => {
          if (a.class?._id && !seen.has(a.class._id)) {
            uniqueClasses.push(a.class);
            seen.add(a.class._id);
          }
        });
        setClasses(uniqueClasses);
      }
      setStatus('success');
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
      console.error('Failed to load classes:', err);
      setError('Unable to load classes. Please try again.');
      setStatus('error');
    }
  }, [user]);

  useEffect(() => {
    reload();
    return () => abortRef.current?.abort();
  }, [reload]);

  return { classes, status, error, reload };
};

/* --------------------------------------------------------------------------
   Data Hook: Attendance Records
   -------------------------------------------------------------------------- */
const useAttendance = (selectedClass, date) => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!selectedClass || !date) {
      setAttendanceData(null);
      setStatus('idle');
      setError(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setError(null);

    api.get(`/api/v1/attendance?class=${selectedClass}&date=${date}`, { signal: controller.signal })
      .then(res => {
        if (controller.signal.aborted) return;
        setAttendanceData(res.data?.data || null);
        setStatus('success');
      })
      .catch(err => {
        if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
        console.error('Failed to load attendance:', err);
        setError('Failed to load attendance records.');
        setStatus('error');
      });

    return () => controller.abort();
  }, [selectedClass, date]);

  return { attendanceData, status, error, setAttendanceData };
};

/* --------------------------------------------------------------------------
   Status Options Configuration
   -------------------------------------------------------------------------- */
const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', icon: FiCheck, colorClass: 'ta-status-present' },
  { value: 'absent', label: 'Absent', icon: FiX, colorClass: 'ta-status-absent' },
  { value: 'late', label: 'Late', icon: FiClock, colorClass: 'ta-status-late' },
];

/* --------------------------------------------------------------------------
   Main Component
   -------------------------------------------------------------------------- */
const TakeAttendance = () => {
  const { user } = useContext(AuthContext);
  const { classes, status: classesStatus, error: classesError, reload: reloadClasses } = useClasses(user);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });

  const { attendanceData, status: attendanceStatus, error: attendanceError, setAttendanceData } = useAttendance(selectedClass, date);

  const isLoadingClasses = classesStatus === 'loading';
  const hasClasses = classes.length > 0;
  const isLoadingAttendance = attendanceStatus === 'loading';
  const students = attendanceData?.records?.map(r => r.student).filter(Boolean) || [];
  const hasStudents = students.length > 0;
  const selectedClassName = classes.find(c => c._id === selectedClass)?.name;

  // Initialize records from fetched attendance
  useEffect(() => {
    if (attendanceData?.records) {
      const init = {};
      attendanceData.records.forEach(r => {
        if (r.student?._id) init[r.student._id] = r.status;
      });
      setRecords(init);
    } else {
      setRecords({});
    }
  }, [attendanceData]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

  const handleStatusChange = (studentId, statusValue) => {
    setRecords(prev => ({ ...prev, [studentId]: statusValue }));
  };

  const handleSave = async () => {
    if (!selectedClass || !date) return;

    const payload = {
      class: selectedClass,
      date,
      records: Object.entries(records).map(([student, status]) => ({
        student,
        status,
      })),
    };

    setIsSaving(true);
    try {
      await api.post('/api/v1/attendance', payload);
      showToast('success', 'Attendance saved successfully.');
      // Refetch to get updated data
      const res = await api.get(`/api/v1/attendance?class=${selectedClass}&date=${date}`);
      setAttendanceData(res.data?.data || null);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Error saving attendance.');
    } finally {
      setIsSaving(false);
    }
  };

  const markAllAs = (status) => {
    const newRecords = {};
    students.forEach(student => {
      newRecords[student._id] = status;
    });
    setRecords(newRecords);
  };

  return (
    <section className="ta-page">
      <div className="ta-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="ta-wash" aria-hidden="true" />

      {toast.message && (
        <div className={`ta-toast ta-toast--${toast.type}`} role="alert">
          {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button className="ta-toast-close" onClick={() => setToast({ type: '', message: '' })} aria-label="Close">
            <FiX size={16} />
          </button>
        </div>
      )}

      <main className="ta-content">
        <header className="ta-header">
          <h1 className="ta-title">Take Attendance</h1>
          <p className="ta-subtitle">Mark attendance for your students by class and date.</p>
        </header>

        {/* Toolbar: Class & Date Selectors */}
        <div className="ta-toolbar">
          <div className="ta-select-group">
            <label htmlFor="ta-class-select" className="ta-label">Select Class</label>
            <div className="ta-select-wrapper">
              <select
                id="ta-class-select"
                className="ta-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                disabled={isLoadingClasses}
              >
                <option value="">{isLoadingClasses ? 'Loading classes...' : '-- Choose a class --'}</option>
                {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <FiChevronDown className="ta-select-icon" />
            </div>
          </div>

          <div className="ta-select-group">
            <label htmlFor="ta-date-input" className="ta-label">Date</label>
            <input
              id="ta-date-input"
              type="date"
              className="ta-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {selectedClass && (
            <div className="ta-active-badge">
              <FiUsers size={16} />
              <span>Class: <strong>{selectedClassName}</strong></span>
            </div>
          )}
        </div>

        {/* Loading Classes Error */}
        {!selectedClass && classesStatus === 'error' && !hasClasses && (
          <div className="ta-state ta-state--error" role="alert">
            <FiAlertTriangle size={32} />
            <h3>Failed to Load Classes</h3>
            <p>{classesError}</p>
            <button className="ta-btn ta-btn--primary" onClick={reloadClasses}>
              <FiRefreshCw size={16} /> Try Again
            </button>
          </div>
        )}

        {/* No Classes */}
        {!selectedClass && !isLoadingClasses && classesStatus === 'success' && !hasClasses && (
          <div className="ta-state">
            <FiInbox size={40} />
            <h3>No Classes Available</h3>
            <p>You don't have any classes assigned yet.</p>
          </div>
        )}

        {/* Initial State */}
        {!selectedClass && !isLoadingClasses && classesStatus === 'success' && hasClasses && (
          <div className="ta-state">
            <FiUsers size={48} aria-hidden="true" />
            <h3>Select a Class</h3>
            <p>Choose a class and date from the toolbar above to start taking attendance.</p>
          </div>
        )}

        {/* Loading Attendance */}
        {selectedClass && isLoadingAttendance && (
          <div className="ta-state" role="status">
            <span className="ta-spinner" />
            <p>Loading students…</p>
          </div>
        )}

        {/* Attendance Error */}
        {selectedClass && !isLoadingAttendance && attendanceStatus === 'error' && (
          <div className="ta-state ta-state--error" role="alert">
            <FiAlertTriangle size={32} />
            <h3>Failed to Load Students</h3>
            <p>{attendanceError}</p>
          </div>
        )}

        {/* No Students */}
        {selectedClass && !isLoadingAttendance && attendanceStatus === 'success' && !hasStudents && (
          <div className="ta-state">
            <FiInbox size={40} />
            <h3>No Students Found</h3>
            <p>No students are enrolled in this class yet.</p>
          </div>
        )}

        {/* Attendance Table */}
        {selectedClass && !isLoadingAttendance && attendanceStatus === 'success' && hasStudents && (
          <div className="ta-attendance-card">
            <div className="ta-card-header">
              <h2 className="ta-card-title">
                Attendance for {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>
              <div className="ta-bulk-actions">
                <button className="ta-btn ta-btn--ghost ta-btn--sm" onClick={() => markAllAs('present')}>
                  <FiCheck size={14} /> All Present
                </button>
                <button className="ta-btn ta-btn--ghost ta-btn--sm" onClick={() => markAllAs('absent')}>
                  <FiX size={14} /> All Absent
                </button>
              </div>
            </div>

            <div className="ta-table-wrapper">
              <table className="ta-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll No</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const currentStatus = records[student._id] || '';

                    return (
                      <tr key={student._id}>
                        <td data-label="Student">
                          <div className="ta-student-cell">
                            <span className="ta-avatar" aria-hidden="true">
                              {student.fullName?.charAt(0).toUpperCase() || '?'}
                            </span>
                            <span className="ta-student-name">{student.fullName}</span>
                          </div>
                        </td>
                        <td data-label="Roll No">{student.rollNumber || '—'}</td>
                        <td data-label="Status">
                          <div className="ta-status-group" role="radiogroup" aria-label={`Attendance status for ${student.fullName}`}>
                            {STATUS_OPTIONS.map((opt) => {
                              const Icon = opt.icon;
                              const isActive = currentStatus === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  role="radio"
                                  aria-checked={isActive}
                                  className={`ta-status-btn ${opt.colorClass} ${isActive ? 'ta-status-btn--active' : ''}`}
                                  onClick={() => handleStatusChange(student._id, opt.value)}
                                >
                                  <Icon size={14} />
                                  <span>{opt.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="ta-card-footer">
              <button className="ta-btn ta-btn--primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <><span className="ta-spinner ta-spinner--sm" /> Saving…</>
                ) : (
                  <><FiSave size={16} /> Save Attendance</>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </section>
  );
};

export default TakeAttendance;