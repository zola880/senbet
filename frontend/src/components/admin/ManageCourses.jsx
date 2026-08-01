import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiPlus, FiBookOpen } from 'react-icons/fi';
import EmptyState from '../common/EmptyState';

const ManageCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const fetchCourses = () => {
    api.get('/api/v1/courses')
      .then(res => setCourses(res.data.data))
      .catch(console.error);
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    await api.post('/api/v1/courses', { name, code });
    setName('');
    setCode('');
    setShowForm(false);
    fetchCourses();
  };

  return (
    <div>
      {/* Header – identical style to ManageClasses */}
      <div className="class-header">
        <div>
          <h2 className="page-title" style={{ marginBottom: '0.3rem' }}>Manage Courses</h2>
          <p className="class-header-subtitle">Organise your church school courses</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <FiPlus /> Add Course
        </button>
      </div>

      {/* Add course modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>New Course</h3>
            <form onSubmit={handleAdd} className="form-grid">
              <input
                placeholder="Course Name (e.g., Zema)"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
              <input
                placeholder="Code (optional)"
                value={code}
                onChange={e => setCode(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Create</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* Course cards grid – uses the same .class-card-grid and .class-card classes */}
      {courses.length === 0 ? (
        <EmptyState message="No courses yet. Click “Add Course” to create the first one." />
      ) : (
        <div className="class-card-grid">
          {courses.map(c => (
            <div
              key={c._id}
              className="class-card"
              onClick={() => navigate(`/admin/courses/${c._id}`)}
            >
              <div className="class-card-icon">
                <FiBookOpen size={24} />
              </div>
              <h3 className="class-card-name">{c.name}</h3>
              {c.code && <span className="class-card-code">{c.code}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageCourses;