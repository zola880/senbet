import { useEffect, useState } from 'react';
import { FiTrendingDown, FiTrendingUp, FiDollarSign, FiFilter } from 'react-icons/fi';
import api from '../../services/api';
import bgImage from '../../assets/L.png';
import './DevelopmentReports.css';

const DevelopmentReports = () => {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = `?startDate=${startDate}&endDate=${endDate}`;
      const [recordsRes, summaryRes] = await Promise.all([
        api.get(`/api/v1/development${params}`),
        api.get(`/api/v1/development/summary${params}`),
      ]);
      setRecords(recordsRes.data.data || []);
      setSummary(summaryRes.data.data || { totalIncome: 0, totalExpense: 0, balance: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(val || 0);
  };

  return (
    <section className="devr-page">
      <div className="devr-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="devr-wash" aria-hidden="true" />

      <main className="devr-content">
        <header className="devr-header">
          <div>
            <h1 className="devr-title">ልማት Reports</h1>
            <p className="devr-subtitle">Income and expense overview for the Development Department.</p>
          </div>
        </header>

        <div className="devr-filters">
          <div className="devr-filter-group">
            <label>Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="devr-filter-group">
            <label>End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <button className="devr-btn devr-btn--primary" onClick={fetchData}>
            <FiFilter size={16} /> Apply Filter
          </button>
        </div>

        <div className="devr-summary">
          <div className="devr-stat-card devr-stat--income">
            <FiTrendingUp size={24} />
            <div>
              <span>Total Income (ገቢ)</span>
              <strong>{formatCurrency(summary.totalIncome)}</strong>
            </div>
          </div>
          <div className="devr-stat-card devr-stat--expense">
            <FiTrendingDown size={24} />
            <div>
              <span>Total Expense (ወጪ)</span>
              <strong>{formatCurrency(summary.totalExpense)}</strong>
            </div>
          </div>
          <div className="devr-stat-card devr-stat--balance">
            <FiDollarSign size={24} />
            <div>
              <span>Net Balance (ቀሪ)</span>
              <strong>{formatCurrency(summary.balance)}</strong>
            </div>
          </div>
        </div>

        <div className="devr-table-card">
          <h2 className="devr-card-title">Detailed Records ({records.length})</h2>
          {loading ? (
            <div className="devr-state"><span className="devr-spinner" /></div>
          ) : records.length === 0 ? (
            <div className="devr-state"><p>No records found for this date range.</p></div>
          ) : (
            <div className="devr-table-wrap">
              <table className="devr-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Amount</th>
                    <th>Recorded By</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r._id}>
                      <td data-label="Date">{new Date(r.date).toLocaleDateString()}</td>
                      <td data-label="Type">
                        <span className={`devr-badge ${r.type === 'income' ? 'devr-badge--income' : 'devr-badge--expense'}`}>
                          {r.type === 'income' ? 'Income' : 'Expense'}
                        </span>
                      </td>
                      <td data-label="Desc" className="devr-desc">{r.description}</td>
                      <td data-label="Qty">{r.quantity}</td>
                      <td data-label="Amount" className="devr-amount">{formatCurrency(r.amount)}</td>
                      <td data-label="By">{r.recordedBy?.fullName || 'Unknown'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </section>
  );
};

export default DevelopmentReports;