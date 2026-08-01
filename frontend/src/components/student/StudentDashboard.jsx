import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiBook, FiCalendar } from 'react-icons/fi';

/* Simple, bold filled cross – right side, attractive and clean */
const FILLED_CROSS_SVG = (
  <svg
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      position: 'absolute',
      top: 0,
      left: '55%',
      width: '45%',
      height: '100%',
      opacity: 0.45,
      pointerEvents: 'none',
    }}
  >
    {/* Vertical bar of the cross (centered) */}
    <rect x="90" y="10" width="20" height="180" rx="4" fill="black" />
    {/* Horizontal bar */}
    <rect x="30" y="80" width="140" height="20" rx="4" fill="black" />
    {/* Central circle (decorative medallion) */}
    <circle cx="100" cy="90" r="18" fill="white" />
    <circle cx="100" cy="90" r="12" fill="black" />
    {/* Small decorative finials at the ends of the cross arms */}
    <circle cx="100" cy="20" r="8" fill="black" />
    <circle cx="100" cy="180" r="8" fill="black" />
    <circle cx="40" cy="90" r="8" fill="black" />
    <circle cx="160" cy="90" r="8" fill="black" />
    {/* Tiny dots at the very tips (optional) */}
    <circle cx="100" cy="10" r="3" fill="black" />
    <circle cx="100" cy="190" r="3" fill="black" />
    <circle cx="30" cy="90" r="3" fill="black" />
    <circle cx="170" cy="90" r="3" fill="black" />
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
        background: '#fcf9f2',       /* cream background */
        position: 'relative',
        overflow: 'hidden',
        minHeight: 'calc(100vh - 4rem)',
      }}
    >
      {/* Bold filled cross on the right side */}
      {FILLED_CROSS_SVG}

      {/* Content on top */}
      <div className="dashboard-content" style={{ position: 'relative', zIndex: 1 }}>
        <div className="dashboard-welcome" style={{ marginBottom: '3rem' }}>
          <h1 className="school-name">የ ቤሮ ደብረ ምህረት ቅዱስ ላሊበላ</h1>
          <h2 className="school-subtitle">መስቀለ ብርሃን ሰንበት ትምህርት ቤት</h2>
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