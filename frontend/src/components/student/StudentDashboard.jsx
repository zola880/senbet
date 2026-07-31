import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiBook, FiCalendar } from 'react-icons/fi';

/* Ethiopian cross SVG – intricate, black, used as a watermark */
const CROSS_SVG = (
  <svg
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      position: 'absolute',
      top: '50%',
      left: '55%',                  /* shifted to the right */
      transform: 'translate(-50%, -50%)',
      width: '450px',
      height: '450px',
      opacity: 0.06,
      pointerEvents: 'none',
    }}
  >
    {/* Central cross */}
    <rect x="90" y="20" width="20" height="160" fill="black" />
    <rect x="20" y="90" width="160" height="20" fill="black" />

    {/* Decorative loops */}
    <circle cx="100" cy="30" r="15" stroke="black" strokeWidth="6" fill="none" />
    <circle cx="100" cy="170" r="15" stroke="black" strokeWidth="6" fill="none" />
    <circle cx="30" cy="100" r="15" stroke="black" strokeWidth="6" fill="none" />
    <circle cx="170" cy="100" r="15" stroke="black" strokeWidth="6" fill="none" />

    {/* Small outer circles */}
    <circle cx="100" cy="50" r="10" stroke="black" strokeWidth="4" fill="none" />
    <circle cx="100" cy="150" r="10" stroke="black" strokeWidth="4" fill="none" />
    <circle cx="50" cy="100" r="10" stroke="black" strokeWidth="4" fill="none" />
    <circle cx="150" cy="100" r="10" stroke="black" strokeWidth="4" fill="none" />

    {/* Cross finials (small bars at ends) */}
    <rect x="85" y="10" width="30" height="6" fill="black" />
    <rect x="85" y="184" width="30" height="6" fill="black" />
    <rect x="10" y="97" width="6" height="6" fill="black" />
    <rect x="184" y="97" width="6" height="6" fill="black" />
  </svg>
);

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
        background: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Watermark cross – shifted right */}
      {CROSS_SVG}

      <div className="dashboard-content" style={{ position: 'relative', zIndex: 1 }}>
        <div className="dashboard-welcome" style={{ marginBottom: '3rem' }}>
          <h1 className="school-name">የ ቤሮ ደብረ ምህረት ቅዱስ ላሊበላ</h1>
          <h2 className="school-subtitle">መስቀለ ብርሃን ሰንበት ትምህርት ቤት</h2>
          {/* Welcome message removed */}
        </div>

        <div className="stats-grid">
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