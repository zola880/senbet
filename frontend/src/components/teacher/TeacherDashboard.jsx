import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiBook, FiCalendar } from 'react-icons/fi';

const TeacherDashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/api/v1/dashboard/teacher')
      .then(res => setData(res.data.data))
      .catch(console.error);
  }, []);

  if (!data) return <div className="spinner" />;

  const { assignmentsCount, assignments, upcomingPracticeCount } = data;

  return (
    <div
      className="dashboard-hero"
      style={{
        background: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url('https://ibb.co/8nLDtHN1') center / cover no-repeat`,
      }}
    >
      <div className="dashboard-content">
        <div className="dashboard-welcome">
          <h1 className="school-name">የ ቤሮ ደብረ ምህረት ቅዱስ ላሊበላ</h1>
          <h2 className="school-subtitle">መስቀለ ብርሃን ሰንበት ትምህርት ቤት</h2>
          <p className="welcome-text">-</p>
        </div>

        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card glass-card">
            <div className="stat-icon"><FiBook /></div>
            <div className="stat-info">
              <h3>{assignmentsCount}</h3>
              <p>My Courses</p>
            </div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-icon"><FiCalendar /></div>
            <div className="stat-info">
              <h3>{upcomingPracticeCount}</h3>
              <p>Upcoming Practices</p>
            </div>
          </div>
        </div>

        <div className="card glass-card">
          <h3>My Teaching Assignments</h3>
          {assignments && assignments.length > 0 ? (
            <ul>
              {assignments.map((a) => (
                <li key={a._id}>
                  {a.course?.name} – {a.class?.name}
                </li>
              ))}
            </ul>
          ) : (
            <p>No assignments yet. Please contact the admin.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;