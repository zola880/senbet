import { useCallback, useEffect, useState } from 'react';
import {
  FiAlertTriangle, FiCheckCircle, FiMinus,
  FiPlus, FiTrash2, FiX,
} from 'react-icons/fi';
import api from '../../services/api';
import bgImage from '../../assets/L.png';
import './DevelopmentHome.css';

const DevelopmentHome = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });
  
  const [formData, setFormData] = useState({
    type: 'income',
    description: '',
    amount: '',
    quantity: 1,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/development');
      setRecords(res.data.data || []);
    } catch (err) {
      showToast('error', 'Failed to load records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) {
      showToast('error', 'Description and amount are required.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/v1/development', {
        ...formData,
        amount: parseFloat(formData.amount),
        quantity: parseInt(formData.quantity, 10) || 1,
      });
      showToast('success', 'Record added successfully.');
      setFormData({
        type: 'income', description: '', amount: '', quantity: 1,
        date: new Date().toISOString().split('T')[0], notes: '',
      });
      fetchRecords();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to save record.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await api.delete(`/api/v1/development/${id}`);
      showToast('success', 'Record deleted.');
      fetchRecords();
    } catch (err) {
      showToast('error', 'Failed to delete record.');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(val || 0);
  };

  return (
    <section className="dev-page">
      <div className="dev-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="dev-wash" aria-hidden="true" />

      {toast.message && (
        <div className={`dev-toast dev-toast--${toast.type}`} role="alert">
          {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button className="dev-toast-close" onClick={() => setToast({ type: '', message: '' })}>
            <FiX size={16} />
          </button>
        </div>
      )}

      <main className="dev-content">
        <header className="dev-header">
          <h1 className="dev-title">ልማት ክፍል (Development Dept)</h1>
          <p className="dev-subtitle">Register daily income and purchased items.</p>
        </header>

        <div className="dev-layout">
          {/* Form */}
          <div className="dev-form-card">
            <h2 className="dev-card-title">New Entry</h2>
            <form onSubmit={handleSubmit} className="dev-form">
              <div className="dev-type-toggle">
                <button
                  type="button"
                  className={`dev-type-btn ${formData.type === 'income' ? 'dev-type-btn--active-income' : ''}`}
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                >
                  <FiPlus size={16} /> Income (ገቢ)
                </button>
                <button
                  type="button"
                  className={`dev-type-btn ${formData.type === 'expense' ? 'dev-type-btn--active-expense' : ''}`}
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                >
                  <FiMinus size={16} /> Expense (ወጪ)
                </button>
              </div>

              <div className="dev-form-group">
                <label className="dev-label">Description / Item Name</label>
                <input
                  type="text"
                  className="dev-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={formData.type === 'income' ? 'Source of income...' : 'Item bought...'}
                  required
                />
              </div>

              <div className="dev-form-row">
                <div className="dev-form-group">
                  <label className="dev-label">Amount (ETB)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="dev-input"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="dev-form-group">
                  <label className="dev-label">Quantity</label>
                  <input
                    type="number"
                    className="dev-input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    min="1"
                  />
                </div>
              </div>

              <div className="dev-form-group">
                <label className="dev-label">Date</label>
                <input
                  type="date"
                  className="dev-input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="dev-form-group">
                <label className="dev-label">Notes (Optional)</label>
                <textarea
                  className="dev-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="2"
                />
              </div>

              <button type="submit" className="dev-btn dev-btn--primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Record'}
              </button>
            </form>
          </div>

          {/* Recent Entries */}
          <div className="dev-list-card">
            <h2 className="dev-card-title">Recent Entries</h2>
            {loading ? (
              <div className="dev-state"><span className="dev-spinner" /></div>
            ) : records.length === 0 ? (
              <div className="dev-state"><p>No entries recorded yet.</p></div>
            ) : (
              <div className="dev-table-wrap">
                <table className="dev-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r._id}>
                        <td data-label="Date">{new Date(r.date).toLocaleDateString()}</td>
                        <td data-label="Type">
                          <span className={`dev-badge ${r.type === 'income' ? 'dev-badge--income' : 'dev-badge--expense'}`}>
                            {r.type === 'income' ? 'Income' : 'Expense'}
                          </span>
                        </td>
                        <td data-label="Desc">
                          <div className="dev-desc">{r.description}</div>
                          {r.quantity > 1 && <small className="dev-qty">Qty: {r.quantity}</small>}
                        </td>
                        <td data-label="Total" className="dev-amount">
                          {formatCurrency(r.amount * r.quantity)}
                        </td>
                        <td>
                          <button className="dev-icon-btn" onClick={() => handleDelete(r._id)} title="Delete">
                            <FiTrash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </section>
  );
};

export default DevelopmentHome;