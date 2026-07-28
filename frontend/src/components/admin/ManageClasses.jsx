import { useState, useEffect } from 'react';
import api from '../../services/api';
import EmptyState from '../common/EmptyState';

const ManageClasses = () => {
  const [classes, setClasses] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const fetch = () => api.get('/api/v1/classes').then(res => setClasses(res.data.data));
  useEffect(() => { fetch(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    await api.post('/api/v1/classes', { name, description });
    setName(''); setDescription('');
    fetch();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete class?')) {
      await api.delete(`/api/v1/classes/${id}`);
      fetch();
    }
  };

  return (
    <div>
      <h2 className="page-title">Manage Classes (ክፍሎች)</h2>
      <form onSubmit={handleAdd} className="card form-grid">
        <input placeholder="Class Name (e.g., ሃ1)" value={name} onChange={e => setName(e.target.value)} required />
        <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
        <button className="btn btn-primary">Add Class</button>
      </form>
      <div className="table-container">
        <table>
          <thead><tr><th>Name</th><th>Description</th><th>Action</th></tr></thead>
          <tbody>
            {classes.map(c => (
              <tr key={c._id}><td>{c.name}</td><td>{c.description}</td><td><button className="btn btn-sm btn-danger" onClick={() => handleDelete(c._id)}>Delete</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageClasses;