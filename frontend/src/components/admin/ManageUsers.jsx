import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiEdit2,
  FiInbox,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
} from 'react-icons/fi';

import api from '../../services/api';
import bgImage from '../../assets/L.png';
import './ManageUsers.css';

/* --------------------------------------------------------------------------
   Data hook: Fetch Users & Classes with AbortController
   -------------------------------------------------------------------------- */
const useUsersAndClasses = () => {
  const [users, setUsers] = useState([]);
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
      const [usersRes, classesRes] = await Promise.all([
        api.get('/api/v1/users', { signal: controller.signal }),
        api.get('/api/v1/classes', { signal: controller.signal }),
      ]);

      setUsers(Array.isArray(usersRes.data?.data) ? usersRes.data.data : []);
      setClasses(Array.isArray(classesRes.data?.data) ? classesRes.data.data : []);
      setStatus('success');
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
      console.error('Failed to load users/classes:', err);
      setError('Unable to load users. Please try again.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    reload();
    return () => abortRef.current?.abort();
  }, [reload]);

  return { users, classes, status, error, reload };
};

/* --------------------------------------------------------------------------
   Modal Component
   -------------------------------------------------------------------------- */
const UserModal = ({ isOpen, onClose, onSubmit, initialData, classes, isSaving, defaultRole }) => {
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', role: defaultRole,
    class: '', rollNumber: '', qualifications: '',
  });
  const inputRef = useRef(null);
  const isEditing = Boolean(initialData);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: initialData?.fullName || '',
        email: initialData?.email || '',
        password: '',
        role: initialData?.role || defaultRole,
        class: initialData?.class?._id || initialData?.class || '',
        rollNumber: initialData?.rollNumber || '',
        qualifications: initialData?.qualifications || '',
      });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialData, defaultRole]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (isEditing && !payload.password) delete payload.password;
    onSubmit(payload);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="mu-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="mu-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mu-modal-header">
          <h2>{isEditing ? 'Edit User' : 'Add New User'}</h2>
          <button className="mu-modal-close" onClick={onClose} aria-label="Close modal">
            <FiX size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="mu-form">
          <div className="mu-form-group">
            <label htmlFor="mu-fullName" className="mu-label">Full Name <span className="mu-required">*</span></label>
            <input id="mu-fullName" ref={inputRef} name="fullName" type="text" className="mu-input" placeholder="e.g., John Doe" value={formData.fullName} onChange={handleChange} required />
          </div>
          
          <div className="mu-form-group">
            <label htmlFor="mu-email" className="mu-label">Email <span className="mu-required">*</span></label>
            <input id="mu-email" name="email" type="email" className="mu-input" placeholder="user@example.com" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="mu-form-group">
            <label htmlFor="mu-password" className="mu-label">
              Password {isEditing && <span className="mu-optional">(leave blank to keep current)</span>}
            </label>
            <input id="mu-password" name="password" type="password" className="mu-input" placeholder="••••••••" value={formData.password} onChange={handleChange} required={!isEditing} />
          </div>

          <div className="mu-form-group">
            <label htmlFor="mu-role" className="mu-label">Role</label>
            <select id="mu-role" name="role" className="mu-select" value={formData.role} onChange={handleChange}>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
              <option value="development">Development (ልማት)</option>
            </select>
          </div>

          {formData.role === 'student' && (
            <>
              <div className="mu-form-group">
                <label htmlFor="mu-class" className="mu-label">Class</label>
                <select id="mu-class" name="class" className="mu-select" value={formData.class} onChange={handleChange}>
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="mu-form-group">
                <label htmlFor="mu-rollNumber" className="mu-label">Roll Number</label>
                <input id="mu-rollNumber" name="rollNumber" type="text" className="mu-input" placeholder="e.g., 101" value={formData.rollNumber} onChange={handleChange} />
              </div>
            </>
          )}

          {formData.role === 'teacher' && (
            <div className="mu-form-group">
              <label htmlFor="mu-qualifications" className="mu-label">Qualifications</label>
              <input id="mu-qualifications" name="qualifications" type="text" className="mu-input" placeholder="e.g., B.Ed, M.A." value={formData.qualifications} onChange={handleChange} />
            </div>
          )}

          <div className="mu-form-actions">
            <button type="button" className="mu-btn mu-btn--ghost" onClick={onClose} disabled={isSaving}>Cancel</button>
            <button type="submit" className="mu-btn mu-btn--primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : (isEditing ? 'Update User' : 'Create User')}
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
const TABS = [
  { key: 'admin', label: 'Admins' },
  { key: 'teacher', label: 'Teachers' },
  { key: 'student', label: 'Students' },
  { key: 'development', label: 'Development (ልማት)' },
];

const ManageUsers = () => {
  const navigate = useNavigate();
  const { users, classes, status, error, reload } = useUsersAndClasses();
  
  const [activeTab, setActiveTab] = useState('admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });
  
  const tabRefs = useRef({});

  const isLoading = status === 'loading';
  const hasUsers = users.length > 0;

  const filteredUsers = users.filter((u) => {
    if (u.role !== activeTab) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.class?.name?.toLowerCase().includes(q) ||
      u.rollNumber?.toLowerCase().includes(q)
    );
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

  const openNewModal = () => { setEditingUser(null); setModalOpen(true); };
  const openEditModal = (user) => { setEditingUser(user); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingUser(null); };

  const handleSave = async (payload) => {
    setIsSaving(true);
    try {
      if (editingUser) {
        await api.put(`/api/v1/users/${editingUser._id}`, payload);
        showToast('success', 'User updated successfully.');
      } else {
        await api.post('/api/v1/auth/register', payload);
        showToast('success', 'User created successfully.');
      }
      closeModal();
      reload();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Error saving user.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api.delete(`/api/v1/users/${id}`);
      showToast('success', `${name} deleted successfully.`);
      reload();
    } catch (err) {
      showToast('error', 'Failed to delete user.');
    }
  };

  const handleRowClick = (userId) => {
    if (activeTab === 'student') navigate(`/admin/users/${userId}`);
  };

  const handleTabKeyDown = (event, index) => {
    const handledKeys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!handledKeys.includes(event.key)) return;
    event.preventDefault();
    let nextIndex;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % TABS.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === 'Home') nextIndex = 0;
    else nextIndex = TABS.length - 1;
    const nextTab = TABS[nextIndex];
    setActiveTab(nextTab.key);
    tabRefs.current[nextTab.key]?.focus();
  };

  return (
    <section className="mu-page">
      <div className="mu-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="mu-wash" aria-hidden="true" />

      {toast.message && (
        <div className={`mu-toast mu-toast--${toast.type}`} role="alert">
          {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button className="mu-toast-close" onClick={() => setToast({ type: '', message: '' })} aria-label="Close"><FiX size={16} /></button>
        </div>
      )}

      <main className="mu-content">
        <header className="mu-header">
          <div>
            <h1 className="mu-title">Manage Users</h1>
            <p className="mu-subtitle">Create, edit, and organize admins, teachers, students, and development staff.</p>
          </div>
        </header>

        <div className="mu-tabs" role="tablist" aria-label="User roles">
          {TABS.map((tab, index) => (
            <button
              key={tab.key}
              ref={(el) => { tabRefs.current[tab.key] = el; }}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              tabIndex={activeTab === tab.key ? 0 : -1}
              className={`mu-tab ${activeTab === tab.key ? 'mu-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
              onKeyDown={(e) => handleTabKeyDown(e, index)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mu-toolbar">
          <div className="mu-search">
            <FiSearch className="mu-search-icon" size={16} aria-hidden="true" />
            <input
              type="search"
              className="mu-search-input"
              placeholder={`Search ${activeTab === 'development' ? 'development staff' : `${activeTab}s`}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search users"
            />
          </div>
          <button className="mu-btn mu-btn--primary" onClick={openNewModal}>
            <FiPlus size={18} /> Add {activeTab === 'development' ? 'Development Staff' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </button>
        </div>

        {isLoading && !hasUsers ? (
          <div className="mu-state" role="status">
            <span className="mu-spinner" aria-hidden="true" />
            <p>Loading users…</p>
          </div>
        ) : status === 'error' && !hasUsers ? (
          <div className="mu-state mu-state--error" role="alert">
            <FiAlertTriangle size={32} />
            <h3>Failed to load users</h3>
            <p>{error}</p>
            <button className="mu-btn mu-btn--primary" onClick={reload}><FiRefreshCw size={16} /> Try Again</button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="mu-state">
            <FiInbox size={40} />
            <h3>No {activeTab === 'development' ? 'development staff' : `${activeTab}s`} found</h3>
            <p>{searchQuery ? 'Try adjusting your search query.' : `Click "Add" to create a new ${activeTab === 'development' ? 'development staff member' : activeTab}.`}</p>
          </div>
        ) : (
          <div className="mu-table-wrapper">
            <table className="mu-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  {activeTab === 'student' && <th>Class</th>}
                  {activeTab === 'student' && <th>Roll No</th>}
                  {activeTab === 'teacher' && <th>Qualifications</th>}
                  <th className="mu-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr
                    key={u._id}
                    className={activeTab === 'student' ? 'mu-row--clickable' : ''}
                    onClick={() => handleRowClick(u._id)}
                    tabIndex={activeTab === 'student' ? 0 : undefined}
                    onKeyDown={(e) => { if (activeTab === 'student' && e.key === 'Enter') handleRowClick(u._id); }}
                  >
                    <td data-label="Name">
                      <div className="mu-user-cell">
                        <span className="mu-avatar" aria-hidden="true">{u.fullName?.charAt(0).toUpperCase() || '?'}</span>
                        <span className="mu-user-name">{u.fullName}</span>
                      </div>
                    </td>
                    <td data-label="Email">{u.email}</td>
                    {activeTab === 'student' && <td data-label="Class">{u.class?.name || '—'}</td>}
                    {activeTab === 'student' && <td data-label="Roll No">{u.rollNumber || '—'}</td>}
                    {activeTab === 'teacher' && <td data-label="Qualifications">{u.qualifications || '—'}</td>}
                    <td data-label="Actions" className="mu-td-actions">
                      <div className="mu-actions" onClick={(e) => e.stopPropagation()}>
                        <button className="mu-icon-btn" onClick={() => openEditModal(u)} title="Edit" aria-label={`Edit ${u.fullName}`}>
                          <FiEdit2 size={16} />
                        </button>
                        <button className="mu-icon-btn mu-icon-btn--danger" onClick={() => handleDelete(u._id, u.fullName)} title="Delete" aria-label={`Delete ${u.fullName}`}>
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <UserModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleSave}
        initialData={editingUser}
        classes={classes}
        isSaving={isSaving}
        defaultRole={activeTab}
      />
    </section>
  );
};

export default ManageUsers;