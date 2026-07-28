import { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import AuthContext from '../../context/AuthContext';

const PracticeCalendar = () => {
  const { user } = useContext(AuthContext);
  const [practices, setPractices] = useState([]);
  useEffect(() => { api.get('/api/v1/practices/my').then(r=>setPractices(r.data.data)); }, [user._id]);
  return (
    <div>
      <h2 className="page-title">My Practice Days</h2>
      <div className="table-container">
        <table>
          <thead><tr><th>Title</th><th>Type</th><th>Day/Date</th><th>Time</th></tr></thead>
          <tbody>
            {practices.map(p=><tr key={p._id}><td>{p.title}</td><td>{p.practiceType}</td><td>{p.recurring ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][p.dayOfWeek] : new Date(p.startDate).toLocaleDateString()}</td><td>{p.startTime}-{p.endTime}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default PracticeCalendar;