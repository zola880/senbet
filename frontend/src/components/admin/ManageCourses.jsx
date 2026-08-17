import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiBookOpen,
  FiCheckCircle,
  FiEdit2,
  FiInbox,
  FiMoreVertical,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
} from 'react-icons/fi';

import api from '../../services/api';
import bgImage from '../../assets/L.png';
import './ManageCourses.css';

/* --------------------------------------------------------------------------
   Data hook: Fetch Courses with AbortController
   -------------------------------------------------------------------------- */
const useCourses = () => {
  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState('loading');
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
    <div className="mgc-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="mgc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mgc-modal-header">
          <h2>{isEditing ? 'Edit Course' : 'Add New Course'}</h2>
          <button className="mgc-modal-close" onClick={onClose} aria-label="Close modal">
            <FiX size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="mgc-form">
          <div className="mgc-form-group">
            <label htmlFor="mgc-name" className="mgc-label">
              Course Name <span className="mgc-required">*</span>
            </label>
            <input
              id="mgc-name"
              ref={inputRef}
              type="text"
              className="mgc-input"
              placeholder="e.g., Zema, Mathematics"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="mgc-form-group">
            <label htmlFor="mgc-code" className="mgc-label">Course Code</label>
            <input
              id="mgc-code"
              type="text"
              className="mgc-input"
              placeholder="e.g., MATH101"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
          </div>

          <div className="mgc-form-group">
            <label htmlFor="mgc-description" className="mgc-label">Description</label>
            <textarea
              id="mgc-description"
              className="mgc-textarea"
              placeholder="Brief description (optional)"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="mgc-form-actions">
            <button type="button" className="mgc-btn mgc-btn--ghost" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="mgc-btn mgc-btn--primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : (isEditing ? 'Update Course' : 'Create Course')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   Mobile Action Sheet — Edit / Delete for a single course.
   Only ever opened via the mobile-only kebab button, so it has no effect
   on the desktop layout or interactions.
   -------------------------------------------------------------------------- */
const CourseActionSheet = ({ course, onClose, onEdit, onDelete }) => {
  useEffect(() => {
    if (!course) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [course, onClose]);

  if (!course) return null;

  return (
    <div className="mgc-sheet-backdrop" onClick={onClose} role="presentation">
      <div className="mgc-sheet" onClick={(e) => e.stopPropagation()} role="menu" aria-label={`Actions for ${course.name}`}>
        <div className="mgc-sheet-handle" aria-hidden="true" />
        <div className="mgc-sheet-title">{course.name}</div>
        <button className="mgc-sheet-action" role="menuitem" onClick={() => onEdit(course)}>
          <FiEdit2 size={18} /> Edit course
        </button>
        <button className="mgc-sheet-action mgc-sheet-action--danger" role="menuitem" onClick={() => onDelete(course)}>
          <FiTrash2 size={18} /> Delete course
        </button>
        <button className="mgc-sheet-action mgc-sheet-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   Main Component
   -------------------------------------------------------------------------- */
const ManageCourses = () => {
  const navigate = useNavigate();
  const { courses, status, error, reload } = useCourses();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState({ type: '', message: '' });
  const [sheetCourse, setSheetCourse] = useState(null);

  const isLoading = status === 'loading';
  const hasCourses = courses.length > 0;

  const filteredCourses = courses.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.code?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

  const openNewModal = () => {
    setEditingCourse(null);
    setModalOpen(true);
  };

  const openEditModal = (course, e) => {
    if (e) e.stopPropagation();
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
        showToast('success', 'Course updated successfully.');
      } else {
        await api.post('/api/v1/courses', formData);
        showToast('success', 'Course created successfully.');
      }
      closeModal();
      reload();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Error saving course.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, name, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete(`/api/v1/courses/${id}`);
      showToast('success', `"${name}" deleted successfully.`);
      reload();
    } catch (err) {
      showToast('error', 'Failed to delete course.');
    }
  };

  const handleCardClick = (courseId) => {
    navigate(`/admin/courses/${courseId}`);
  };

  const openActionSheet = (course, e) => {
    if (e) e.stopPropagation();
    setSheetCourse(course);
  };

  const closeActionSheet = () => setSheetCourse(null);

  const handleSheetEdit = (course) => {
    closeActionSheet();
    openEditModal(course);
  };

  const handleSheetDelete = (course) => {
    closeActionSheet();
    handleDelete(course._id, course.name);
  };

  return (
    <section className="mgc-page">
      <div className="mgc-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="mgc-wash" aria-hidden="true" />

      {toast.message && (
        <div className={`mgc-toast mgc-toast--${toast.type}`} role="alert">
          {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button className="mgc-toast-close" onClick={() => setToast({ type: '', message: '' })} aria-label="Close">
            <FiX size={16} />
          </button>
        </div>
      )}

      <main className="mgc-content">
        <header className="mgc-header">
          <div>
            <h1 className="mgc-title">Manage Courses</h1>
            <p className="mgc-subtitle">
              Organise your church school courses
            </p>
          </div>
          {/* Hidden on mobile (replaced by the floating action button below);
              unchanged on desktop. */}
          <button className="mgc-btn mgc-btn--primary mgc-header-add-btn" onClick={openNewModal}>
            <FiPlus size={18} /> Add Course
          </button>
        </header>

        {hasCourses && (
          <div className="mgc-toolbar">
            <div className="mgc-search">
              <FiSearch className="mgc-search-icon" size={16} aria-hidden="true" />
              <input
                type="search"
                className="mgc-search-input"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search courses"
              />
            </div>
          </div>
        )}

        {isLoading && !hasCourses ? (
          <div className="mgc-grid" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="mgc-skeleton-card" aria-hidden="true">
                <div className="mgc-sk-icon" />
                <div className="mgc-sk-title" />
                <div className="mgc-sk-line" />
                <div className="mgc-sk-line short" />
              </div>
            ))}
          </div>
        ) : status === 'error' && !hasCourses ? (
          <div className="mgc-state mgc-state--error" role="alert">
            <FiAlertTriangle size={32} />
            <h3>Failed to load courses</h3>
            <p>{error}</p>
            <button className="mgc-btn mgc-btn--primary" onClick={reload}>
              <FiRefreshCw size={16} /> Try Again
            </button>
          </div>
        ) : !hasCourses ? (
          <div className="mgc-state">
            <FiInbox size={40} />
            <h3>No courses yet</h3>
            <p>Get started by creating your first course.</p>
            <button className="mgc-btn mgc-btn--primary" onClick={openNewModal}>
              <FiPlus size={16} /> Add First Course
            </button>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="mgc-state">
            <FiSearch size={40} />
            <h3>No matches found</h3>
            <p>No courses match "{searchQuery}".</p>
            <button className="mgc-btn mgc-btn--ghost" onClick={() => setSearchQuery('')}>
              Clear Search
            </button>
          </div>
        ) : (
          <>
            {status === 'error' && (
              <div className="mgc-banner" role="alert">
                <FiAlertTriangle size={16} />
                Refresh failed — showing the last loaded data.
              </div>
            )}

            <div className="mgc-grid">
              {filteredCourses.map((course, i) => (
                <article
                  key={course._id}
                  className={`mgc-card mgc-card--accent-${i % 4}`}
                  onClick={() => handleCardClick(course._id)}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(course._id); }}
                  role="button"
                  aria-label={`Open ${course.name}`}
                >
                  <div className="mgc-card-top">
                    <div className="mgc-card-icon" aria-hidden="true">
                      <FiBookOpen size={18} />
                    </div>
                    <div className="mgc-card-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="mgc-icon-btn mgc-icon-btn--edit-full"
                        onClick={(e) => openEditModal(course, e)}
                        aria-label={`Edit ${course.name}`}
                        title="Edit"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        className="mgc-icon-btn mgc-icon-btn--danger mgc-icon-btn--delete-full"
                        onClick={(e) => handleDelete(course._id, course.name, e)}
                        aria-label={`Delete ${course.name}`}
                        title="Delete"
                      >
                        <FiTrash2 size={14} />
                      </button>
                      {/* Mobile-only: collapses edit/delete into one button
                          that opens the bottom action sheet. Hidden on
                          desktop. */}
                      <button
                        className="mgc-icon-btn mgc-kebab-btn"
                        onClick={(e) => openActionSheet(course, e)}
                        aria-label={`More actions for ${course.name}`}
                        title="More actions"
                      >
                        <FiMoreVertical size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="mgc-card-content">
                    <h2 className="mgc-card-title">{course.name}</h2>
                    {course.code && <span className="mgc-card-code">{course.code}</span>}
                    {course.description && (
                      <p className="mgc-card-desc">{course.description}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Floating action button — mobile only (hidden on desktop via CSS). */}
      <button className="mgc-fab" onClick={openNewModal} aria-label="Add new course">
        <FiPlus size={24} />
      </button>

      <CourseModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleSave}
        initialData={editingCourse}
        isSaving={isSaving}
      />

      <CourseActionSheet
        course={sheetCourse}
        onClose={closeActionSheet}
        onEdit={handleSheetEdit}
        onDelete={handleSheetDelete}
      />
    </section>
  );
};

export default ManageCourses;