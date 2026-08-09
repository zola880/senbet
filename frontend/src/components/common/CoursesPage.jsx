import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiBook,
  FiEdit2,
  FiInbox,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiX,
} from 'react-icons/fi';

import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import bgImage from '../../assets/L.png';
import './CoursesPage.css';

/* --------------------------------------------------------------------------
   Data hook: fetch + cancel + retry
   -------------------------------------------------------------------------- */
const useCourses = () => {
  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const reload = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setError(null);

    try {
      const res = await api.get('/api/v1/courses', { signal: controller.signal });
      setCourses(Array.isArray(res.data?.data) ? res.data.data : []);
      setStatus('success');
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
      console.error('Failed to load courses:', err);
      setError('Unable to load courses. Please try again.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    reload();
    return () => abortRef.current?.abort();
  }, [reload]);

  return { courses, status, error, reload };
};

/* --------------------------------------------------------------------------
   Modal Component
   -------------------------------------------------------------------------- */
const CourseModal = ({ isOpen, onClose, onSubmit, initialData, isSaving }) => {
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const inputRef = useRef(null);
  const isEditing = Boolean(initialData);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name || '',
        code: initialData?.code || '',
        description: initialData?.description || '',
      });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="cp-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cp-modal-header">
          <h2>{isEditing ? 'Edit Course' : 'Add New Course'}</h2>
          <button className="cp-modal-close" onClick={onClose} aria-label="Close modal">
            <FiX size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="cp-form">
          <div className="cp-form-group">
            <label htmlFor="cp-name" className="cp-label">
              Course Name <span className="cp-required">*</span>
            </label>
            <input
              id="cp-name"
              ref={inputRef}
              type="text"
              className="cp-input"
              placeholder="e.g., Zema, Mathematics"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div className="cp-form-group">
            <label htmlFor="cp-code" className="cp-label">Course Code</label>
            <input
              id="cp-code"
              type="text"
              className="cp-input"
              placeholder="e.g., MATH101"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
          </div>

          <div className="cp-form-group">
            <label htmlFor="cp-desc" className="cp-label">Description</label>
            <textarea
              id="cp-desc"
              className="cp-textarea"
              placeholder="Brief description of the course..."
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="cp-form-actions">
            <button type="button" className="cp-btn cp-btn--ghost" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="cp-btn cp-btn--primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : (isEditing ? 'Update Course' : 'Create Course')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   Main Page Component
   -------------------------------------------------------------------------- */
const CoursesPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  
  const { courses, status, error, reload } = useCourses();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const isLoading = status === 'loading';
  const hasCourses = courses.length > 0;

  const openNewModal = () => {
    setEditingCourse(null);
    setModalOpen(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCourse(null);
  };

  const handleSave = async (formData) => {
    setIsSaving(true);
    try {
      if (editingCourse) {
        await api.put(`/api/v1/courses/${editingCourse._id}`, formData);
      } else {
        await api.post('/api/v1/courses', formData);
      }
      closeModal();
      reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving course');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (courseId, courseName) => {
    if (!window.confirm(`Are you sure you want to delete "${courseName}"?`)) return;
    try {
      await api.delete(`/api/v1/courses/${courseId}`);
      reload();
    } catch (err) {
      alert('Failed to delete course.');
    }
  };

  const handleCardClick = (courseId) => {
    if (isAdmin) navigate(`/admin/courses/${courseId}`);
    else if (isTeacher) navigate(`/teacher/courses/${courseId}`);
  };

  return (
    <section className="cp-page">
      <div className="cp-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="cp-overlay" aria-hidden="true" />

      <header className="cp-header">
        <div>
          <h1 className="cp-title">{isAdmin ? 'Manage Courses' : 'Course Catalog'}</h1>
          <p className="cp-subtitle">
            {isAdmin 
              ? 'Create, edit, and organize the courses offered at your institution.' 
              : 'Browse the available courses and manage your class materials.'}
          </p>
        </div>

        {isAdmin && (
          <button className="cp-btn cp-btn--primary" onClick={openNewModal}>
            <FiPlus size={18} /> Add New Course
          </button>
        )}
      </header>

      {isLoading && !hasCourses ? (
        <div className="cp-grid" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="cp-skeleton-card" aria-hidden="true">
              <div className="cp-sk-icon" />
              <div className="cp-sk-title" />
              <div className="cp-sk-line" />
              <div className="cp-sk-line short" />
            </div>
          ))}
        </div>
      ) : status === 'error' && !hasCourses ? (
        <div className="cp-state cp-state--error" role="alert">
          <FiAlertTriangle size={32} />
          <h3>Failed to load courses</h3>
          <p>{error}</p>
          <button className="cp-btn cp-btn--primary" onClick={reload}>
            <FiRefreshCw size={16} /> Try Again
          </button>
        </div>
      ) : !hasCourses ? (
        <div className="cp-state">
          <FiInbox size={40} />
          <h3>No courses available</h3>
          <p>
            {isAdmin 
              ? 'Get started by adding your first course.' 
              : 'There are no courses in the catalog yet.'}
          </p>
          {isAdmin && (
            <button className="cp-btn cp-btn--primary" onClick={openNewModal}>
              <FiPlus size={16} /> Add First Course
            </button>
          )}
        </div>
      ) : (
        <>
          {status === 'error' && (
            <div className="cp-banner" role="alert">
              <FiAlertTriangle size={16} />
              Refresh failed — showing the last loaded data.
            </div>
          )}

          <div className="cp-grid">
            {courses.map((course) => (
              <article 
                key={course._id} 
                className="cp-card"
                onClick={() => handleCardClick(course._id)}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(course._id); }}
                role="button"
                aria-label={`Open ${course.name}`}
              >
                <div className="cp-card-icon" aria-hidden="true">
                  <FiBook size={24} />
                </div>
                
                <div className="cp-card-content">
                  <h2 className="cp-card-title">{course.name}</h2>
                  {course.code && <span className="cp-card-code">{course.code}</span>}
                  {course.description && (
                    <p className="cp-card-desc">{course.description}</p>
                  )}
                </div>

                {isAdmin && (
                  <div className="cp-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="cp-icon-btn" 
                      onClick={() => openEditModal(course)}
                      aria-label={`Edit ${course.name}`}
                      title="Edit"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button 
                      className="cp-icon-btn cp-icon-btn--danger" 
                      onClick={() => handleDelete(course._id, course.name)}
                      aria-label={`Delete ${course.name}`}
                      title="Delete"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}

      <CourseModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleSave}
        initialData={editingCourse}
        isSaving={isSaving}
      />
    </section>
  );
};

export default CoursesPage;