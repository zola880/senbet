import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiEdit, FiTrash2, FiPlus, FiClipboard } from 'react-icons/fi';
import EmptyState from '../common/EmptyState';

const ManageClasses = () => {
  const [classes, setClasses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editClass, setEditClass] = useState(null);
  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');

  // Assessment config modal state
  const [selectedClassForConfig, setSelectedClassForConfig] = useState(null);
  const [config, setConfig] = useState(null);
  const [components, setComponents] = useState([{ name: '', type: 'exam', weightage: 0 }]);

  const fetchClasses = () => {
    api.get('/api/v1/classes')
      .then(res => setClasses(res.data.data))
      .catch(console.error);
  };

  useEffect(() => { fetchClasses(); }, []);

  // --- Class CRUD handlers ---
  const handleAdd = async (e) => {
    e.preventDefault();
    if (editClass) {
      await api.put(`/api/v1/classes/${editClass._id}`, { name: className, description });
    } else {
      await api.post('/api/v1/classes', { name: className, description });
    }
    setShowForm(false);
    setEditClass(null);
    setClassName('');
    setDescription('');
    fetchClasses();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this class?')) {
      await api.delete(`/api/v1/classes/${id}`);
      fetchClasses();
    }
  };

  const openEditForm = (cls) => {
    setEditClass(cls);
    setClassName(cls.name);
    setDescription(cls.description || '');
    setShowForm(true);
  };

  // --- Assessment config handlers ---
  const loadConfig = async (classId) => {
    try {
      const res = await api.get(`/api/v1/assessment-configs/${classId}`);
      setConfig(res.data.data);
      setComponents(res.data.data.components);
    } catch (err) {
      setConfig(null);
      setComponents([{ name: '', type: 'exam', weightage: 0 }]);
    }
  };

  const openConfigModal = (classItem) => {
    setSelectedClassForConfig(classItem);
    loadConfig(classItem._id);
  };

  const addComponent = () => {
    setComponents([...components, { name: '', type: 'exam', weightage: 0 }]);
  };

  const updateComponent = (index, field, value) => {
    const updated = [...components];
    updated[index][field] = value;
    setComponents(updated);
  };

  const removeComponent = (index) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const handleSaveConfig = async () => {
    if (!selectedClassForConfig) return;
    await api.post('/api/v1/assessment-configs', {
      class: selectedClassForConfig._id,
      academicYear: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
      components,
    });
    alert('Assessment config saved for ' + selectedClassForConfig.name);
    setSelectedClassForConfig(null);
  };

  return (
    <div>
      <h2 className="page-title">Manage Classes (ክፍሎች)</h2>

      <button className="btn btn-primary" onClick={() => { setEditClass(null); setShowForm(true); }}>
        <FiPlus /> Add Class
      </button>

      {/* Class add/edit modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{editClass ? 'Edit Class' : 'New Class'}</h3>
            <form onSubmit={handleAdd} className="form-grid">
              <input
                placeholder="Class Name (e.g., ሃ1)"
                value={className}
                onChange={e => setClassName(e.target.value)}
                required
              />
              <input
                placeholder="Description (optional)"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* Assessment config modal */}
      {selectedClassForConfig && (
        <div className="modal-backdrop" onClick={() => setSelectedClassForConfig(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Assessment Config for {selectedClassForConfig.name}</h3>
            {components.map((comp, idx) => (
              <div key={idx} className="form-grid" style={{ marginBottom: '0.5rem' }}>
                <input
                  placeholder="Component Name"
                  value={comp.name}
                  onChange={e => updateComponent(idx, 'name', e.target.value)}
                />
                <select
                  value={comp.type}
                  onChange={e => updateComponent(idx, 'type', e.target.value)}
                >
                  <option value="exam">Exam</option>
                  <option value="activity">Activity</option>
                  <option value="attendance">Attendance</option>
                  <option value="custom">Custom</option>
                </select>
                <input
                  type="number"
                  placeholder="Weight (%)"
                  value={comp.weightage}
                  onChange={e => updateComponent(idx, 'weightage', Number(e.target.value))}
                />
                <button className="btn btn-sm btn-danger" onClick={() => removeComponent(idx)}>X</button>
              </div>
            ))}
            <button className="btn btn-secondary" onClick={addComponent}>+ Add Component</button>
            <button
              className="btn btn-primary"
              style={{ marginLeft: '1rem' }}
              onClick={handleSaveConfig}
              disabled={components.some(c => !c.name || c.weightage <= 0)}
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}

      {/* Classes table */}
      <div className="table-container" style={{ marginTop: '1rem' }}>
        {classes.length === 0 ? (
          <EmptyState message="No classes yet." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(c => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td>{c.description || '—'}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => openConfigModal(c)}
                      title="Assessment Configuration"
                    >
                      <FiClipboard /> Assessment
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => openEditForm(c)}>
                      <FiEdit />
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c._id)}>
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

export default ManageClasses;