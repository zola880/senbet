import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiAlertTriangle, FiCalendar, FiCheck, FiCheckCircle,
  FiClock, FiInbox, FiRefreshCw, FiTrendingUp, FiX
} from 'react-icons/fi';

import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import bgImage from '../../assets/L.png';
import './AttendanceHistory.css';

/* --------------------------------------------------------------------------
   Data Hook: Student Attendance
   -------------------------------------------------------------------------- */
const useStudentAttendance = (userId) => {
  const [attendance, setAttendance] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setAttendance([]);
      setStatus('idle');
      setError(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setError(null);

    try {
      const res = await api.get(`/api/v1/attendance/student/${userId}`, {
        signal: controller.signal,
      });
      setAttendance(Array.isArray(res.data?.data) ? res.data.data : []);
      setStatus('success');
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
      console.error('Failed to load attendance:', err);
      setAttendance([]);
      if (err.response?.status === 500) {
        setError('The server ran into a problem loading your attendance. Please try again shortly.');
      } else if (err.response?.status === 404) {
        setError('No attendance record was found for your account.');
      } else if (!err.response) {
        setError('Network error. Check your connection and try again.');
      } else {
        setError('Unable to load your attendance records. Please try again.');
      }
      setStatus('error');
    }
  }, [userId]);

  useEffect(() => {
    reload();
    return () => abortRef.current?.abort();
  }, [reload]);

  return { attendance, status, error, reload };
};

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const STATUS_CONFIG = {
  present: { label: 'Present', icon: FiCheck, badgeClass: 'ah-status-present' },
  absent: { label: 'Absent', icon: FiX, badgeClass: 'ah-status-absent' },
  late: { label: 'Late', icon: FiClock, badgeClass: 'ah-status-late' },
};

const getStatusDisplay = (statusValue) =>
  STATUS_CONFIG[statusValue] || {
    label: statusValue || 'Unknown',
    icon: FiX,
    badgeClass: 'ah-status-unknown',
  };

/* --------------------------------------------------------------------------
   Small presentational helpers
   -------------------------------------------------------------------------- */
const Toast = ({ toast, onClose }) => {
  if (!toast.message) return null;
  return (
    <div className={`ah-toast ah-toast--${toast.type}`} role="alert">
      {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
      <span>{toast.message}</span>
      <button className="ah-toast-close" onClick={onClose} aria-label="Dismiss notification">
        <FiX size={16} />
      </button>
    </div>
  );
};

const PageShell = ({ children }) => (
  <section className="ah-page">
    <div className="ah-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
    <div className="ah-wash" aria-hidden="true" />
    <main className="ah-content">
      <header className="ah-header">
        <div>
          <h1 className="ah-title">My Attendance</h1>
          <p className="ah-subtitle">Track your attendance across all classes.</p>
        </div>
      </header>
      {children}
    </main>
  </section>
);

/* --------------------------------------------------------------------------
   Main Component
   -------------------------------------------------------------------------- */
const AttendanceHistory = () => {
  const { user } = useContext(AuthContext);
  const { attendance, status, error, reload } = useStudentAttendance(user?._id);
  const [toast, setToast] = useState({ type: '', message: '' });
  const toastTimerRef = useRef(null);

  const isLoading = status === 'loading';
  const hasRecords = attendance.length > 0;

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
    if (status === 'error' && error && hasRecords) {
      // Only toast on error if we still have stale data showing behind it;
      // a full-page error state already covers the no-data case.
      showToast('error', error);
    }
  }, [status, error, hasRecords, showToast]);

  const stats = useMemo(() => {
    const total = attendance.length;
    const present = attendance.filter((a) => a.status === 'present').length;
    const absent = attendance.filter((a) => a.status === 'absent').length;
    const late = attendance.filter((a) => a.status === 'late').length;
    const marked = present + absent + late;
    const percentage = marked > 0 ? ((present + late) / marked) * 100 : 0;

    return { total, present, absent, late, percentage: percentage.toFixed(1) };
  }, [attendance]);

  // No logged-in user yet (auth still resolving, or user is signed out)
  if (!user?._id) {
    return (
      <PageShell>
        <div className="ah-state" role="status">
          <span className="ah-spinner" aria-hidden="true" />
          <p>Loading your account…</p>
        </div>
      </PageShell>
    );
  }

  // Loading State
  if (isLoading && !hasRecords) {
    return (
      <PageShell>
        <div className="ah-state" role="status" aria-live="polite">
          <span className="ah-spinner" aria-hidden="true" />
          <p>Loading your attendance records…</p>
        </div>
      </PageShell>
    );
  }

  // Error State (no cached records to fall back on)
  if (status === 'error' && !hasRecords) {
    return (
      <PageShell>
        <div className="ah-state ah-state--error" role="alert">
          <FiAlertTriangle size={32} />
          <h3>Failed to Load Attendance</h3>
          <p>{error}</p>
          <button className="ah-btn ah-btn--primary" onClick={reload}>
            <FiRefreshCw size={16} /> Try Again
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <section className="ah-page">
      <div className="ah-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="ah-wash" aria-hidden="true" />

      <Toast toast={toast} onClose={dismissToast} />

      <main className="ah-content">
        <header className="ah-header">
          <div>
            <h1 className="ah-title">My Attendance</h1>
            <p className="ah-subtitle">Track your attendance across all classes.</p>
          </div>
          <button className="ah-btn ah-btn--ghost" onClick={reload} disabled={isLoading} aria-label="Refresh attendance">
            <FiRefreshCw size={16} className={isLoading ? 'ah-spin-icon' : ''} /> Refresh
          </button>
        </header>

        {!hasRecords ? (
          <div className="ah-state">
            <FiInbox size={40} />
            <h3>No Attendance Records</h3>
            <p>Your teacher hasn't marked attendance yet. Check back later!</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="ah-summary">
              <div className="ah-summary-card ah-summary-total">
                <FiCalendar size={20} />
                <div>
                  <strong>{stats.total}</strong>
                  <span>Total Days</span>
                </div>
              </div>
              <div className="ah-summary-card ah-stat-present">
                <FiCheck size={20} />
                <div>
                  <strong>{stats.present}</strong>
                  <span>Present</span>
                </div>
              </div>
              <div className="ah-summary-card ah-stat-absent">
                <FiX size={20} />
                <div>
                  <strong>{stats.absent}</strong>
                  <span>Absent</span>
                </div>
              </div>
              <div className="ah-summary-card ah-stat-late">
                <FiClock size={20} />
                <div>
                  <strong>{stats.late}</strong>
                  <span>Late</span>
                </div>
              </div>
            </div>

            {/* Attendance Rate Card */}
            <div className="ah-rate-card">
              <div className="ah-rate-info">
                <FiTrendingUp size={24} />
                <div>
                  <h3>Attendance Rate</h3>
                  <p>Your overall attendance performance</p>
                </div>
              </div>
              <div className="ah-rate-display">
                <div className="ah-rate-circle">
                  <svg viewBox="0 0 100 100" className="ah-rate-ring" role="img" aria-label={`Attendance rate: ${stats.percentage}%`}>
                    <circle cx="50" cy="50" r="42" className="ah-rate-ring-bg" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className={`ah-rate-ring-fill ${
                        stats.percentage >= 80 ? 'ah-rate-high' : stats.percentage >= 60 ? 'ah-rate-mid' : 'ah-rate-low'
                      }`}
                      strokeDasharray={`${(Number(stats.percentage) / 100) * 264} 264`}
                    />
                  </svg>
                  <span className="ah-rate-value">{stats.percentage}%</span>
                </div>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="ah-table-card">
              <h2 className="ah-card-title">Attendance History</h2>
              <div className="ah-table-wrapper">
                <table className="ah-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Class</th>
                      <th className="ah-th-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((item, idx) => {
                      const statusDisplay = getStatusDisplay(item.status);
                      const StatusIcon = statusDisplay.icon;

                      return (
                        <tr key={item._id || idx}>
                          <td data-label="Date">
                            <div className="ah-date-cell">
                              <FiCalendar size={14} />
                              <span>{formatDate(item.date)}</span>
                            </div>
                          </td>
                          <td data-label="Class">
                            <strong>{item.class || '—'}</strong>
                          </td>
                          <td data-label="Status" className="ah-td-right">
                            <span className={`ah-status-badge ${statusDisplay.badgeClass}`}>
                              <StatusIcon size={14} />
                              {statusDisplay.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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

export default AttendanceHistory;