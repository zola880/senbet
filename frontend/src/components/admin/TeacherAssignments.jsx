import { useState, useEffect } from 'react';
import api from '../../services/api';
import EmptyState from '../common/EmptyState';
import { FiTrash2, FiEdit, FiPlus, FiX } from 'react-icons/fi';
import './TeacherAssignments.css';

const TeacherAssignments = () => {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // Form state
  const [teacherId, setTeacherId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [classId, setClassId] = useState('');
  const [editingId, setEditingId] = useState(null); // tracks assignment being edited

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teachersRes, classesRes, coursesRes, assignmentsRes] = await Promise.all([
        api.get('/api/v1/users?role=teacher'),
        api.get('/api/v1/classes'),
        api.get('/api/v1/courses'),
        api.get('/api/v1/assignments'),
      ]);
      setTeachers(teachersRes.data.data);
      setClasses(classesRes.data.data);
      setCourses(coursesRes.data.data);
      setAssignments(assignmentsRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setTeacherId('');
    setCourseId('');
    setClassId('');
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teacherId || !courseId || !classId) {
      alert('Please fill all fields');
      return;
    }

    const payload = {
      teacher: teacherId,
      course: courseId,
      class: classId,
    };

    try {
      if (editingId) {
        // Update existing assignment
        await api.put(`/api/v1/assignments/${editingId}`, payload);
      } else {
        // Create new assignment
        await api.post('/api/v1/assignments', payload);
      }
      resetForm();
      fetchData(); // refresh list
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving assignment');
    }
  };

  const handleEdit = (assignment) => {
    setEditingId(assignment._id);
    setTeacherId(assignment.teacher?._id || '');
    setCourseId(assignment.course?._id || '');
    setClassId(assignment.class?._id || '');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this assignment? The teacher will no longer teach this course/class.')) {
      try {
        await api.delete(`/api/v1/assignments/${id}`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting assignment');
      }
    }
  };

  return (
    <div>
      <h2 className="page-title">Teacher Assignments</h2>

      {/* Add/Edit Form */}
      <form onSubmit={handleSubmit} className="card form-grid">
        <h3 style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
          {editingId ? 'Edit Assignment' : 'New Assignment'}
        </h3>
        <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required>
          <option value="">Select Teacher</option>
          {teachers.map((t) => (
            <option key={t._id} value={t._id}>{t.fullName}</option>
          ))}
        </select>
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
          <option value="">Select Course</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <select value={classId} onChange={(e) => setClassId(e.target.value)} required>
          <option value="">Select Class</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" className="btn btn-primary">
            {editingId ? 'Update' : 'Assign'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              <FiX /> Cancel
            </button>
          )}
        </div>
      </form>

      {/* Assignments List */}
      <div className="table-container" style={{ marginTop: '1.5rem' }}>
        {assignments.length === 0 ? (
          <EmptyState message="No assignments yet. Use the form above to assign a teacher to a course and class." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Course</th>
                <th>Class</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a._id}>
                  <td>{a.teacher?.fullName || '—'}</td>
                  <td>{a.course?.name || '—'}</td>
                  <td>{a.class?.name || '—'}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEdit(a)}
                      title="Edit assignment"
                    >
                      <FiEdit />
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(a._id)}
                      title="Delete assignment"
                      style={{ marginLeft: '0.5rem' }}
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TeacherAssignments;