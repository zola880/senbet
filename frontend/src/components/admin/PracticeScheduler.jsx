import { useState, useEffect } from 'react';
import api from '../../services/api';

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

  useEffect(() => {
    api.get('/api/v1/practices').then(r=>setPractices(r.data.data));
    api.get('/api/v1/classes').then(r=>setClasses(r.data.data));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    await api.post('/api/v1/practices', {
      title, practiceType, recurring,
      dayOfWeek: recurring ? dayOfWeek : null,
      startTime, endTime,
      class: classId || null,
    });
    setTitle(''); setPracticeType('');
    const res = await api.get('/api/v1/practices');
    setPractices(res.data.data);
  };

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
        <table>
          <thead><tr><th>Title</th><th>Type</th><th>Schedule</th></tr></thead>
          <tbody>{practices.map(p=><tr key={p._id}><td>{p.title}</td><td>{p.practiceType}</td><td>{p.recurring ? `Every ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][p.dayOfWeek]}` : new Date(p.startDate).toLocaleDateString()} {p.startTime}-{p.endTime}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
};
export default PracticeScheduler;