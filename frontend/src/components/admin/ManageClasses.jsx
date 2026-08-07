import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiPlus, FiBookOpen } from 'react-icons/fi';
import EmptyState from '../common/EmptyState';
import './ManageClasses.css';

const ManageClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editClass, setEditClass] = useState(null);
  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');

  const fetchClasses = () => {
    api.get('/api/v1/classes')
      .then(res => setClasses(res.data.data))
      .catch(console.error);
  };

  useEffect(() => { fetchClasses(); }, []);

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

  return (
    <div>
      {/* Header */}
      <div className="class-header">
        <div>
          <h2 className="page-title" style={{ marginBottom: '0.3rem' }}>Manage Classes</h2>
          <p className="class-header-subtitle">Organise your church school classes (ክፍሎች)</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditClass(null); setShowForm(true); }}>
          <FiPlus /> Add Class
        </button>
      </div>

      {/* Add class modal */}
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

      {/* Class cards grid */}
      {classes.length === 0 ? (
        <EmptyState message="No classes yet. Click “Add Class” to create the first one." />
      ) : (
        <div className="class-card-grid">
          {classes.map(c => (
            <div
              key={c._id}
              className="class-card"
              onClick={() => navigate(`/admin/classes/${c._id}`)}
            >
              <div className="class-card-icon">
                <FiBookOpen size={24} />
              </div>
              <h3 className="class-card-name">{c.name}</h3>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageClasses;