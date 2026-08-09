import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiEdit2, FiTrash2, FiClipboard, FiBookOpen, FiX,
  FiPlus, FiAlertTriangle, FiRefreshCw, FiCheckCircle, FiChevronDown
} from 'react-icons/fi';

import api from '../../services/api';
import bgImage from '../../assets/L.png';
import './ClassDetail.css';

/* --------------------------------------------------------------------------
   Data Hook: Fetch Class & Config
   -------------------------------------------------------------------------- */
const useClassDetail = (id) => {
  const [classData, setClassData] = useState(null);
  const [config, setConfig] = useState(null);
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
      const [classRes, configRes] = await Promise.all([
        api.get(`/api/v1/classes/${id}`, { signal }),
        api.get(`/api/v1/assessment-configs/${id}`, { signal }).catch(err => {
          if (err.response?.status === 404) return { data: { data: null } };
          throw err;
        })
      ]);

      setClassData(classRes.data?.data || null);
      setConfig(configRes.data?.data || null);
      setStatus('success');
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
      console.error('Failed to load class details:', err);
      setError('Unable to load class details.');
      setStatus('error');
    }
  }, [id]);

  useEffect(() => {
    reload();
    return () => abortRef.current?.abort();
  }, [reload]);

  return { classData, config, status, error, reload, setClassData, setConfig };
};

/* --------------------------------------------------------------------------
   Modals
   -------------------------------------------------------------------------- */
const BaseModal = ({ isOpen, onClose, children, title }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="cld-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="cld-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cld-modal-header">
          <h2>{title}</h2>
          <button className="cld-modal-close" onClick={onClose} aria-label="Close modal"><FiX size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

const EditClassModal = ({ isOpen, onClose, onSubmit, initialData, isSaving }) => {
  const [form, setForm] = useState({ name: '', description: '' });
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && initialData) {
      setForm({ name: initialData.name || '', description: initialData.description || '' });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Edit Class">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="cld-form">
        <div className="cld-form-group">
          <label className="cld-label">Class Name <span className="cld-required">*</span></label>
          <input ref={inputRef} className="cld-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="cld-form-group">
          <label className="cld-label">Description</label>
          <textarea className="cld-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
        </div>
        <div className="cld-form-actions">
          <button type="button" className="cld-btn cld-btn--ghost" onClick={onClose} disabled={isSaving}>Cancel</button>
          <button type="submit" className="cld-btn cld-btn--primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

const AssessmentConfigModal = ({ isOpen, onClose, onSave, initialConfig, classId, isSaving }) => {
  const [components, setComponents] = useState([{ name: '', type: 'exam', weightage: 0 }]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialConfig?.components?.length > 0) {
        setComponents(initialConfig.components.map(c => ({ ...c, weightage: Number(c.weightage) })));
      } else {
        setComponents([{ name: '', type: 'exam', weightage: 0 }]);
      }
      setError('');
    }
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const addComponent = () => setComponents([...components, { name: '', type: 'exam', weightage: 0 }]);
  const removeComponent = (idx) => setComponents(components.filter((_, i) => i !== idx));
  const updateComponent = (idx, field, value) => {
    const updated = [...components];
    updated[idx][field] = field === 'weightage' ? Number(value) : value;
    setComponents(updated);
  };

  const total = components.reduce((sum, c) => sum + (Number(c.weightage) || 0), 0);
  const isValid = total === 100 && components.every(c => c.name.trim() !== '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) {
      setError(total !== 100 ? `Total weightage must be exactly 100%. Currently: ${total}%.` : 'All components must have a name.');
      return;
    }
    onSave({
      class: classId,
      academicYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
      components: components.map(c => ({ ...c, weightage: Number(c.weightage) })),
    });
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Assessment Configuration">
      <form onSubmit={handleSubmit} className="cld-form">
        <div className="cld-config-list">
          {components.map((comp, idx) => (
            <div key={idx} className="cld-config-row">
              <div className="cld-config-field">
                <label className="cld-label">Component Name</label>
                <input className="cld-input" placeholder="e.g., Midterm" value={comp.name} onChange={e => updateComponent(idx, 'name', e.target.value)} />
              </div>
              <div className="cld-config-field">
                <label className="cld-label">Type</label>
                <div className="cld-select-wrapper">
                  <select className="cld-select" value={comp.type} onChange={e => updateComponent(idx, 'type', e.target.value)}>
                    <option value="exam">Exam</option>
                    <option value="activity">Activity</option>
                    <option value="attendance">Attendance</option>
                    <option value="custom">Custom</option>
                  </select>
                  <FiChevronDown className="cld-select-icon" />
                </div>
              </div>
              <div className="cld-config-field cld-config-field--sm">
                <label className="cld-label">Weight (%)</label>
                <input type="number" className="cld-input" placeholder="0" value={comp.weightage} onChange={e => updateComponent(idx, 'weightage', e.target.value)} />
              </div>
              <button type="button" className="cld-config-remove" onClick={() => removeComponent(idx)} aria-label="Remove component" disabled={components.length === 1}>
                <FiTrash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <button type="button" className="cld-btn cld-btn--ghost cld-btn--full" onClick={addComponent}>
          <FiPlus size={16} /> Add Component
        </button>

        {error && <div className="cld-form-error"><FiAlertTriangle size={16} /> {error}</div>}

        <div className="cld-config-footer">
          <span className={total === 100 ? 'cld-weight-valid' : 'cld-weight-invalid'}>
            Total Weight: {total}% {total !== 100 && '(Must be 100%)'}
          </span>
          <div className="cld-form-actions">
            <button type="button" className="cld-btn cld-btn--ghost" onClick={onClose} disabled={isSaving}>Cancel</button>
            <button type="submit" className="cld-btn cld-btn--primary" disabled={isSaving || !isValid}>
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </form>
    </BaseModal>
  );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, isConfirming }) => {
  if (!isOpen) return null;
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="cld-confirm-body">
        <p>{message}</p>
        <div className="cld-form-actions">
          <button className="cld-btn cld-btn--ghost" onClick={onClose} disabled={isConfirming}>Cancel</button>
          <button className="cld-btn cld-btn--danger" onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

/* --------------------------------------------------------------------------
   Main Component
   -------------------------------------------------------------------------- */
const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { classData, config, status, error, reload, setClassData, setConfig } = useClassDetail(id);
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const [isSavingClass, setIsSavingClass] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [toast, setToast] = useState({ type: '', message: '' });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

  const handleUpdateClass = async (formData) => {
    setIsSavingClass(true);
    try {
      const res = await api.put(`/api/v1/classes/${id}`, formData);
      setClassData(res.data?.data || formData);
      setEditModalOpen(false);
      showToast('success', 'Class updated successfully.');
    } catch (err) {
      showToast('error', 'Failed to update class.');
    } finally {
      setIsSavingClass(false);
    }
  };

  const handleDeleteClass = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/api/v1/classes/${id}`);
      showToast('success', 'Class deleted.');
      setTimeout(() => navigate('/admin/classes'), 500);
    } catch (err) {
      showToast('error', 'Failed to delete class.');
      setDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveConfig = async (payload) => {
    setIsSavingConfig(true);
    try {
      const res = await api.post('/api/v1/assessment-configs', payload);
      setConfig(res.data?.data || payload);
      setConfigModalOpen(false);
      showToast('success', 'Assessment configuration saved.');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to save configuration.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  if (status === 'loading' && !classData) {
    return (
      <section className="cld-page">
        <div className="cld-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
        <div className="cld-wash" aria-hidden="true" />
        <div className="cld-state"><span className="cld-spinner" /> <p>Loading class details…</p></div>
      </section>
    );
  }

  if (status === 'error' && !classData) {
    return (
      <section className="cld-page">
        <div className="cld-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
        <div className="cld-wash" aria-hidden="true" />
        <div className="cld-state cld-state--error" role="alert">
          <FiAlertTriangle size={32} />
          <h3>Failed to load class</h3>
          <p>{error}</p>
          <button className="cld-btn cld-btn--primary" onClick={reload}><FiRefreshCw size={16} /> Try Again</button>
        </div>
      </section>
    );
  }

  return (
    <section className="cld-page">
      <div className="cld-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="cld-wash" aria-hidden="true" />

      {toast.message && (
        <div className={`cld-toast cld-toast--${toast.type}`} role="alert">
          {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button className="cld-toast-close" onClick={() => setToast({ type: '', message: '' })} aria-label="Close"><FiX size={16} /></button>
        </div>
      )}

      <main className="cld-content">
        <button className="cld-back-btn" onClick={() => navigate('/admin/classes')}>
          <FiArrowLeft size={18} /> Back to Classes
        </button>

        {/* Class Header Card */}
        <div className="cld-header-card">
          <div className="cld-header-icon" aria-hidden="true"><FiBookOpen size={28} /></div>
          <div className="cld-header-info">
            <h1 className="cld-title">{classData.name}</h1>
            <p className="cld-desc">{classData.description || 'No description provided.'}</p>
          </div>
          <div className="cld-header-actions">
            <button className="cld-btn cld-btn--ghost" onClick={() => setEditModalOpen(true)}>
              <FiEdit2 size={16} /> Edit
            </button>
            <button className="cld-btn cld-btn--danger" onClick={() => setDeleteModalOpen(true)}>
              <FiTrash2 size={16} /> Delete
            </button>
          </div>
        </div>

        {/* Assessment Config Card */}
        <div className="cld-card">
          <div className="cld-card-header">
            <h2 className="cld-card-title">Assessment Configuration</h2>
            <button className="cld-btn cld-btn--primary cld-btn--sm" onClick={() => setConfigModalOpen(true)}>
              <FiClipboard size={16} /> Configure
            </button>
          </div>

          {config ? (
            <div className="cld-table-wrapper">
              <table className="cld-table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Type</th>
                    <th className="cld-th-right">Weight (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {config.components.map((comp, idx) => (
                    <tr key={idx}>
                      <td data-label="Component"><strong>{comp.name}</strong></td>
                      <td data-label="Type"><span className="cld-type-badge">{comp.type}</span></td>
                      <td data-label="Weight" className="cld-td-right">{comp.weightage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="cld-empty">
              <FiClipboard size={32} />
              <p>No assessment configuration yet. Click "Configure" to set up grading weights.</p>
            </div>
          )}
        </div>
      </main>

      <EditClassModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} onSubmit={handleUpdateClass} initialData={classData} isSaving={isSavingClass} />
      <AssessmentConfigModal isOpen={configModalOpen} onClose={() => setConfigModalOpen(false)} onSave={handleSaveConfig} initialConfig={config} classId={id} isSaving={isSavingConfig} />
      <ConfirmModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleDeleteClass} title="Delete Class" message="Are you sure you want to delete this class? This action cannot be undone." isConfirming={isDeleting} />
    </section>
  );
};

export default ClassDetail;