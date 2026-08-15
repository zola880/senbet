import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiAlertTriangle, FiCheckCircle, FiMinus,
  FiPlus, FiTrash2, FiX,
} from 'react-icons/fi';
import api from '../../services/api';
import bgImage from '../../assets/L.png';
import './DevelopmentHome.css';

// የእቃ ዝርዝር - ተደጋግሞ ስለሚያገለግል በዝርዝር (dropdown) ተዘጋጅቷል
const ITEMS = [
  'ነጠላ', 'ብስኩት', 'ውዳሴማርያም', 'ዳዊት', 'ሰእል አድኖ',
  'ጁስ', 'ውሃ', 'ማስቲካ', 'ከረሜላ', 'መጋረጃ',
];
const OTHER_ITEM = 'ሌላ';

const todayStr = () => new Date().toISOString().split('T')[0];

const emptyForm = () => ({
  type: 'income',
  item: '',
  customItem: '',
  amount: '',
  quantity: 1,
  date: todayStr(),
  notes: '',
});

const DevelopmentHome = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });
  const [formData, setFormData] = useState(emptyForm());

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
      showToast('error', 'ምዝገባዎችን መጫን አልተቻለም።');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const finalDescription = formData.item === OTHER_ITEM
    ? formData.customItem.trim()
    : formData.item;

  const isFormValid = finalDescription && formData.amount;

  const handleQuantityChange = (delta) => {
    setFormData((prev) => ({
      ...prev,
      quantity: Math.max(1, (parseInt(prev.quantity, 10) || 1) + delta),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!finalDescription) {
      showToast('error', 'እባክዎ እቃ ይምረጡ ወይም ስም ያስገቡ።');
      return;
    }
    if (!formData.amount) {
      showToast('error', 'እባክዎ መጠን ያስገቡ።');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/v1/development', {
        type: formData.type,
        description: finalDescription,
        amount: parseFloat(formData.amount),
        quantity: parseInt(formData.quantity, 10) || 1,
        date: formData.date,
        notes: formData.notes,
      });
      showToast('success', 'ምዝገባው ተከናውኗል።');
      // ቀኑን እንደያዘ ቀሪውን ያጸዳል፤ ደጋግሞ ለመመዝገብ ፈጣን ይሆናል
      setFormData({ ...emptyForm(), date: formData.date, type: formData.type });
      fetchRecords();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'ምዝገባውን ማስቀመጥ አልተቻለም።');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('ይህን ምዝገባ መሰረዝ ይፈልጋሉ?')) return;
    try {
      await api.delete(`/api/v1/development/${id}`);
      showToast('success', 'ምዝገባው ተሰርዟል።');
      fetchRecords();
    } catch (err) {
      showToast('error', 'መሰረዝ አልተቻለም።');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(val || 0);
  };

  const summary = useMemo(() => {
    const income = records
      .filter((r) => r.type === 'income')
      .reduce((sum, r) => sum + (r.amount * r.quantity || 0), 0);
    const expense = records
      .filter((r) => r.type === 'expense')
      .reduce((sum, r) => sum + (r.amount * r.quantity || 0), 0);
    return { income, expense, net: income - expense };
  }, [records]);

  return (
    <section className="dev-page">
      <div className="dev-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="dev-wash" aria-hidden="true" />

      {toast.message && (
        <div className={`dev-toast dev-toast--${toast.type}`} role="alert">
          {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button className="dev-toast-close" onClick={() => setToast({ type: '', message: '' })} aria-label="ዝጋ">
            <FiX size={16} />
          </button>
        </div>
      )}

      <main className="dev-content">
        <header className="dev-header">
          <h1 className="dev-title">የልማት ክፍል</h1>
          <p className="dev-subtitle">የዕለት ገቢና ወጪ በቀላሉ ይመዝግቡ</p>
        </header>

        {!loading && records.length > 0 && (
          <div className="dev-summary">
            <div className="dev-summary-item dev-summary-item--income">
              <span className="dev-summary-label">ጠቅላላ ገቢ</span>
              <span className="dev-summary-value">{formatCurrency(summary.income)}</span>
            </div>
            <div className="dev-summary-item dev-summary-item--expense">
              <span className="dev-summary-label">ጠቅላላ ወጪ</span>
              <span className="dev-summary-value">{formatCurrency(summary.expense)}</span>
            </div>
            <div className="dev-summary-item dev-summary-item--net">
              <span className="dev-summary-label">ትርፍ/ጉድለት</span>
              <span className="dev-summary-value">{formatCurrency(summary.net)}</span>
            </div>
          </div>
        )}

        <div className="dev-layout">
          {/* Form */}
          <div className="dev-form-card">
            <h2 className="dev-card-title">አዲስ ምዝገባ</h2>
            <form onSubmit={handleSubmit} className="dev-form">
              <div className="dev-type-toggle">
                <button
                  type="button"
                  className={`dev-type-btn ${formData.type === 'income' ? 'dev-type-btn--active-income' : ''}`}
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                >
                  <FiPlus size={18} /> ገቢ
                </button>
                <button
                  type="button"
                  className={`dev-type-btn ${formData.type === 'expense' ? 'dev-type-btn--active-expense' : ''}`}
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                >
                  <FiMinus size={18} /> ወጪ
                </button>
              </div>

              <div className="dev-form-group">
                <label className="dev-label">እቃ</label>
                <select
                  className="dev-select"
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                  required
                >
                  <option value="" disabled>እቃ ይምረጡ...</option>
                  {ITEMS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                  <option value={OTHER_ITEM}>{OTHER_ITEM} (ሌላ ስም ያስገቡ)</option>
                </select>
              </div>

              {formData.item === OTHER_ITEM && (
                <div className="dev-form-group">
                  <label className="dev-label">የእቃ ስም</label>
                  <input
                    type="text"
                    className="dev-input"
                    value={formData.customItem}
                    onChange={(e) => setFormData({ ...formData, customItem: e.target.value })}
                    placeholder="ስም ያስገቡ..."
                    autoFocus
                    required
                  />
                </div>
              )}

              <div className="dev-form-row">
                <div className="dev-form-group">
                  <label className="dev-label">መጠን (ብር)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    className="dev-input dev-input--amount"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="dev-form-group">
                  <label className="dev-label">ብዛት</label>
                  <div className="dev-qty-stepper">
                    <button
                      type="button"
                      className="dev-qty-btn"
                      onClick={() => handleQuantityChange(-1)}
                      aria-label="ቀንስ"
                    >
                      <FiMinus size={16} />
                    </button>
                    <span className="dev-qty-value">{formData.quantity}</span>
                    <button
                      type="button"
                      className="dev-qty-btn"
                      onClick={() => handleQuantityChange(1)}
                      aria-label="ጨምር"
                    >
                      <FiPlus size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="dev-form-group">
                <label className="dev-label">ቀን</label>
                <input
                  type="date"
                  className="dev-input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="dev-form-group">
                <label className="dev-label">ማስታወሻ (አማራጭ)</label>
                <textarea
                  className="dev-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="2"
                  placeholder="ካስፈለገ ብቻ ይሙሉ..."
                />
              </div>

              <button
                type="submit"
                className={`dev-btn dev-btn--primary ${formData.type === 'expense' ? 'dev-btn--expense' : ''}`}
                disabled={saving || !isFormValid}
              >
                {saving ? 'በመመዝገብ ላይ...' : 'መዝግብ'}
              </button>
            </form>
          </div>

          {/* Recent Entries */}
          <div className="dev-list-card">
            <h2 className="dev-card-title">የቅርብ ጊዜ ምዝገባዎች</h2>
            {loading ? (
              <div className="dev-state"><span className="dev-spinner" /></div>
            ) : records.length === 0 ? (
              <div className="dev-state"><p>እስካሁን ምንም ምዝገባ የለም።</p></div>
            ) : (
              <div className="dev-table-wrap">
                <table className="dev-table">
                  <thead>
                    <tr>
                      <th>ቀን</th>
                      <th>አይነት</th>
                      <th>እቃ</th>
                      <th>ጠቅላላ</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r._id}>
                        <td data-label="ቀን">{new Date(r.date).toLocaleDateString('am-ET')}</td>
                        <td data-label="አይነት">
                          <span className={`dev-badge ${r.type === 'income' ? 'dev-badge--income' : 'dev-badge--expense'}`}>
                            {r.type === 'income' ? 'ገቢ' : 'ወጪ'}
                          </span>
                        </td>
                        <td data-label="እቃ">
                          <div className="dev-desc">{r.description}</div>
                          {r.quantity > 1 && <small className="dev-qty">ብዛት: {r.quantity}</small>}
                        </td>
                        <td data-label="ጠቅላላ" className="dev-amount">
                          {formatCurrency(r.amount * r.quantity)}
                        </td>
                        <td>
                          <button className="dev-icon-btn" onClick={() => handleDelete(r._id)} title="ሰርዝ" aria-label="ሰርዝ">
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