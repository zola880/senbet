import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiEdit, FiTrash2, FiUserPlus } from 'react-icons/fi';
import EmptyState from '../common/EmptyState';
import './ManageUsers.css';

const TABS = [
  { key: 'admin', label: 'Admins' },
  { key: 'teacher', label: 'Teachers' },
  { key: 'student', label: 'Students' },
];

const ManageUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('admin');
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: activeTab === 'admin' ? 'admin' : activeTab === 'teacher' ? 'teacher' : 'student',
    class: '',
    rollNumber: '',
    qualifications: '',
  });
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchClasses();
  }, []);

  const fetchUsers = async () => {
    const res = await api.get('/api/v1/users');
    setUsers(res.data.data);
  };

  const fetchClasses = async () => {
    const res = await api.get('/api/v1/classes');
    setClasses(res.data.data);
  };

  const filteredUsers = users.filter((u) => u.role === activeTab);

  const openNewUserForm = () => {
    setEditUser(null);
    setFormData({
      fullName: '',
      email: '',
      password: '',
      role: activeTab,
      class: '',
      rollNumber: '',
      qualifications: '',
    });
    setShowForm(true);
  };

  const openEditForm = (user, e) => {
    if (e) e.stopPropagation();   // prevent row click if coming from button
    setEditUser(user);
    setFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      password: '',
      role: user.role || activeTab,
      class: user.class?._id || user.class || '',
      rollNumber: user.rollNumber || '',
      qualifications: user.qualifications || '',
    });
    setShowForm(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await api.put(`/api/v1/users/${editUser._id}`, payload);
      } else {
        await api.post('/api/v1/auth/register', formData);
      }
      setShowForm(false);
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving user');
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this user?')) {
      await api.delete(`/api/v1/users/${id}`);
      fetchUsers();
    }
  };

  // Navigate to student detail page when row is clicked
  const handleRowClick = (userId) => {
    navigate(`/admin/users/${userId}`);
  };

  return (
    <div>
      <h2 className="page-title">Manage Users</h2>

      <div className="tabs-container">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-button ${activeTab === tab.key ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '1rem', marginTop: '1rem' }}>
        <button className="btn btn-primary" onClick={openNewUserForm}>
          <FiUserPlus /> Add {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </button>
      </div>

      <div className="table-container">
        {filteredUsers.length === 0 ? (
          <EmptyState message={`No ${activeTab}s found. Click "Add" to create one.`} />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                {activeTab === 'student' && <th>Class</th>}
                {activeTab === 'student' && <th>Roll No</th>}
                {activeTab === 'teacher' && <th>Qualifications</th>}
                {/* Only show Actions column for non‑student roles or if we want edit/delete buttons for all? We'll keep for admins/teachers, remove for students. */}
                {activeTab !== 'student' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr
                  key={u._id}
                  onClick={activeTab === 'student' ? () => handleRowClick(u._id) : undefined}
                  style={{
                    cursor: activeTab === 'student' ? 'pointer' : 'default',
                  }}
                >
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  {activeTab === 'student' && <td>{u.class?.name || '—'}</td>}
                  {activeTab === 'student' && <td>{u.rollNumber || '—'}</td>}
                  {activeTab === 'teacher' && <td>{u.qualifications || '—'}</td>}
                  {activeTab !== 'student' && (
                    <td>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={(e) => openEditForm(u, e)}
                      >
                        <FiEdit />
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={(e) => handleDelete(u._id, e)}
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

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editUser ? 'Edit User' : 'Add New User'}</h3>
            <form onSubmit={handleSubmit} className="form-grid">
              <input
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleFormChange}
                required
              />
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleFormChange}
                required
              />
              <input
                name="password"
                type="password"
                placeholder={editUser ? 'New password (leave blank to keep current)' : 'Password'}
                value={formData.password}
                onChange={handleFormChange}
                required={!editUser}
              />
              <select name="role" value={formData.role} onChange={handleFormChange}>
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>

              {formData.role === 'student' && (
                <>
                  <select name="class" value={formData.class} onChange={handleFormChange}>
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                  <input
                    name="rollNumber"
                    placeholder="Roll Number"
                    value={formData.rollNumber}
                    onChange={handleFormChange}
                  />
                </>
              )}

              {formData.role === 'teacher' && (
                <input
                  name="qualifications"
                  placeholder="Qualifications (optional)"
                  value={formData.qualifications}
                  onChange={handleFormChange}
                />
              )}

              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  {editUser ? 'Update' : 'Create'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;