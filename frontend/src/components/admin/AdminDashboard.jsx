import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiUsers, FiBook, FiGrid, FiUserCheck } from 'react-icons/fi';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/api/v1/dashboard/admin')
      .then(res => setStats(res.data.data))
      .catch(console.error);
  }, []);

  if (!stats) return <div className="spinner" />;

  return (
    <div>
      <h2 className="page-title">Admin Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><FiUsers /></div>
          <div className="stat-info">
            <h3>{stats.totalStudents}</h3>
            <p>Students</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FiUserCheck /></div>
          <div className="stat-info">
            <h3>{stats.totalTeachers}</h3>
            <p>Teachers</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FiGrid /></div>
          <div className="stat-info">
            <h3>{stats.totalClasses}</h3>
            <p>Classes</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FiBook /></div>
          <div className="stat-info">
            <h3>{stats.totalCourses}</h3>
            <p>Courses</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Upcoming Practices</h3>
        {stats.upcomingPractices.length ? (
          <ul>
            {stats.upcomingPractices.map(p => (
              <li key={p._id}>{p.title} - {p.startTime}</li>
            ))}
          </ul>
        ) : (
          <p>No upcoming practices</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;