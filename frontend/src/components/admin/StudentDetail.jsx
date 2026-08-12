import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiBook, FiAward, FiMail, FiEdit2, FiTrash2, FiUsers,
  FiHash, FiTrendingUp, FiX, FiCheckCircle, FiAlertTriangle, FiRefreshCw,
  FiChevronDown, FiInbox, FiUser, FiPhone, FiMapPin, FiCalendar, FiHome
} from 'react-icons/fi';
import { FaCrown, FaMedal } from 'react-icons/fa';

import api from '../../services/api';
import bgImage from '../../assets/L.png';
import './StudentDetail.css';

const ADDRESS_OPTIONS = [
  { value: '', label: 'Select address' },
  { value: 'ላይ ቤሮ', label: 'ላይ ቤሮ' },
  { value: 'ታች ቤሮ', label: 'ታች ቤሮ' },
  { value: 'ጠቼ', label: 'ጠቼ' },
];

const SEX_OPTIONS = [
  { value: '', label: 'Select sex' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
];

const useStudentDetail = (id) => {
  const [student, setStudent] = useState(null);
  const [scores, setScores] = useState([]);
  const [rankData, setRankData] = useState(null);
  const [classes, setClasses] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const reload = useCallback(async () => {
    if (!id) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;
    setStatus('loading');
    setError(null);
    try {
      const [studentRes, scoresRes, rankRes, classesRes] = await Promise.all([
        api.get(`/api/v1/users/${id}`, { signal }),
        api.get(`/api/v1/scores?student=${id}`, { signal }),
        api.get(`/api/v1/rankings/student/${id}`, { signal }).catch(() => ({ data: { data: null } })),
        api.get('/api/v1/classes', { signal })
      ]);
      setStudent(studentRes.data?.data || null);
      setScores(Array.isArray(scoresRes.data?.data) ? scoresRes.data.data : []);
      setRankData(rankRes.data?.data || null);
      setClasses(Array.isArray(classesRes.data?.data) ? classesRes.data.data : []);
      setStatus('success');
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
      console.error('Failed to load student details:', err);
      setError('Failed to load student details.');
      setStatus('error');
    }
  }, [id]);

  useEffect(() => { reload(); return () => abortRef.current?.abort(); }, [reload]);
  return { student, scores, rankData, classes, status, error, reload, setStudent };
};

const BaseModal = ({ isOpen, onClose, children, title }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return (
    <div className="sd-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sd-modal-header">
          <h2>{title}</h2>
          <button className="sd-modal-close" onClick={onClose} aria-label="Close modal"><FiX size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

const EditStudentModal = ({ isOpen, onClose, onSubmit, initialData, classes, isSaving }) => {
  const [form, setForm] = useState({
    fullName: '', email: '', class: '', phone: '',
    academicLevel: '', address: '', age: '', sex: '', fatherName: '',
  });
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && initialData) {
      setForm({
        fullName: initialData.fullName || '',
        email: initialData.email || '',
        class: initialData.class?._id || '',
        phone: initialData.phone || '',
        academicLevel: initialData.academicLevel || '',
        address: initialData.address || '',
        age: initialData.age ? String(initialData.age) : '',
        sex: initialData.sex || '',
        fatherName: initialData.fatherName || '',
      });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (payload.age) payload.age = Number(payload.age);
    else delete payload.age;
    onSubmit(payload);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Edit Student">
      <form onSubmit={handleSubmit} className="sd-form">
        <div className="sd-form-group">
          <label className="sd-label">Full Name <span className="sd-required">*</span></label>
          <input ref={inputRef} name="fullName" className="sd-input" value={form.fullName} onChange={handleChange} required />
        </div>

        <div className="sd-form-row">
          <div className="sd-form-group">
            <label className="sd-label">Age</label>
            <input name="age" type="number" min="1" max="120" className="sd-input" value={form.age} onChange={handleChange} />
          </div>
          <div className="sd-form-group">
            <label className="sd-label">Sex</label>
            <div className="sd-select-wrapper">
              <select name="sex" className="sd-select" value={form.sex} onChange={handleChange}>
                {SEX_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <FiChevronDown className="sd-select-icon" />
            </div>
          </div>
        </div>

        <div className="sd-form-group">
          <label className="sd-label">Father's Name</label>
          <input name="fatherName" className="sd-input" value={form.fatherName} onChange={handleChange} />
        </div>

        <div className="sd-form-group">
          <label className="sd-label">Academic Level</label>
          <input name="academicLevel" className="sd-input" placeholder="e.g., Grade 5" value={form.academicLevel} onChange={handleChange} />
        </div>

        <div className="sd-form-group">
          <label className="sd-label">Address</label>
          <div className="sd-select-wrapper">
            <select name="address" className="sd-select" value={form.address} onChange={handleChange}>
              {ADDRESS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <FiChevronDown className="sd-select-icon" />
          </div>
        </div>

        <div className="sd-form-group">
          <label className="sd-label">Parent Phone</label>
          <input name="phone" type="tel" className="sd-input" placeholder="+251 912 345 678" value={form.phone} onChange={handleChange} />
        </div>

        <div className="sd-form-group">
          <label className="sd-label">Class</label>
          <div className="sd-select-wrapper">
            <select name="class" className="sd-select" value={form.class} onChange={handleChange}>
              <option value="">No Class Assigned</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <FiChevronDown className="sd-select-icon" />
          </div>
        </div>

        <div className="sd-form-actions">
          <button type="button" className="sd-btn sd-btn--ghost" onClick={onClose} disabled={isSaving}>Cancel</button>
          <button type="submit" className="sd-btn sd-btn--primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, isConfirming }) => {
  if (!isOpen) return null;
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="sd-confirm-body">
        <p>{message}</p>
        <div className="sd-form-actions">
          <button className="sd-btn sd-btn--ghost" onClick={onClose} disabled={isConfirming}>Cancel</button>
          <button className="sd-btn sd-btn--danger" onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? 'Deleting...' : 'Delete Student'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { student, scores, rankData, classes, status, error, reload, setStudent } = useStudentDetail(id);
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

  const scoresByCourse = useMemo(() => {
    return scores.reduce((acc, score) => {
      const courseId = score.course?._id || 'unknown';
      if (!acc[courseId]) acc[courseId] = { courseName: score.course?.name || 'Unknown Course', components: [] };
      acc[courseId].components.push(score);
      return acc;
    }, {});
  }, [scores]);

  const averageScore = useMemo(() => {
    if (scores.length === 0) return 0;
    const totalPct = scores.reduce((sum, s) => sum + ((s.scoreObtained / s.maxScore) * 100), 0);
    return (totalPct / scores.length).toFixed(1);
  }, [scores]);

  const handleUpdateStudent = async (formData) => {
    setIsSaving(true);
    try {
      const res = await api.put(`/api/v1/users/${student._id}`, formData);
      setStudent(res.data?.data || { ...student, ...formData });
      setEditModalOpen(false);
      showToast('success', 'Student updated successfully.');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to update student.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStudent = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/api/v1/users/${student._id}`);
      showToast('success', 'Student deleted successfully.');
      setTimeout(() => navigate('/admin/users'), 1000);
    } catch (err) {
      showToast('error', 'Failed to delete student.');
      setDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (status === 'loading' && !student) {
    return (
      <section className="sd-page">
        <div className="sd-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
        <div className="sd-wash" aria-hidden="true" />
        <div className="sd-state"><span className="sd-spinner" /> <p>Loading student profile…</p></div>
      </section>
    );
  }

  if (status === 'error' && !student) {
    return (
      <section className="sd-page">
        <div className="sd-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
        <div className="sd-wash" aria-hidden="true" />
        <div className="sd-state sd-state--error" role="alert">
          <FiAlertTriangle size={32} />
          <h3>Failed to load student</h3>
          <p>{error}</p>
          <button className="sd-btn sd-btn--primary" onClick={reload}><FiRefreshCw size={16} /> Try Again</button>
        </div>
      </section>
    );
  }

  if (!student) return null;

  const initial = student.fullName?.charAt(0).toUpperCase() || '?';
  const rankClass = rankData ? (rankData.rank === 1 ? 'sd-rank-1' : rankData.rank === 2 ? 'sd-rank-2' : rankData.rank === 3 ? 'sd-rank-3' : 'sd-rank-default') : '';

  return (
    <section className="sd-page">
      <div className="sd-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="sd-wash" aria-hidden="true" />

      {toast.message && (
        <div className={`sd-toast sd-toast--${toast.type}`} role="alert">
          {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button className="sd-toast-close" onClick={() => setToast({ type: '', message: '' })} aria-label="Close"><FiX size={16} /></button>
        </div>
      )}

      <main className="sd-content">
        <button className="sd-back-btn" onClick={() => navigate('/admin/users')}>
          <FiArrowLeft size={18} /> Back to Users
        </button>

        {/* Profile Header Card */}
        <div className="sd-profile-card">
          <div className="sd-avatar" aria-hidden="true">{initial}</div>
          <div className="sd-profile-info">
            <h1 className="sd-name">{student.fullName}</h1>
            <div className="sd-pills">
              <span className="sd-pill"><FiUsers size={14} /> {student.class?.name || 'No Class Assigned'}</span>
              {student.studentId && <span className="sd-pill"><FiHash size={14} /> {student.studentId}</span>}
              {student.phone && <span className="sd-pill sd-pill--email"><FiPhone size={14} /> {student.phone}</span>}
            </div>
          </div>
          <div className="sd-profile-actions">
            <button className="sd-btn sd-btn--ghost" onClick={() => setEditModalOpen(true)}>
              <FiEdit2 size={16} /> Edit
            </button>
            <button className="sd-btn sd-btn--danger" onClick={() => setDeleteModalOpen(true)}>
              <FiTrash2 size={16} /> Delete
            </button>
          </div>
        </div>

        {/* NEW: Personal Information Section */}
        <div className="sd-section">
          <h2 className="sd-section-title">Personal Information</h2>
          <div className="sd-info-grid">
            <div className="sd-info-item">
              <div className="sd-info-icon"><FiUser size={18} /></div>
              <div className="sd-info-content">
                <span className="sd-info-label">Father's Name</span>
                <span className="sd-info-value">{student.fatherName || '—'}</span>
              </div>
            </div>
            <div className="sd-info-item">
              <div className="sd-info-icon sd-info-icon--calendar"><FiCalendar size={18} /></div>
              <div className="sd-info-content">
                <span className="sd-info-label">Age</span>
                <span className="sd-info-value">{student.age ? `${student.age} years` : '—'}</span>
              </div>
            </div>
            <div className="sd-info-item">
              <div className="sd-info-icon sd-info-icon--gender"><FiUser size={18} /></div>
              <div className="sd-info-content">
                <span className="sd-info-label">Sex</span>
                <span className="sd-info-value">{student.sex || '—'}</span>
              </div>
            </div>
            <div className="sd-info-item">
              <div className="sd-info-icon sd-info-icon--book"><FiBook size={18} /></div>
              <div className="sd-info-content">
                <span className="sd-info-label">Academic Level</span>
                <span className="sd-info-value">{student.academicLevel || '—'}</span>
              </div>
            </div>
            <div className="sd-info-item">
              <div className="sd-info-icon sd-info-icon--map"><FiMapPin size={18} /></div>
              <div className="sd-info-content">
                <span className="sd-info-label">Address</span>
                <span className="sd-info-value">{student.address || '—'}</span>
              </div>
            </div>
            <div className="sd-info-item">
              <div className="sd-info-icon sd-info-icon--phone"><FiPhone size={18} /></div>
              <div className="sd-info-content">
                <span className="sd-info-label">Parent Phone</span>
                <span className="sd-info-value">{student.phone || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="sd-stats">
          {rankData && (
            <div className="sd-stat-card sd-stat-rank">
              <div className={`sd-rank-badge ${rankClass}`} aria-hidden="true">
                {rankData.rank === 1 ? <FaCrown size={24} /> : rankData.rank <= 3 ? <FaMedal size={20} /> : rankData.rank}
              </div>
              <div>
                <strong>Rank #{rankData.rank}</strong>
                <span>Overall Score: {rankData.overallTotal?.toFixed(2)}</span>
              </div>
            </div>
          )}
          <div className="sd-stat-card">
            <div className="sd-stat-icon sd-icon-courses"><FiBook size={20} /></div>
            <div>
              <strong>{Object.keys(scoresByCourse).length}</strong>
              <span>Courses Graded</span>
            </div>
          </div>
          <div className="sd-stat-card">
            <div className="sd-stat-icon sd-icon-avg"><FiTrendingUp size={20} /></div>
            <div>
              <strong>{averageScore}%</strong>
              <span>Average Performance</span>
            </div>
          </div>
        </div>

        {/* Marks Summary */}
        <div className="sd-section">
          <h2 className="sd-section-title">Marks Summary</h2>
          {Object.keys(scoresByCourse).length === 0 ? (
            <div className="sd-state">
              <FiInbox size={40} />
              <h3>No Marks Recorded</h3>
              <p>This student doesn't have any graded components yet.</p>
            </div>
          ) : (
            <div className="sd-marks-grid">
              {Object.entries(scoresByCourse).map(([courseId, courseData]) => (
                <div key={courseId} className="sd-course-card">
                  <h3 className="sd-course-name">{courseData.courseName}</h3>
                  <div className="sd-table-wrapper">
                    <table className="sd-table">
                      <thead>
                        <tr>
                          <th>Component</th>
                          <th>Score</th>
                          <th>Max</th>
                          <th className="sd-th-right">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseData.components.map((sc) => {
                          const pct = ((sc.scoreObtained / sc.maxScore) * 100).toFixed(1);
                          return (
                            <tr key={sc._id}>
                              <td data-label="Component"><strong>{sc.componentName}</strong></td>
                              <td data-label="Score">{sc.scoreObtained}</td>
                              <td data-label="Max">{sc.maxScore}</td>
                              <td data-label="Percentage" className="sd-td-right">
                                <span className={`sd-pct-badge ${pct >= 80 ? 'sd-pct-high' : pct >= 50 ? 'sd-pct-mid' : 'sd-pct-low'}`}>
                                  {pct}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <EditStudentModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} onSubmit={handleUpdateStudent} initialData={student} classes={classes} isSaving={isSaving} />
      <ConfirmModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleDeleteStudent} title="Delete Student" message="Are you sure you want to delete this student? This action cannot be undone and will remove all their associated records." isConfirming={isDeleting} />
    </section>
  );
};

export default StudentDetail;