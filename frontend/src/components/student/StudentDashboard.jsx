import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiBook, FiCalendar } from 'react-icons/fi';

const StudentDashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/api/v1/dashboard/student')
      .then(res => setData(res.data.data))
      .catch(console.error);
  }, []);

  if (!data) return <div className="spinner" />;

  const { user, upcomingPractices } = data;

  return (
    <div
      className="dashboard-hero"
      style={{
        background: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkWMpN7EvHUa7Nfon99Js0WtMXxIs4VV-p_GblMyGThA1zmzVbTGTQ7SY&s=10') center / cover no-repeat`,
      }}
    >
      <div className="dashboard-content">
        <div className="dashboard-welcome">
          <h1 className="school-name">የ ቤሮ ደብረ ምህረት ቅዱስ ላሊበላ</h1>
          <h2 className="school-subtitle">መስቀለ ብርሃን ሰንበት ትምህርት ቤት</h2>
          <p className="welcome-text">Welcome, {user.fullName} · Your journey in sacred learning</p>
        </div>

        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card glass-card">
            <div className="stat-icon"><FiBook /></div>
            <div className="stat-info">
              <h3>{user.class?.name || '—'}</h3>
              <p>Class</p>
            </div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-icon"><FiCalendar /></div>
            <div className="stat-info">
              <h3>{upcomingPractices.length}</h3>
              <p>Upcoming Practices</p>
            </div>
          </div>
        </div>

        <div className="card glass-card">
          <h3>Upcoming Practices</h3>
          {upcomingPractices.length > 0 ? (
            <ul>
              {upcomingPractices.map(p => (
                <li key={p._id}>
                  {p.title} – {p.startTime}
                  {p.supervisor && ` (with ${p.supervisor.fullName})`}
                </li>
              ))}
            </ul>
          ) : (
            <p>No upcoming practices</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;