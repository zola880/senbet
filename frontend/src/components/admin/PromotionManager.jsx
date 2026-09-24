import { useCallback, useEffect, useState } from 'react';
import {
  FiAlertTriangle,
  FiArrowUpCircle,
  FiCheckCircle,
  FiInbox,
  FiRotateCcw,
  FiSearch,
  FiX,
} from 'react-icons/fi';

import api from '../../services/api';
import bgImage from '../../assets/L.png';
import './PromotionManager.css';

const STATUS_LABELS = {
  promoted: 'Promoted',
  retained: 'Retained',
  graduated: 'Graduated',
  incomplete: 'Incomplete',
};

const PromotionManager = () => {
  const [academicYear, setAcademicYear] = useState('');
  const [promotionScore, setPromotionScore] = useState('50');
  const [preview, setPreview] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [toast, setToast] = useState({ type: '', message: '' });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 5000);
  };

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get('/api/v1/promotion/history');
      setHistory(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error('Failed to load promotion history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handlePreview = async () => {
    const year = academicYear.trim();
    if (!year) {
      showToast('error', 'Please enter the academic year first.');
      return;
    }
    const score = Number(promotionScore);
    if (promotionScore === '' || Number.isNaN(score) || score < 0 || score > 100) {
      showToast('error', 'Promotion score must be a number between 0 and 100.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.get('/api/v1/promotion/preview', {
        params: { academicYear: year, promotionScore: score },
      });
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setPreview(data);
      setSummary(res.data?.summary || null);
      if (data.length === 0) {
        showToast('error', 'No students with scores found. Check assessment configs, course assignments and entered scores.');
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to load promotion preview.');
      setPreview([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!preview.length || !summary) return;
    const ok = window.confirm(
      `Apply promotion for ${academicYear.trim()} with promotion score ${promotionScore}?\n\n` +
      `${summary.promoted} student(s) will move to the next class.\n` +
      `${summary.graduated} student(s) will graduate.\n` +
      `${summary.retained} student(s) will stay in their current class.\n` +
      `${summary.incomplete} student(s) have missing course scores and will NOT be promoted.\n\n` +
      `You can roll this back later from the history below.`
    );
    if (!ok) return;

    setApplying(true);
    try {
      const res = await api.post('/api/v1/promotion/run', {
        academicYear: academicYear.trim(),
        promotionScore: Number(promotionScore),
      });
      showToast('success', res.data?.message || 'Promotion applied successfully.');
      setPreview([]);
      setSummary(null);
      loadHistory();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to apply promotion.');
    } finally {
      setApplying(false);
    }
  };

  const handleRollback = async (batch) => {
    const ok = window.confirm(
      `Roll back the ${batch.academicYear} promotion?\n\nAll moved students will return to their previous classes.`
    );
    if (!ok) return;
    try {
      const res = await api.post(`/api/v1/promotion/rollback/${batch._id}`);
      showToast('success', res.data?.message || 'Promotion rolled back successfully.');
      loadHistory();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to roll back promotion.');
    }
  };

  return (
    <section className="pm-page">
      <div className="pm-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="pm-wash" aria-hidden="true" />

      {toast.message && (
        <div className={`pm-toast pm-toast--${toast.type}`} role="alert">
          {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button className="pm-toast-close" onClick={() => setToast({ type: '', message: '' })} aria-label="Close">
            <FiX size={16} />
          </button>
        </div>
      )}

      <main className="pm-content">
        <header className="pm-header">
          <div>
            <h1 className="pm-title">End of Year Promotion</h1>
            <p className="pm-subtitle">
              Students are promoted only when ALL course scores are submitted AND their average meets the promotion score you set.
            </p>
          </div>
        </header>

        {/* Controls */}
        <div className="pm-card pm-controls">
          <div className="pm-field">
            <label htmlFor="pm-year" className="pm-label">Academic Year</label>
            <input
              id="pm-year"
              type="text"
              className="pm-input"
              placeholder="e.g., 2018 or 2025/26"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              disabled={loading || applying}
            />
            <small className="pm-hint">Label for this promotion batch.</small>
          </div>
          <div className="pm-field pm-field--score">
            <label htmlFor="pm-score" className="pm-label">Promotion Score (0–100)</label>
            <input
              id="pm-score"
              type="number"
              min="0"
              max="100"
              className="pm-input"
              value={promotionScore}
              onChange={(e) => setPromotionScore(e.target.value)}
              disabled={loading || applying}
            />
            <small className="pm-hint">Admin-decided pass threshold for this year.</small>
          </div>
          <div className="pm-controls-actions">
            <button className="pm-btn pm-btn--primary" onClick={handlePreview} disabled={loading || applying}>
              <FiSearch size={16} />
              {loading ? 'Calculating…' : 'Preview Promotion'}
            </button>
            <button
              className="pm-btn pm-btn--success"
              onClick={handleApply}
              disabled={!preview.length || applying || loading}
            >
              <FiCheckCircle size={16} />
              {applying ? 'Applying…' : 'Apply Promotion'}
            </button>
          </div>
        </div>

        {/* Summary stats */}
        {summary && (
          <div className="pm-stats">
            <div className="pm-stat">
              <span className="pm-stat-value">{summary.totalStudents}</span>
              <span className="pm-stat-label">Total</span>
            </div>
            <div className="pm-stat pm-stat--promoted">
              <span className="pm-stat-value">{summary.promoted}</span>
              <span className="pm-stat-label">Promoted</span>
            </div>
            <div className="pm-stat pm-stat--retained">
              <span className="pm-stat-value">{summary.retained}</span>
              <span className="pm-stat-label">Retained</span>
            </div>
            <div className="pm-stat pm-stat--graduated">
              <span className="pm-stat-value">{summary.graduated}</span>
              <span className="pm-stat-label">Graduated</span>
            </div>
            <div className="pm-stat pm-stat--incomplete">
              <span className="pm-stat-value">{summary.incomplete}</span>
              <span className="pm-stat-label">Incomplete</span>
            </div>
          </div>
        )}

        {/* Preview table */}
        {preview.length > 0 ? (
          <div className="pm-table-wrapper">
            <table className="pm-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Current Class</th>
                  <th>Average</th>
                  <th>Promotion Score</th>
                  <th>Status</th>
                  <th>Missing Courses</th>
                  <th>Next Class</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((r) => (
                  <tr key={r.studentId}>
                    <td>
                      <div className="pm-student-name">{r.fullName}</div>
                      <div className="pm-student-code">{r.studentCode || '—'}</div>
                    </td>
                    <td>{r.currentClass}</td>
                    <td className="pm-score">{r.averageScore}%</td>
                    <td>{r.promotionScore}%</td>
                    <td>
                      <span className={`pm-badge pm-badge--${r.status}`}>
                        {STATUS_LABELS[r.status] || r.status}
                      </span>
                    </td>
                    <td className="pm-missing">
                      {r.missingCourses && r.missingCourses.length > 0 ? r.missingCourses.join(', ') : '—'}
                    </td>
                    <td>{r.nextClass || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !loading && (
            <div className="pm-state">
              <FiArrowUpCircle size={40} />
              <h3>No preview loaded</h3>
              <p>
                Enter the academic year and the promotion score, then click “Preview Promotion”.
                A student is promoted only if every course has submitted scores and their average is at or above the promotion score.
              </p>
            </div>
          )
        )}

        {/* History */}
        <div className="pm-card">
          <h2 className="pm-card-title">Promotion History</h2>
          {historyLoading ? (
            <div className="pm-state pm-state--flat">
              <span className="pm-spinner" aria-hidden="true" />
              <p>Loading history…</p>
            </div>
          ) : history.length === 0 ? (
            <div className="pm-state pm-state--flat">
              <FiInbox size={32} />
              <p>No promotions have been run yet.</p>
            </div>
          ) : (
            <div className="pm-history">
              {history.map((batch) => (
                <div key={batch._id} className="pm-history-item">
                  <div className="pm-history-info">
                    <div className="pm-history-top">
                      <strong>{batch.academicYear}</strong>
                      <span className={`pm-badge pm-badge--${batch.status === 'applied' ? 'promoted' : batch.status === 'rolled_back' ? 'retained' : 'graduated'}`}>
                        {batch.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="pm-history-meta">
                      Promotion score: {batch.promotionScore ?? 50}% · Run by {batch.runBy?.fullName || 'Unknown'} · {new Date(batch.runAt).toLocaleString()}
                    </div>
                    <div className="pm-history-counts">
                      {batch.summary?.promoted ?? 0} promoted · {batch.summary?.retained ?? 0} retained · {batch.summary?.graduated ?? 0} graduated · {batch.summary?.incomplete ?? 0} incomplete
                    </div>
                  </div>
                  {batch.status === 'applied' && (
                    <button className="pm-btn pm-btn--ghost pm-btn--rollback" onClick={() => handleRollback(batch)}>
                      <FiRotateCcw size={15} />
                      Rollback
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </section>
  );
};

export default PromotionManager;