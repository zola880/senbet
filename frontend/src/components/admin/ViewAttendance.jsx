import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FiAlertTriangle, FiCheck, FiCheckCircle, FiChevronDown,
  FiClock, FiEdit2, FiInbox, FiSave, FiUsers, FiX, FiXCircle
} from 'react-icons/fi';

import api from '../../services/api';
import bgImage from '../../assets/L.png';
import './ViewAttendance.css';

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
   Data Hook: Attendance
   -------------------------------------------------------------------------- */
const useAttendance = (selectedClass, date) => {
  const [attendance, setAttendance] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!selectedClass || !date) {
      setAttendance(null);
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
      .then((res) => {
        if (controller.signal.aborted) return;
        setAttendance(res.data?.data || null);
        setStatus('success');
      })
      .catch((err) => {
        if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
        console.error('Failed to load attendance:', err);
        setError('Failed to load attendance records.');
        setStatus('error');
      });

    return () => controller.abort();
  }, [selectedClass, date]);

  return { attendance, status, error, setAttendance };
};

/* --------------------------------------------------------------------------
   Main Component
   -------------------------------------------------------------------------- */
const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', icon: FiCheck, colorClass: 'va-status-present' },
  { value: 'absent', label: 'Absent', icon: FiX, colorClass: 'va-status-absent' },
  { value: 'late', label: 'Late', icon: FiClock, colorClass: 'va-status-late' },
];

const ViewAttendance = () => {
  const { classes, status: classStatus } = useClasses();
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [editing, setEditing] = useState(false);
  const [records, setRecords] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });

  const { attendance, status, error, setAttendance } = useAttendance(selectedClass, date);

  const isLoadingAttendance = status === 'loading';
  const students = attendance?.records?.map(r => r.student).filter(Boolean) || [];
  const hasStudents = students.length > 0;
  const selectedClassName = classes.find(c => c._id === selectedClass)?.name;

  // Initialize records from fetched attendance
  useEffect(() => {
    if (attendance?.records) {
      const init = {};
      attendance.records.forEach(r => {
        if (r.student?._id) init[r.student._id] = r.status;
      });
      setRecords(init);
    } else {
      setRecords({});
    }
  }, [attendance]);

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
      records: Object.entries(records).map(([student, statusValue]) => ({
        student,
        status: statusValue,
      })),
    };

    setIsSaving(true);
    try {
      await api.post('/api/v1/attendance', payload);
      showToast('success', 'Attendance updated successfully.');
      setEditing(false);
      // Refetch to get updated data
      const res = await api.get(`/api/v1/attendance?class=${selectedClass}&date=${date}`);
      setAttendance(res.data?.data || null);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Error updating attendance.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    // Reset records to original state
    if (attendance?.records) {
      const init = {};
      attendance.records.forEach(r => {
        if (r.student?._id) init[r.student._id] = r.status;
      });
      setRecords(init);
    }
  };

  const getStatusDisplay = (statusValue) => {
    const opt = STATUS_OPTIONS.find(o => o.value === statusValue);
    if (!opt) return { label: '—', colorClass: '' };
    return { label: opt.label, colorClass: opt.colorClass };
  };

  return (
    <section className="va-page">
      <div className="va-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="va-wash" aria-hidden="true" />

      {toast.message && (
        <div className={`va-toast va-toast--${toast.type}`} role="alert">
          {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button className="va-toast-close" onClick={() => setToast({ type: '', message: '' })} aria-label="Close">
            <FiX size={16} />
          </button>
        </div>
      )}

      <main className="va-content">
        <header className="va-header">
          <h1 className="va-title">View Attendance</h1>
          <p className="va-subtitle">Review and edit attendance records for any class and date.</p>
        </header>

        {/* Toolbar: Class & Date Selectors */}
        <div className="va-toolbar">
          <div className="va-select-group">
            <label htmlFor="va-class-select" className="va-label">Select Class</label>
            <div className="va-select-wrapper">
              <select
                id="va-class-select"
                className="va-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                disabled={classStatus === 'loading'}
              >
                <option value="">{classStatus === 'loading' ? 'Loading classes...' : '-- Choose a class --'}</option>
                {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <FiChevronDown className="va-select-icon" />
            </div>
          </div>

          <div className="va-select-group">
            <label htmlFor="va-date-input" className="va-label">Date</label>
            <input
              id="va-date-input"
              type="date"
              className="va-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {selectedClass && (
            <div className="va-active-badge">
              <FiUsers size={16} />
              <span>Viewing: <strong>{selectedClassName}</strong></span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoadingAttendance && (
          <div className="va-state" role="status">
            <span className="va-spinner" />
            <p>Loading attendance records…</p>
          </div>
        )}

        {/* Error State */}
        {!isLoadingAttendance && status === 'error' && (
          <div className="va-state va-state--error" role="alert">
            <FiAlertTriangle size={32} />
            <h3>Failed to Load Attendance</h3>
            <p>{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingAttendance && status === 'success' && !hasStudents && selectedClass && date && (
          <div className="va-state">
            <FiInbox size={40} />
            <h3>No Attendance Recorded</h3>
            <p>No attendance records found for this class on the selected date.</p>
          </div>
        )}

        {/* Attendance Table */}
        {!isLoadingAttendance && status === 'success' && hasStudents && (
          <div className="va-attendance-card">
            <div className="va-card-header">
              <h2 className="va-card-title">
                Attendance for {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>
              {!editing && (
                <button className="va-btn va-btn--primary" onClick={() => setEditing(true)}>
                  <FiEdit2 size={16} /> Edit Attendance
                </button>
              )}
            </div>

            <div className="va-table-wrapper">
              <table className="va-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll No</th>
                    <th>Status</th>
                    {editing && <th className="va-th-actions">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const currentStatus = records[student._id] || 'absent';
                    const statusDisplay = getStatusDisplay(currentStatus);

                    return (
                      <tr key={student._id}>
                        <td data-label="Student">
                          <div className="va-student-cell">
                            <span className="va-avatar" aria-hidden="true">
                              {student.fullName?.charAt(0).toUpperCase() || '?'}
                            </span>
                            <span className="va-student-name">{student.fullName}</span>
                          </div>
                        </td>
                        <td data-label="Roll No">{student.rollNumber || '—'}</td>
                        <td data-label="Status">
                          {editing ? (
                            <div className="va-status-group" role="radiogroup" aria-label={`Attendance status for ${student.fullName}`}>
                              {STATUS_OPTIONS.map((opt) => {
                                const Icon = opt.icon;
                                const isActive = currentStatus === opt.value;
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={isActive}
                                    className={`va-status-btn ${opt.colorClass} ${isActive ? 'va-status-btn--active' : ''}`}
                                    onClick={() => handleStatusChange(student._id, opt.value)}
                                  >
                                    <Icon size={14} />
                                    <span>{opt.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <span className={`va-status-badge ${statusDisplay.colorClass}`}>
                              {statusDisplay.label}
                            </span>
                          )}
                        </td>
                        {editing && (
                          <td data-label="Actions" className="va-td-actions">
                            <span className="va-check-icon" aria-hidden="true">
                              <FiCheck size={16} />
                            </span>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {editing && (
              <div className="va-card-footer">
                <button className="va-btn va-btn--ghost" onClick={handleCancel} disabled={isSaving}>
                  <FiX size={16} /> Cancel
                </button>
                <button className="va-btn va-btn--primary" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <><span className="va-spinner va-spinner--sm" /> Saving…</>
                  ) : (
                    <><FiSave size={16} /> Save Changes</>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </section>
  );
};

export default ViewAttendance;