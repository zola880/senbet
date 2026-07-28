import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrash2, FiEdit, FiPlus, FiSettings } from 'react-icons/fi';
import AuthContext from '../../context/AuthContext';
import api from '../../services/api';
import EmptyState from '../common/EmptyState';

const CoursesPage = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';
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

  const handleManage = (courseId) => {
    navigate(`/admin/courses/${courseId}`);
  };

  return (
    <div>
      <h2 className="page-title">Courses {!isAdmin && '(My Courses)'}</h2>

      <button className="btn btn-primary" onClick={openNewForm}>
        <FiPlus /> Add Course
      </button>

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

      <div className="table-container" style={{ marginTop: '1rem' }}>
        {courses.length === 0 ? (
          <EmptyState message="No courses found." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Description</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td>{c.code || '—'}</td>
                  <td>{c.description || '—'}</td>
                  {isAdmin && (
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleManage(c._id)}
                        title="Manage course materials and details"
                      >
                        <FiSettings /> Manage
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => openEditForm(c)}
                        style={{ marginLeft: '0.5rem' }}
                      >
                        <FiEdit />
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(c._id)}
                        style={{ marginLeft: '0.5rem' }}
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CoursesPage;