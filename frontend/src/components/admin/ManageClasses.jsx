import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiArrowRight,
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
import './ManageClasses.css';

/* --------------------------------------------------------------------------
   Data hook: Fetch Classes with AbortController
   -------------------------------------------------------------------------- */
const useClasses = () => {
  const [classes, setClasses] = useState([]);
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
      const res = await api.get('/api/v1/classes', { signal: controller.signal });
      setClasses(Array.isArray(res.data?.data) ? res.data.data : []);
      setStatus('success');
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
      console.error('Failed to load classes:', err);
      setError('Unable to load classes. Please try again.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    reload();
    return () => abortRef.current?.abort();
  }, [reload]);

  return { classes, status, error, reload };
};

/* --------------------------------------------------------------------------
   Modal Component
   -------------------------------------------------------------------------- */
const ClassModal = ({ isOpen, onClose, onSubmit, initialData, isSaving }) => {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const inputRef = useRef(null);
  const isEditing = Boolean(initialData);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name || '',
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
    <div className="mc-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="mc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mc-modal-header">
          <h2>{isEditing ? 'Edit Class' : 'Add New Class'}</h2>
          <button className="mc-modal-close" onClick={onClose} aria-label="Close modal">
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mc-form">
          <div className="mc-form-group">
            <label htmlFor="mc-name" className="mc-label">
              Class Name <span className="mc-required">*</span>
            </label>
            <input
              id="mc-name"
              ref={inputRef}
              type="text"
              className="mc-input"
              placeholder="e.g., Grade 1, ሃ1"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="mc-form-group">
            <label htmlFor="mc-description" className="mc-label">Description</label>
            <textarea
              id="mc-description"
              className="mc-textarea"
              placeholder="Brief description (optional)"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="mc-form-actions">
            <button type="button" className="mc-btn mc-btn--ghost" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="mc-btn mc-btn--primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : (isEditing ? 'Update Class' : 'Create Class')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   Mobile Action Sheet — Edit / Delete for a single class.
   Only ever opened via the mobile-only kebab button, so it has no effect
   on the desktop layout or interactions.
   -------------------------------------------------------------------------- */
const ClassActionSheet = ({ cls, onClose, onEdit, onDelete }) => {
  useEffect(() => {
    if (!cls) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [cls, onClose]);

  if (!cls) return null;

  return (
    <div className="mc-sheet-backdrop" onClick={onClose} role="presentation">
      <div className="mc-sheet" onClick={(e) => e.stopPropagation()} role="menu" aria-label={`Actions for ${cls.name}`}>
        <div className="mc-sheet-handle" aria-hidden="true" />
        <div className="mc-sheet-title">{cls.name}</div>
        <button className="mc-sheet-action" role="menuitem" onClick={() => onEdit(cls)}>
          <FiEdit2 size={18} /> Edit class
        </button>
        <button className="mc-sheet-action mc-sheet-action--danger" role="menuitem" onClick={() => onDelete(cls)}>
          <FiTrash2 size={18} /> Delete class
        </button>
        <button className="mc-sheet-action mc-sheet-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   Main Component
   -------------------------------------------------------------------------- */
const ManageClasses = () => {
  const navigate = useNavigate();
  const { classes, status, error, reload } = useClasses();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [sheetClass, setSheetClass] = useState(null);

  const isLoading = status === 'loading';
  const hasClasses = classes.length > 0;

  // Only ever non-empty on mobile, where the search input is reachable —
  // on desktop the input is hidden and searchQuery stays '', so this is
  // always equal to `classes` there.
  const filteredClasses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter(
      (cls) =>
        cls.name?.toLowerCase().includes(q) ||
        cls.description?.toLowerCase().includes(q)
    );
  }, [classes, searchQuery]);

  const hasSearchResults = filteredClasses.length > 0;

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

  const openNewModal = () => {
    setEditingClass(null);
    setModalOpen(true);
  };

  const openEditModal = (cls, e) => {
    if (e) e.stopPropagation();
    setEditingClass(cls);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingClass(null);
  };

  const handleSave = async (formData) => {
    setIsSaving(true);
    try {
      if (editingClass) {
        await api.put(`/api/v1/classes/${editingClass._id}`, formData);
        showToast('success', 'Class updated successfully.');
      } else {
        await api.post('/api/v1/classes', formData);
        showToast('success', 'Class created successfully.');
      }
      closeModal();
      reload();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Error saving class.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, name, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete(`/api/v1/classes/${id}`);
      showToast('success', `"${name}" deleted successfully.`);
      reload();
    } catch (err) {
      showToast('error', 'Failed to delete class.');
    }
  };

  const handleCardClick = (classId) => {
    navigate(`/admin/classes/${classId}`);
  };

  const openActionSheet = (cls, e) => {
    if (e) e.stopPropagation();
    setSheetClass(cls);
  };

  const closeActionSheet = () => setSheetClass(null);

  const handleSheetEdit = (cls) => {
    closeActionSheet();
    openEditModal(cls);
  };

  const handleSheetDelete = (cls) => {
    closeActionSheet();
    handleDelete(cls._id, cls.name);
  };

  return (
    <section className="mc-page">
      <div className="mc-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="mc-wash" aria-hidden="true" />

      {toast.message && (
        <div className={`mc-toast mc-toast--${toast.type}`} role="alert">
          {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button className="mc-toast-close" onClick={() => setToast({ type: '', message: '' })} aria-label="Close">
            <FiX size={16} />
          </button>
        </div>
      )}

      <main className="mc-content">
        <header className="mc-header">
          <div>
            <h1 className="mc-title">Manage Classes</h1>
            <p className="mc-subtitle">Organise your church school classes (ክፍሎች)</p>
          </div>
          {/* Hidden on mobile (replaced by the floating action button below);
              unchanged on desktop. */}
          <button className="mc-btn mc-btn--primary mc-header-add-btn" onClick={openNewModal}>
            <FiPlus size={18} /> Add Class
          </button>
        </header>

        {/* Mobile-only quick filter. Hidden entirely on desktop via CSS, and
            only rendered here once there's something worth searching. */}
        {hasClasses && (
          <div className="mc-mobile-search">
            <FiSearch size={16} className="mc-mobile-search-icon" aria-hidden="true" />
            <input
              type="text"
              className="mc-mobile-search-input"
              placeholder="Search classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search classes"
            />
            {searchQuery && (
              <button
                className="mc-mobile-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <FiX size={13} />
              </button>
            )}
          </div>
        )}
        {hasClasses && searchQuery && (
          <p className="mc-mobile-result-count">
            {filteredClasses.length} of {classes.length} classes match &ldquo;{searchQuery}&rdquo;
          </p>
        )}

        {isLoading && !hasClasses ? (
          <div className="mc-grid" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="mc-skeleton-card" aria-hidden="true">
                <div className="mc-sk-row">
                  <div className="mc-sk-icon" />
                  <div className="mc-sk-actions" />
                </div>
                <div className="mc-sk-title" />
                <div className="mc-sk-line" />
              </div>
            ))}
          </div>
        ) : status === 'error' && !hasClasses ? (
          <div className="mc-state mc-state--error" role="alert">
            <FiAlertTriangle size={32} />
            <h3>Failed to load classes</h3>
            <p>{error}</p>
            <button className="mc-btn mc-btn--primary" onClick={reload}>
              <FiRefreshCw size={16} /> Try Again
            </button>
          </div>
        ) : !hasClasses ? (
          <div className="mc-state">
            <FiInbox size={40} />
            <h3>No classes yet</h3>
            <p>Get started by creating your first class.</p>
            <button className="mc-btn mc-btn--primary" onClick={openNewModal}>
              <FiPlus size={16} /> Add First Class
            </button>
          </div>
        ) : !hasSearchResults ? (
          <div className="mc-state">
            <FiSearch size={36} />
            <h3>No matches found</h3>
            <p>No classes match &ldquo;{searchQuery}&rdquo;. Try a different search term.</p>
            <button className="mc-btn mc-btn--ghost" onClick={() => setSearchQuery('')}>
              Clear search
            </button>
          </div>
        ) : (
          <>
            {status === 'error' && (
              <div className="mc-banner" role="alert">
                <FiAlertTriangle size={16} />
                Refresh failed — showing the last loaded data.
              </div>
            )}

            <div className="mc-grid">
              {filteredClasses.map((cls, i) => (
                <article
                  key={cls._id}
                  className={`mc-card mc-card--accent-${i % 4}`}
                  onClick={() => handleCardClick(cls._id)}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(cls._id); }}
                  role="button"
                  aria-label={`Open ${cls.name}`}
                >
                  {/* Top row: icon + actions */}
                  <div className="mc-card-top">
                    <div className="mc-card-icon" aria-hidden="true">
                      <FiBookOpen size={20} />
                    </div>
                    <div className="mc-card-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="mc-icon-btn mc-icon-btn--edit-full"
                        onClick={(e) => openEditModal(cls, e)}
                        aria-label={`Edit ${cls.name}`}
                        title="Edit"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        className="mc-icon-btn mc-icon-btn--danger mc-icon-btn--delete-full"
                        onClick={(e) => handleDelete(cls._id, cls.name, e)}
                        aria-label={`Delete ${cls.name}`}
                        title="Delete"
                      >
                        <FiTrash2 size={14} />
                      </button>
                      {/* Mobile-only: collapses edit/delete into one button
                          that opens the bottom action sheet. Hidden on
                          desktop. */}
                      <button
                        className="mc-icon-btn mc-kebab-btn"
                        onClick={(e) => openActionSheet(cls, e)}
                        aria-label={`More actions for ${cls.name}`}
                        title="More actions"
                      >
                        <FiMoreVertical size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <h2 className="mc-card-title">{cls.name}</h2>
                  <p className={`mc-card-desc ${!cls.description ? 'mc-card-desc--empty' : ''}`}>
                    {cls.description || 'No description added'}
                  </p>

                  {/* Footer */}
                  <div className="mc-card-footer">
                    <span className="mc-card-open">
                      Open class <FiArrowRight size={14} />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Floating action button — mobile only (hidden on desktop via CSS). */}
      <button className="mc-fab" onClick={openNewModal} aria-label="Add new class">
        <FiPlus size={24} />
      </button>

      <ClassModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleSave}
        initialData={editingClass}
        isSaving={isSaving}
      />

      <ClassActionSheet
        cls={sheetClass}
        onClose={closeActionSheet}
        onEdit={handleSheetEdit}
        onDelete={handleSheetDelete}
      />
    </section>
  );
};

export default ManageClasses;