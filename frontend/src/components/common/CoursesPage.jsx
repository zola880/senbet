import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrash2, FiEdit, FiPlus, FiSettings } from 'react-icons/fi';
import AuthContext from '../../context/AuthContext';
import api from '../../services/api';
import EmptyState from '../common/EmptyState';

const BACKGROUND_IMAGE = 'https://media.gettyimages.com/id/1225376317/photo/orthodox-priest-holding-the-hand-cross-abuna-yemata-guh-church-tigray-region-ethiopia.jpg?s=612x612&w=0&k=20&c=7Xw2Q6HAldczpV5JAYU_TY2ZebpNKhsE2SFtH3KYzqo=';

const CoursesPage = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });

  const fetchCourses = async () => {
    try {
      const res = await api.get('/api/v1/courses');
      setCourses(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const openNewForm = () => {
    if (!isAdmin) return;
    setEditCourse(null);
    setFormData({ name: '', code: '', description: '' });
    setShowForm(true);
  };

  const openEditForm = (course) => {
    if (!isAdmin) return;
    setEditCourse(course);
    setFormData({
      name: course.name || '',
      code: course.code || '',
      description: course.description || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editCourse) {
        await api.put(`/api/v1/courses/${editCourse._id}`, formData);
      } else {
        await api.post('/api/v1/courses', formData);
      }
      setShowForm(false);
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving course');
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (window.confirm('Delete this course?')) {
      await api.delete(`/api/v1/courses/${id}`);
      fetchCourses();
    }
  };

  const handleCourseClick = (courseId) => {
    if (isAdmin) {
      navigate(`/admin/courses/${courseId}`);
    } else if (isTeacher) {
      navigate(`/teacher/courses/${courseId}`);
    }
  };

  return (
    <div>
      <h2 className="page-title">{isTeacher ? 'My Courses' : 'Courses'}</h2>

      {isAdmin && (
        <button className="btn btn-primary" onClick={openNewForm}>
          <FiPlus /> Add Course
        </button>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editCourse ? 'Edit Course' : 'New Course'}</h3>
            <form onSubmit={handleSubmit} className="form-grid">
              <input
                name="name"
                placeholder="Course Name (e.g., Zema)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <input
                name="code"
                placeholder="Code (optional)"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
              <input
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  {editCourse ? 'Update' : 'Create'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* If teacher and no courses selected yet, show background image */}
      {isTeacher && courses.length === 0 ? (
        <div
          className="selection-placeholder"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url('${BACKGROUND_IMAGE}')`,
          }}
        >
          <p>You have no assigned courses yet. Please contact the admin.</p>
        </div>
      ) : (
        /* Course grid as cards for both admin and teacher */
        <div className="materials-grid" style={{ marginTop: '1rem' }}>
          {courses.map((c) => (
            <div
              key={c._id}
              className="material-item course-card"
              style={{ cursor: 'pointer' }}
              onClick={() => handleCourseClick(c._id)}
            >
              <div className="material-file" style={{ height: '120px' }}>
                <FiSettings size={32} />
              </div>
              <div className="material-info">
                <h4>{c.name}</h4>
                <p>{c.code || 'Tap to manage'}</p>
                {isAdmin && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.3rem' }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={(e) => { e.stopPropagation(); openEditForm(c); }}
                    >
                      <FiEdit />
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={(e) => { e.stopPropagation(); handleDelete(c._id); }}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoursesPage;