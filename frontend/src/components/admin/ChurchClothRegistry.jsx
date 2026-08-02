import { useEffect, useState } from 'react';
import api from '../../services/api';
import { FiPlus, FiEdit, FiTrash2, FiCheckCircle } from 'react-icons/fi';

const emptyForm = {
  borrowerName: '',
  phoneNumber: '',
  borrowedDate: new Date().toISOString().slice(0, 10),
  expectedReturnDate: '',
  returnedAt: '',
  status: 'borrowed',
  notes: '',
};

const ChurchClothRegistry = () => {
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    try {
      const res = await api.get('/api/v1/church-cloth');
      setRecords(res.data.data || []);
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to load cloth records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const openNewForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (record) => {
    setEditingId(record._id);
    setFormData({
      borrowerName: record.borrowerName || '',
      phoneNumber: record.phoneNumber || '',
      borrowedDate: record.borrowedDate ? new Date(record.borrowedDate).toISOString().slice(0, 10) : '',
      expectedReturnDate: record.expectedReturnDate ? new Date(record.expectedReturnDate).toISOString().slice(0, 10) : '',
      returnedAt: record.returnedAt ? new Date(record.returnedAt).toISOString().slice(0, 10) : '',
      status: record.status || 'borrowed',
      notes: record.notes || '',
    });
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        borrowedDate: formData.borrowedDate || null,
        expectedReturnDate: formData.expectedReturnDate || null,
        returnedAt: formData.returnedAt || null,
      };

      if (editingId) {
        await api.put(`/api/v1/church-cloth/${editingId}`, payload);
      } else {
        await api.post('/api/v1/church-cloth', payload);
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm);
      fetchRecords();
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to save record');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this cloth record?')) return;
    try {
      await api.delete(`/api/v1/church-cloth/${id}`);
      fetchRecords();
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to delete record');
    }
  };

  const markReturned = async (record) => {
    try {
      await api.put(`/api/v1/church-cloth/${record._id}`, {
        status: 'returned',
        returnedAt: new Date().toISOString(),
      });
      fetchRecords();
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to update return status');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="page-title">Church Cloth Registry</h2>
        <button className="btn btn-primary" onClick={openNewForm}>
          <FiPlus style={{ marginRight: '0.4rem' }} /> Register Borrower
        </button>
      </div>

      <div className="card">
        <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
          Register anyone who takes the church cloth and track when they return it after washing it.
        </p>

        {loading ? (
          <p>Loading records...</p>
        ) : records.length === 0 ? (
          <p>No cloth records yet.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Borrower</th>
                  <th>Phone</th>
                  <th>Brought on</th>
                  <th>Expected return</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record._id}>
                    <td>{record.borrowerName}</td>
                    <td>{record.phoneNumber || '—'}</td>
                    <td>{record.borrowedDate ? new Date(record.borrowedDate).toLocaleDateString() : '—'}</td>
                    <td>{record.expectedReturnDate ? new Date(record.expectedReturnDate).toLocaleDateString() : '—'}</td>
                    <td>
                      <span className={`attendance-badge ${record.status === 'returned' ? 'present' : 'absent'}`}>
                        {record.status === 'returned' ? 'Returned' : 'Borrowed'}
                      </span>
                    </td>
                    <td>
                      {record.status !== 'returned' && (
                        <button className="btn btn-sm btn-primary" onClick={() => markReturned(record)} style={{ marginRight: '0.4rem' }}>
                          <FiCheckCircle /> Mark Returned
                        </button>
                      )}
                      <button className="btn btn-sm btn-secondary" onClick={() => openEditForm(record)} style={{ marginRight: '0.4rem' }}>
                        <FiEdit />
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(record._id)}>
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingId ? 'Edit Cloth Record' : 'Register Cloth Borrower'}</h3>
            <form onSubmit={handleSubmit} className="form-grid">
              <input name="borrowerName" placeholder="Borrower name" value={formData.borrowerName} onChange={handleChange} required />
              <input name="phoneNumber" placeholder="Phone number" value={formData.phoneNumber} onChange={handleChange} />
              <input name="borrowedDate" type="date" value={formData.borrowedDate} onChange={handleChange} required />
              <input name="expectedReturnDate" type="date" value={formData.expectedReturnDate} onChange={handleChange} />
              <input name="returnedAt" type="date" value={formData.returnedAt} onChange={handleChange} />
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="borrowed">Borrowed</option>
                <option value="returned">Returned</option>
              </select>
              <textarea name="notes" rows="3" placeholder="Notes" value={formData.notes} onChange={handleChange} style={{ gridColumn: '1 / -1', width: '100%', padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChurchClothRegistry;
