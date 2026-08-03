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
    <div 
      className="admin-dashboard-hero"
      style={{
        backgroundImage: 'url(https://thumbs.dreamstime.com/b/unique-monolithic-rock-hewn-church-st-george-bete-giyorgis-unesco-world-heritage-lalibela-ethiopia-sunset-church-st-161201368.jpg)',
      }}
    >
      <div className="dashboard-overlay"></div>
      
      <div className="dashboard-content-wrapper">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>Manage your school with ease and efficiency</p>
        </div>

        <div className="dashboard-cards-grid">
          <div className="dashboard-card">
            <div className="card-stat-icon"><FiUsers /></div>
            <div className="card-stat-content">
              <h3>{stats.totalStudents}</h3>
              <p>Students</p>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-stat-icon"><FiUserCheck /></div>
            <div className="card-stat-content">
              <h3>{stats.totalTeachers}</h3>
              <p>Teachers</p>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-stat-icon"><FiGrid /></div>
            <div className="card-stat-content">
              <h3>{stats.totalClasses}</h3>
              <p>Classes</p>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-stat-icon"><FiBook /></div>
            <div className="card-stat-content">
              <h3>{stats.totalCourses}</h3>
              <p>Courses</p>
            </div>
          </div>

          <div className="dashboard-card dashboard-card-full">
            <h3>Upcoming Practices</h3>
            {stats.upcomingPractices.length ? (
              <ul className="practices-list">
                {stats.upcomingPractices.map(p => (
                  <li key={p._id}>
                    <span className="practice-title">{p.title}</span>
                    <span className="practice-time">{p.startTime}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No upcoming practices</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;