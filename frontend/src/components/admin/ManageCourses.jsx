import { useState, useEffect } from 'react';
import api from '../../services/api';

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const fetch = () => api.get('/api/v1/courses').then(r => setCourses(r.data.data));
  useEffect(() => { fetch(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    await api.post('/api/v1/courses', { name, code });
    setName(''); setCode('');
    fetch();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete course?')) {
      await api.delete(`/api/v1/courses/${id}`);
      fetch();
    }
  };

  return (
    <div>
      <h2 className="page-title">Manage Courses</h2>
      <form onSubmit={handleAdd} className="card form-grid">
        <input placeholder="Course Name (e.g., Zema)" value={name} onChange={e => setName(e.target.value)} required />
        <input placeholder="Code" value={code} onChange={e => setCode(e.target.value)} />
        <button className="btn btn-primary">Add Course</button>
      </form>
      <div className="table-container">
        <table>
          <thead><tr><th>Name</th><th>Code</th><th>Action</th></tr></thead>
          <tbody>{courses.map(c=><tr key={c._id}><td>{c.name}</td><td>{c.code}</td><td><button className="btn btn-sm btn-danger" onClick={()=>handleDelete(c._id)}>Delete</button></td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
};
export default ManageCourses;