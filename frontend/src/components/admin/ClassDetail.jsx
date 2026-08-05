import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiArrowLeft, FiEdit, FiTrash2, FiClipboard, FiBookOpen } from 'react-icons/fi';
import EmptyState from '../common/EmptyState';

const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [classData, setClassData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');

  // Assessment config state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [config, setConfig] = useState(null);
  const [components, setComponents] = useState([{ name: '', type: 'exam', weightage: 0 }]);
  const [configError, setConfigError] = useState('');
  const [configSuccess, setConfigSuccess] = useState('');

  const fetchClass = async () => {
    try {
      const res = await api.get(`/api/v1/classes/${id}`);
      setClassData(res.data.data);
      setClassName(res.data.data.name);
      setDescription(res.data.data.description || '');
    } catch (err) {
      console.error(err);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await api.get(`/api/v1/assessment-configs/${id}`);
      setConfig(res.data.data);
      setComponents(res.data.data.components.map(c => ({ ...c, weightage: Number(c.weightage) })));
    } catch (err) {
      setConfig(null);
      setComponents([{ name: '', type: 'exam', weightage: 0 }]);
    }
  };

  useEffect(() => {
    fetchClass();
    fetchConfig();
  }, [id]);

  // Update class
  const handleUpdate = async (e) => {
    e.preventDefault();
    await api.put(`/api/v1/classes/${id}`, { name: className, description });
    setEditMode(false);
    fetchClass();
  };

  // Delete class
  const handleDelete = async () => {
    if (window.confirm('Delete this class? This action cannot be undone.')) {
      await api.delete(`/api/v1/classes/${id}`);
      navigate('/admin/classes');
    }
  };

  // Assessment config handlers
  const addComponent = () => {
    setComponents([...components, { name: '', type: 'exam', weightage: 0 }]);
  };

  const updateComponent = (index, field, value) => {
    const updated = [...components];
    // Ensure weightage is always stored as a number
    updated[index][field] = field === 'weightage' ? Number(value) : value;
    setComponents(updated);
  };

  const removeComponent = (index) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const handleSaveConfig = async () => {
    setConfigError('');
    setConfigSuccess('');

    // Ensure weightage values are numbers and sum to 100
    const total = components.reduce((sum, comp) => sum + Number(comp.weightage || 0), 0);
    if (total !== 100) {
      setConfigError(`Total weightage must be exactly 100%. Currently: ${total}%.`);
      return;
    }

    if (components.some(c => !c.name.trim())) {
      setConfigError('All components must have a name.');
      return;
    }

    try {
      await api.post('/api/v1/assessment-configs', {
        class: id,
        academicYear: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
        components: components.map(c => ({ ...c, weightage: Number(c.weightage) })),
      });
      setConfigSuccess('Assessment configuration saved successfully!');
      setShowConfigModal(false);
      fetchConfig();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to save configuration.';
      setConfigError(message);
    }
  };

  if (!classData) return <div className="spinner" />;

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => navigate('/admin/classes')} style={{ marginBottom: '1rem' }}>
        <FiArrowLeft /> Back to Classes
      </button>

      {/* Class header card */}
      <div className="class-detail-header">
        <div className="class-detail-icon">
          <FiBookOpen size={28} />
        </div>
        <div className="class-detail-info">
          <h2>{classData.name}</h2>
          <p>{classData.description || 'No description'}</p>
        </div>
        <div className="class-detail-actions">
          <button className="btn btn-sm btn-secondary" onClick={() => setEditMode(true)}>
            <FiEdit /> Edit
          </button>
          <button className="btn btn-sm btn-danger" onClick={handleDelete}>
            <FiTrash2 /> Delete
          </button>
        </div>
      </div>

      {/* Edit modal */}
      {editMode && (
        <div className="modal-backdrop" onClick={() => setEditMode(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Edit Class</h3>
            <form onSubmit={handleUpdate} className="form-grid">
              <input
                placeholder="Class Name"
                value={className}
                onChange={e => setClassName(e.target.value)}
                required
              />
              <input
                placeholder="Description"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* Assessment config section */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Assessment Configuration</h3>
          <button className="btn btn-sm btn-primary" onClick={() => setShowConfigModal(true)}>
            <FiClipboard /> Configure
          </button>
        </div>

        {configError && <div className="error-message">{configError}</div>}
        {configSuccess && <div className="success-message">{configSuccess}</div>}

        {config ? (
          <div className="mini-table-container" style={{ marginTop: '1rem' }}>
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Type</th>
                  <th>Weight (%)</th>
                </tr>
              </thead>
              <tbody>
                {config.components.map((comp, idx) => (
                  <tr key={idx}>
                    <td>{comp.name}</td>
                    <td>{comp.type}</td>
                    <td>{comp.weightage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No assessment configuration yet." />
        )}
      </div>

      {/* Assessment config modal */}
      {showConfigModal && (
        <div className="modal-backdrop" onClick={() => setShowConfigModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Assessment Config for {classData.name}</h3>
            {configError && <div className="error-message" style={{ marginBottom: '1rem' }}>{configError}</div>}
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
                  onChange={e => updateComponent(idx, 'weightage', e.target.value)}
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
    </div>
  );
};

export default ClassDetail;