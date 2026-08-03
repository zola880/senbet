import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiUsers, FiUserCheck, FiGrid, FiBook, FiChevronRight, FiPlus, FiCheckCircle, FiEdit, FiUserPlus, FiActivity, FiBell } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalCourses: 0,
    upcomingPractices: [],
  });
  const [attendance, setAttendance] = useState({ present: 0, late: 0, absent: 0, total: 0 });
  const [absentStudents, setAbsentStudents] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/api/v1/dashboard/admin'),
      api.get('/api/v1/users?role=student').catch(() => ({ data: { data: [] } })),
    ]).then(([dashRes, usersRes]) => {
      setStats(dashRes.data.data || stats);
      
      // Calculate attendance summary (mock data for now)
      const presentCount = Math.floor((usersRes.data.data?.length || 0) * 0.82);
      const lateCount = Math.floor((usersRes.data.data?.length || 0) * 0.04);
      const absentCount = Math.floor((usersRes.data.data?.length || 0) * 0.14);
      
      setAttendance({
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        total: usersRes.data.data?.length || 0,
      });
    }).catch(console.error);
  }, []);

  const recentActivities = [
    { id: 1, type: 'student', title: 'New student registered', desc: 'Samuel Haile was added', time: '2h ago', icon: FiUsers },
    { id: 2, type: 'attendance', title: 'Attendance recorded', desc: 'For Grade 5', time: '3h ago', icon: FiCheckCircle },
    { id: 3, type: 'scores', title: 'Scores entered', desc: 'Sunday School Exam', time: '5h ago', icon: FiEdit },
    { id: 4, type: 'teacher', title: 'New teacher added', desc: 'Teacher Ruth joined', time: '1d ago', icon: FiUserPlus },
    { id: 5, type: 'class', title: 'Class updated', desc: 'Grade 4 information updated', time: '1d ago', icon: FiGrid },
  ];

  const announcements = [
    { id: 1, title: 'Parent meeting this Friday', desc: 'At 3:00 PM in the church hall', date: 'Aug 1' },
    { id: 2, title: 'Holiday next week', desc: 'No classes on Wednesday', date: 'Jul 30' },
    { id: 3, title: 'Choir practice Saturday', desc: 'At 9:00 AM', date: 'Jul 29' },
  ];

  return (
    <div className="admin-dashboard-layout">
      {/* Top Bar */}
      <div className="dashboard-topbar">
        <div className="topbar-left">
          <button className="topbar-menu"><FiActivity size={24} /></button>
        </div>
        <div className="topbar-right">
          <button className="topbar-icon with-badge"><FiBell size={20} /><span className="badge">3</span></button>
          <button className="topbar-icon"><FiGrid size={20} /></button>
          <button className="topbar-icon"><FiUserCheck size={20} /></button>
        </div>
      </div>

      <div className="dashboard-container">
        {/* Left Sidebar Stats */}
        <div className="dashboard-sidebar">
          {/* Student Stat Card */}
          <div className="sidebar-stat-card">
            <div className="stat-card-icon stat-icon-blue"><FiUsers size={20} /></div>
            <div className="stat-card-content">
              <h4>{stats.totalStudents}</h4>
              <p>Students</p>
            </div>
            <FiChevronRight className="stat-card-arrow" />
          </div>

          {/* Teacher Stat Card */}
          <div className="sidebar-stat-card">
            <div className="stat-card-icon stat-icon-orange"><FiUserCheck size={20} /></div>
            <div className="stat-card-content">
              <h4>{stats.totalTeachers}</h4>
              <p>Teachers</p>
            </div>
            <FiChevronRight className="stat-card-arrow" />
          </div>

          {/* Classes Stat Card */}
          <div className="sidebar-stat-card">
            <div className="stat-card-icon stat-icon-green"><FiGrid size={20} /></div>
            <div className="stat-card-content">
              <h4>{stats.totalClasses}</h4>
              <p>Classes</p>
            </div>
            <FiChevronRight className="stat-card-arrow" />
          </div>

          {/* Courses Stat Card */}
          <div className="sidebar-stat-card">
            <div className="stat-card-icon stat-icon-blue"><FiBook size={20} /></div>
            <div className="stat-card-content">
              <h4>{stats.totalCourses}</h4>
              <p>Courses</p>
            </div>
            <FiChevronRight className="stat-card-arrow" />
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-card">
            <h3>Quick Actions</h3>
            <button className="quick-action-btn" onClick={() => navigate('/admin/users')}>
              <FiUserPlus size={18} /> Add Student
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/admin/attendance')}>
              <FiCheckCircle size={18} /> Record Attendance
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/admin/scores')}>
              <FiEdit size={18} /> Enter Scores
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/admin/users')}>
              <FiUserPlus size={18} /> Add Teacher
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="dashboard-main">
          {/* Attendance Summary */}
          <div className="attendance-summary-card">
            <div className="card-header">
              <h3>Today's Attendance Summary</h3>
              <span className="card-date">August 3, 2025</span>
            </div>
            
            <div className="attendance-stats-row">
              <div className="attendance-stat">
                <div className="attendance-stat-icon present"><FiCheckCircle size={28} /></div>
                <h4>{attendance.present}</h4>
                <p>Present</p>
                <span className="attendance-percentage">82.1%</span>
              </div>

              <div className="attendance-stat">
                <div className="attendance-stat-icon late" style={{ color: '#f59e0b' }}><FiActivity size={28} /></div>
                <h4>{attendance.late}</h4>
                <p>Late</p>
                <span className="attendance-percentage">4.3%</span>
              </div>

              <div className="attendance-stat">
                <div className="attendance-stat-icon absent"><FiUsers size={28} /></div>
                <h4>{attendance.absent}</h4>
                <p>Absent</p>
                <span className="attendance-percentage">13.6%</span>
              </div>
            </div>

            <div className="attendance-progress">
              <div className="progress-bar">
                <div className="progress-segment present" style={{ width: '82.1%' }}></div>
                <div className="progress-segment late" style={{ width: '4.3%' }}></div>
                <div className="progress-segment absent" style={{ width: '13.6%' }}></div>
              </div>
              <p className="progress-total">Total Students: {attendance.total}</p>
            </div>
          </div>

          {/* Repeatedly Absent Students Table */}
          <div className="absent-students-card">
            <div className="card-header">
              <h3>Repeatedly Absent Students</h3>
              <a href="#" className="view-all">View All →</a>
            </div>
            
            <table className="absent-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Absent Days</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="student-badge">AB</span> Abel Tesfaye</td>
                  <td>Grade 5</td>
                  <td><span className="absent-days">5 days</span></td>
                </tr>
                <tr>
                  <td><span className="student-badge">HN</span> Hana Mekonnen</td>
                  <td>Grade 4</td>
                  <td><span className="absent-days">4 days</span></td>
                </tr>
                <tr>
                  <td><span className="student-badge">DW</span> Dawit Alemu</td>
                  <td>Grade 6</td>
                  <td><span className="absent-days">4 days</span></td>
                </tr>
                <tr>
                  <td><span className="student-badge">YN</span> Yohannes Bekele</td>
                  <td>Grade 5</td>
                  <td><span className="absent-days">3 days</span></td>
                </tr>
                <tr>
                  <td><span className="student-badge">BT</span> Betelhem Desta</td>
                  <td>Grade 3</td>
                  <td><span className="absent-days">3 days</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar - Activities & Announcements */}
        <div className="dashboard-right-sidebar">
          {/* Recent Activities */}
          <div className="activities-card">
            <h3>Recent Activities</h3>
            <div className="activities-list">
              {recentActivities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="activity-item">
                    <div className={`activity-icon activity-${activity.type}`}>
                      <Icon size={16} />
                    </div>
                    <div className="activity-content">
                      <p className="activity-title">{activity.title}</p>
                      <p className="activity-desc">{activity.desc}</p>
                    </div>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Announcements */}
          <div className="announcements-card">
            <h3>Announcements</h3>
            <div className="announcements-list">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="announcement-item">
                  <div className="announcement-icon"><FiBell size={18} /></div>
                  <div className="announcement-content">
                    <p className="announcement-title">{announcement.title}</p>
                    <p className="announcement-desc">{announcement.desc}</p>
                  </div>
                  <span className="announcement-date">{announcement.date}</span>
                </div>
              ))}
            </div>
            <a href="#" className="view-all-announcements">View All Announcements →</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;