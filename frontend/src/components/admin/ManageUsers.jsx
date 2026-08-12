import { Fragment, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiEdit2,
  FiFilter,
  FiInbox,
  FiLock,
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
   Department configuration
   -------------------------------------------------------------------------- */
const DEPARTMENTS = [
  { key: 'none', label: 'General Admin', color: '#7a6c6d' },
  { key: 'development', label: 'Development (ልማት)', color: '#2e7d32' },
];

/* --------------------------------------------------------------------------
   Locale-aware sorting
   -------------------------------------------------------------------------- */
const getCollator = (locale) => {
  try {
    return new Intl.Collator(locale, { sensitivity: 'base', numeric: true });
  } catch {
    return new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
  }
};

/* --------------------------------------------------------------------------
   Modal Component
   -------------------------------------------------------------------------- */
const UserModal = ({ isOpen, onClose, onSubmit, initialData, classes, isSaving, defaultRole }) => {
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', role: defaultRole,
    class: '', qualifications: '', department: 'none',
  });
  const inputRef = useRef(null);
  const isEditing = Boolean(initialData);

  useEffect(() => {
    if (isOpen) {
      const dept = initialData?.role === 'development' ? 'development' : 'none';
      
      setFormData({
        fullName: initialData?.fullName || '',
        email: initialData?.email || '',
        password: '',
        role: initialData?.role === 'development' ? 'admin' : (initialData?.role || defaultRole),
        class: initialData?.class?._id || initialData?.class || '',
        qualifications: initialData?.qualifications || '',
        department: dept,
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
    
    if (payload.role === 'admin' && payload.department === 'development') {
      payload.role = 'development';
    }
    
    delete payload.department;
    
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
            <input id="mu-fullName" ref={inputRef} name="fullName" type="text" className="mu-input" placeholder="e.g., ዮሐንስ ተስፋዬ / John Doe" value={formData.fullName} onChange={handleChange} required />
          </div>
          
          {formData.role !== 'student' && (
            <>
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
            </>
          )}

          {formData.role === 'student' && !isEditing && (
            <div className="mu-form-group">
              <div className="mu-info-box">
                <FiLock size={16} />
                <div>
                  <strong>Student ID will be auto-generated</strong>
                  <p>After creating the student, a unique Student ID (format: SS-XXXX) will be assigned. You'll need to generate a 6-digit PIN from the actions column afterward — the PIN will be shown only once.</p>
                </div>
              </div>
            </div>
          )}

          {formData.role === 'student' && isEditing && (
            <div className="mu-form-group">
              <label className="mu-label">Student ID</label>
              <input type="text" className="mu-input" value={initialData?.studentId || '—'} disabled />
              <small className="mu-hint">Student ID cannot be changed. Use the PIN button in the actions column to generate or reset the PIN.</small>
            </div>
          )}

          <div className="mu-form-group">
            <label htmlFor="mu-role" className="mu-label">Role</label>
            <select id="mu-role" name="role" className="mu-select" value={formData.role} onChange={handleChange}>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>

          {formData.role === 'admin' && (
            <div className="mu-form-group">
              <label htmlFor="mu-department" className="mu-label">Department</label>
              <select id="mu-department" name="department" className="mu-select" value={formData.department} onChange={handleChange}>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept.key} value={dept.key}>{dept.label}</option>
                ))}
              </select>
              <small className="mu-hint">Assign this admin to manage a specific department</small>
            </div>
          )}

          {formData.role === 'student' && (
            <div className="mu-form-group">
              <label htmlFor="mu-class" className="mu-label">Class</label>
              <select id="mu-class" name="class" className="mu-select" value={formData.class} onChange={handleChange} required>
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
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
];

const ManageUsers = () => {
  const navigate = useNavigate();
  const { users, classes, status, error, reload } = useUsersAndClasses();
  
  const [activeTab, setActiveTab] = useState('admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });

  const deferredQuery = useDeferredValue(searchQuery);
  const tabRefs = useRef({});

  const isLoading = status === 'loading';
  const hasUsers = users.length > 0;

  const collator = useMemo(
    () => getCollator(activeTab === 'student' ? 'am' : undefined),
    [activeTab]
  );

  const filteredUsers = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();

    const matches = users.filter((u) => {
      if (activeTab === 'admin') {
        if (u.role !== 'admin' && u.role !== 'development') return false;
      } else {
        if (u.role !== activeTab) return false;
      }

      if (activeTab === 'admin' && departmentFilter !== 'all') {
        if (departmentFilter === 'none' && u.role !== 'admin') return false;
        if (departmentFilter === 'development' && u.role !== 'development') return false;
      }

      if (activeTab === 'student' && classFilter !== 'all') {
        const studentClassId = u.class?._id || u.class;
        if (studentClassId !== classFilter) return false;
      }

      if (!q) return true;
      return (
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.studentId?.toLowerCase().includes(q) ||
        u.class?.name?.toLowerCase().includes(q)
      );
    });

    return matches.sort((a, b) => collator.compare(a.fullName || '', b.fullName || ''));
  }, [users, activeTab, departmentFilter, classFilter, deferredQuery, collator]);

  const groupedStudents = useMemo(() => {
    if (activeTab !== 'student') return null;
    const groups = [];
    let currentLetter = null;
    let currentGroup = null;

    filteredUsers.forEach((u) => {
      const letter = (u.fullName || '').trim().charAt(0) || '—';
      if (letter !== currentLetter) {
        currentLetter = letter;
        currentGroup = { letter, items: [] };
        groups.push(currentGroup);
      }
      currentGroup.items.push(u);
    });

    return groups;
  }, [activeTab, filteredUsers]);

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
        if (payload.role === 'student') {
          const response = await api.post('/api/v1/auth/register/student', payload);
          const { studentId, createdPin } = response.data.data;
          
          showToast('success', `Student created! ID: ${studentId}`);
          
          setTimeout(() => {
            alert(
              `Student Created Successfully!\n\n` +
              `Name: ${payload.fullName}\n` +
              `Student ID: ${studentId}\n` +
              `PIN: ${createdPin}\n\n` +
              `Please provide these credentials to the student/parent.`
            );
          }, 100);
        } else {
          await api.post('/api/v1/auth/register', payload);
          showToast('success', 'User created successfully.');
        }
      }
      closeModal();
      reload();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Error saving user.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePin = async (studentId, studentName, hasPin) => {
    const actionWord = hasPin ? 'Reset' : 'Generate';
    const warning = hasPin
      ? 'The old PIN will be invalidated immediately.'
      : 'The PIN will be shown only once. Copy it and give it to the student/parent.';

    if (!window.confirm(`${actionWord} PIN for ${studentName}?\n\n${warning}`)) return;
    
    try {
      const response = await api.post(`/api/v1/auth/generate-pin/${studentId}`);
      const newPin = response.data.data.createdPin;
      
      showToast('success', `New PIN generated for ${studentName}`);
      
      setTimeout(() => {
        alert(
          `${hasPin ? 'New' : 'Generated'} PIN for ${studentName}:\n\n` +
          `${newPin}\n\n` +
          `⚠️ IMPORTANT: This PIN cannot be retrieved again.\n` +
          `Please copy it now and provide it to the student/parent.`
        );
      }, 100);

      // Reload so hasPin status updates in the table
      reload();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to generate PIN.');
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

  const handleTabClick = (key) => {
    setActiveTab(key);
    setDepartmentFilter('all');
    setClassFilter('all');
  };

  const getDepartmentBadge = (user) => {
    if (user.role === 'development') {
      const dept = DEPARTMENTS.find(d => d.key === 'development');
      return <span className="mu-dept-badge" style={{ background: dept.color + '20', color: dept.color }}>{dept.label}</span>;
    }
    return <span className="mu-dept-badge mu-dept-badge--general">General</span>;
  };

  const studentColumnCount = 4;

  const renderUserRow = (u) => (
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
      {activeTab === 'student' ? (
        <td data-label="Student ID">{u.studentId || '—'}</td>
      ) : (
        <td data-label="Email">{u.email}</td>
      )}
      {activeTab === 'admin' && <td data-label="Department">{getDepartmentBadge(u)}</td>}
      {activeTab === 'student' && <td data-label="Class">{u.class?.name || '—'}</td>}
      {activeTab === 'teacher' && <td data-label="Qualifications">{u.qualifications || '—'}</td>}
      <td data-label="Actions" className="mu-td-actions">
        <div className="mu-actions" onClick={(e) => e.stopPropagation()}>
          {activeTab === 'student' && u.role === 'student' && (
            <button
              className={`mu-icon-btn mu-icon-btn--pin ${!u.hasPin ? 'mu-icon-btn--pin-empty' : ''}`}
              onClick={(e) => { e.stopPropagation(); handleGeneratePin(u._id, u.fullName, u.hasPin); }}
              title={u.hasPin ? "Reset PIN" : "Generate PIN"}
              aria-label={`${u.hasPin ? 'Reset' : 'Generate'} PIN for ${u.fullName}`}
            >
              <FiLock size={16} />
            </button>
          )}
          <button className="mu-icon-btn" onClick={() => openEditModal(u)} title="Edit" aria-label={`Edit ${u.fullName}`}>
            <FiEdit2 size={16} />
          </button>
          <button className="mu-icon-btn mu-icon-btn--danger" onClick={() => handleDelete(u._id, u.fullName)} title="Delete" aria-label={`Delete ${u.fullName}`}>
            <FiTrash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );

  const hasActiveFilters =
    Boolean(searchQuery) || departmentFilter !== 'all' || classFilter !== 'all';

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
            <p className="mu-subtitle">Create, edit, and organize admins, teachers, and students.</p>
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
              onClick={() => handleTabClick(tab.key)}
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
              placeholder={`Search ${activeTab}s...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search users"
            />
          </div>

          {activeTab === 'admin' && (
            <div className="mu-filter-wrap">
              <FiFilter size={14} className="mu-filter-icon" />
              <select
                className="mu-filter-select"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                aria-label="Filter by department"
              >
                <option value="all">All Departments</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept.key} value={dept.key}>{dept.label}</option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'student' && (
            <div className="mu-filter-wrap">
              <FiFilter size={14} className="mu-filter-icon" />
              <select
                className="mu-filter-select"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                aria-label="Filter by class"
              >
                <option value="all">All Classes</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <button className="mu-btn mu-btn--primary" onClick={openNewModal}>
            <FiPlus size={18} /> Add {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </button>
        </div>

        {status === 'success' && hasUsers && filteredUsers.length > 0 && (
          <p className="mu-result-summary">
            {filteredUsers.length} {filteredUsers.length === 1 ? activeTab : `${activeTab}s`}
            {activeTab === 'student' && ' · sorted ሀ–ፐ'}
            {hasActiveFilters && ' · filtered'}
          </p>
        )}

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
            <h3>No {activeTab}s found</h3>
            <p>{hasActiveFilters ? 'Try adjusting your search, department, or class filters.' : `Click "Add" to create a new ${activeTab}.`}</p>
          </div>
        ) : (
          <div className="mu-table-wrapper">
            <table className="mu-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>{activeTab === 'student' ? 'Student ID' : 'Email'}</th>
                  {activeTab === 'admin' && <th>Department</th>}
                  {activeTab === 'student' && <th>Class</th>}
                  {activeTab === 'teacher' && <th>Qualifications</th>}
                  <th className="mu-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeTab === 'student' && groupedStudents
                  ? groupedStudents.map((group) => (
                      <Fragment key={group.letter}>
                        <tr className="mu-group-row" aria-hidden="true">
                          <td colSpan={studentColumnCount} className="mu-group-header">
                            <span className="mu-group-letter">{group.letter}</span>
                            <span className="mu-group-count">{group.items.length}</span>
                          </td>
                        </tr>
                        {group.items.map(renderUserRow)}
                      </Fragment>
                    ))
                  : filteredUsers.map(renderUserRow)}
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
        defaultRole={activeTab === 'admin' ? 'admin' : activeTab}
      />
    </section>
  );
};

export default ManageUsers;