import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiArrowLeft, FiUser, FiBook, FiAward, FiMail, FiHash, FiEdit, FiTrash2 } from 'react-icons/fi';
import EmptyState from '../common/EmptyState';

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [scores, setScores] = useState([]);
  const [rankData, setRankData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Guard: only fetch if id is a valid non‑empty string
  const isValidId = id && id !== 'undefined';

  useEffect(() => {
    if (!isValidId) {
      setError('Invalid student ID.');
      setLoading(false);
      return;
    }

    const fetchStudentData = async () => {
      try {
        const [studentRes, scoresRes, rankRes] = await Promise.all([
          api.get(`/api/v1/users/${id}`),
          api.get(`/api/v1/scores?student=${id}`),
          api.get(`/api/v1/rankings/student/${id}`).catch(() => null),
        ]);

        setStudent(studentRes.data.data);
        setScores(scoresRes.data.data);
        if (rankRes && rankRes.data) {
          setRankData(rankRes.data.data);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load student details.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [id, isValidId]);

  // Group scores by course
  const scoresByCourse = scores.reduce((acc, score) => {
    const courseId = score.course?._id || 'unknown';
    if (!acc[courseId]) {
      acc[courseId] = {
        courseName: score.course?.name || 'Unknown Course',
        components: [],
      };
    }
    acc[courseId].components.push(score);
    return acc;
  }, {});

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    password: '',
    class: '',
    rollNumber: '',
  });

  const openEditModal = () => {
    if (!student) return;
    setEditForm({
      fullName: student.fullName || '',
      email: student.email || '',
      password: '',
      class: student.class?._id || '',
      rollNumber: student.rollNumber || '',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...editForm };
    if (!payload.password) delete payload.password;
    try {
      await api.put(`/api/v1/users/${id}`, payload);
      setShowEditModal(false);
      const res = await api.get(`/api/v1/users/${id}`);
      setStudent(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating student');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      await api.delete(`/api/v1/users/${id}`);
      navigate('/admin/users');
    }
  };

  if (loading) return <div className="spinner" />;
  if (error || !isValidId) return <div className="error-message">{error || 'Invalid student ID.'}</div>;
  if (!student) return <div className="error-message">Student not found.</div>;

  return (
    <div>
      <button
        className="btn btn-secondary"
        onClick={() => navigate('/admin/users')}
        style={{ marginBottom: '1rem' }}
      >
        <FiArrowLeft /> Back to Users
      </button>

      {/* Student Header Card with edit/delete buttons at right bottom */}
      <div className="student-header-card" style={{ position: 'relative' }}>
        <div className="student-avatar">
          <FiUser size={48} />
        </div>
        <div className="student-header-info">
          <h2>{student.fullName}</h2>
          <p className="student-class">
            {student.class?.name || 'No class assigned'}
            {student.rollNumber && ` · Roll No: ${student.rollNumber}`}
          </p>
          <p className="student-email">
            <FiMail style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
            {student.email}
          </p>
        </div>
        <div style={{ position: 'absolute', bottom: '1rem', right: '1.5rem', display: 'flex', gap: '0.8rem' }}>
          <button className="btn btn-sm btn-secondary" onClick={openEditModal} style={{ background: 'white', color: 'var(--primary)', border: 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
            <FiEdit /> Edit
          </button>
          <button className="btn btn-sm btn-danger" onClick={handleDelete}>
            <FiTrash2 /> Delete
          </button>
        </div>
      </div>

      {/* Rank Card (if available) */}
      {rankData && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3><FiAward /> Current Rank</h3>
          <div className="rank-display">
            <span className={`rank-badge ${rankData.rank <= 3 ? `rank-${rankData.rank}` : ''}`}>
              {rankData.rank}
            </span>
            <span className="rank-total">
              Total Score: {rankData.overallTotal?.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Marks Summary */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3><FiBook /> Marks Summary</h3>
        {Object.keys(scoresByCourse).length === 0 ? (
          <EmptyState message="No marks recorded yet." />
        ) : (
          <div className="marks-summary-grid">
            {Object.entries(scoresByCourse).map(([courseId, courseData]) => (
              <div key={courseId} className="marks-course-card">
                <h4>{courseData.courseName}</h4>
                <table className="mini-table">
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Score</th>
                      <th>Max</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseData.components.map((sc) => (
                      <tr key={sc._id}>
                        <td>{sc.componentName}</td>
                        <td>{sc.scoreObtained}</td>
                        <td>{sc.maxScore}</td>
                        <td>{((sc.scoreObtained / sc.maxScore) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Student Modal */}
      {showEditModal && (
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Edit Student</h3>
            <form onSubmit={handleEditSubmit} className="form-grid">
              <input
                name="fullName"
                placeholder="Full Name"
                value={editForm.fullName}
                onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                required
              />
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={editForm.email}
                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
              <input
                name="password"
                type="password"
                placeholder="New password (leave blank to keep)"
                value={editForm.password}
                onChange={e => setEditForm({ ...editForm, password: e.target.value })}
              />
              <select
                name="class"
                value={editForm.class}
                onChange={e => setEditForm({ ...editForm, class: e.target.value })}
              >
                <option value="">Select Class</option>
                <ClassesDropdown value={editForm.class} onChange={(val) => setEditForm({ ...editForm, class: val })} />
              </select>
              <input
                name="rollNumber"
                placeholder="Roll Number"
                value={editForm.rollNumber}
                onChange={e => setEditForm({ ...editForm, rollNumber: e.target.value })}
              />
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary">Update</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component to fetch classes for the edit dropdown
const ClassesDropdown = ({ value, onChange }) => {
  const [classes, setClasses] = useState([]);
  useEffect(() => {
    api.get('/api/v1/classes').then(res => setClasses(res.data.data)).catch(console.error);
  }, []);
  return (
    <select value={value} onChange={e => onChange(e.target.value)}>
      <option value="">Select Class</option>
      {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
    </select>
  );
};

export default StudentDetail;