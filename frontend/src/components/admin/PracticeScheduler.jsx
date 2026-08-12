import { useState, useEffect } from 'react';
import api from '../../services/api';
import './PracticeScheduler.css';

const PracticeScheduler = () => {
  const [practices, setPractices] = useState([]);
  const [title, setTitle] = useState('');
  const [practiceType, setPracticeType] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [practicesRes, classesRes] = await Promise.all([
        api.get('/api/v1/practices'),
        api.get('/api/v1/classes')
      ]);
      setPractices(Array.isArray(practicesRes.data?.data) ? practicesRes.data.data : []);
      setClasses(Array.isArray(classesRes.data?.data) ? classesRes.data.data : []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load practices and classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/practices', {
        title, practiceType, recurring,
        dayOfWeek: recurring ? dayOfWeek : null,
        startTime, endTime,
        class: classId || null,
      });
      setTitle(''); 
      setPracticeType('');
      await loadData(); // Reload data
    } catch (err) {
      console.error('Failed to create practice:', err);
      setError('Failed to create practice. Please try again.');
    }
  };

  const formatSchedule = (practice) => {
    const timeRange = `${practice.startTime || '—'}-${practice.endTime || '—'}`;
    if (practice.recurring) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return `Every ${days[practice.dayOfWeek] || 'Unknown'} ${timeRange}`;
    }
    const dateStr = practice.startDate 
      ? new Date(practice.startDate).toLocaleDateString() 
      : 'Date not set';
    return `${dateStr} ${timeRange}`;
  };

  if (loading) {
    return (
      <div>
        <h2 className="page-title">Practice Day Scheduler</h2>
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          Loading practices and classes...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="page-title">Practice Day Scheduler</h2>
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>
          <button className="btn btn-primary" onClick={loadData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="page-title">Practice Day Scheduler</h2>
      <form onSubmit={handleAdd} className="card form-grid">
        <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} required />
        <input placeholder="Type (e.g., Zema)" value={practiceType} onChange={e=>setPracticeType(e.target.value)} required />
        <label>
          <input type="checkbox" checked={recurring} onChange={e=>setRecurring(e.target.checked)} /> Recurring weekly
        </label>
        {recurring && (
          <select value={dayOfWeek} onChange={e=>setDayOfWeek(Number(e.target.value))}>
            <option value={0}>Sunday</option><option value={1}>Monday</option><option value={2}>Tuesday</option><option value={3}>Wednesday</option><option value={4}>Thursday</option><option value={5}>Friday</option><option value={6}>Saturday</option>
          </select>
        )}
        <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} />
        <input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} />
        <select value={classId} onChange={e=>setClassId(e.target.value)}>
          <option value="">All Classes (or select)</option>
          {classes.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <button className="btn btn-primary">Schedule</button>
      </form>
      <div className="table-container">
        {practices.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            No practices scheduled yet.
          </div>
        ) : (
          <table>
            <thead><tr><th>Title</th><th>Type</th><th>Schedule</th></tr></thead>
            <tbody>
              {practices.map(p => (
                <tr key={p._id}>
                  <td>{p.title || '—'}</td>
                  <td>{p.practiceType || '—'}</td>
                  <td>{formatSchedule(p)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
export default PracticeScheduler;