import { useState } from 'react';
import { FiUsers, FiUserCheck, FiGrid, FiBook, FiPlus, FiCheckCircle, FiEdit, FiUserPlus, FiActivity, FiBell } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const stats = {
    totalStudents: 125,
    totalTeachers: 8,
    totalClasses: 12,
    totalCourses: 9,
  };

  const attendanceData = {
    present: 115,
    late: 6,
    absent: 19,
    total: 140,
    presentPct: '82.1%',
    latePct: '4.3%',
    absentPct: '13.6%',
  };

  const absentStudents = [
    { initials: 'AB', name: 'Abel Tesfaye', class: 'Grade 5', days: '5 days' },
    { initials: 'HN', name: 'Hana Mekonnen', class: 'Grade 4', days: '4 days' },
    { initials: 'DW', name: 'Dawit Alemu', class: 'Grade 6', days: '4 days' },
    { initials: 'YN', name: 'Yohannes Bekele', class: 'Grade 5', days: '3 days' },
    { initials: 'BT', name: 'Betelhem Desta', class: 'Grade 3', days: '3 days' },
  ];

  const recentActivities = [
    { id: 1, type: 'student', icon: FiUsers, title: 'New student registered', desc: 'Samuel Haile was added', time: '2h ago' },
    { id: 2, type: 'attendance', icon: FiCheckCircle, title: 'Attendance recorded', desc: 'For Grade 5', time: '3h ago' },
    { id: 3, type: 'scores', icon: FiEdit, title: 'Scores entered', desc: 'Sunday School Exam', time: '5h ago' },
    { id: 4, type: 'teacher', icon: FiUserPlus, title: 'New teacher added', desc: 'Teacher Ruth joined', time: '1d ago' },
    { id: 5, type: 'class', icon: FiGrid, title: 'Class updated', desc: 'Grade 4 information updated', time: '1d ago' },
  ];

  const announcements = [
    { id: 1, title: 'Parent meeting this Friday', desc: 'At 3:00 PM in the church hall', date: 'Aug 1' },
    { id: 2, title: 'Holiday next week', desc: 'No classes on Wednesday', date: 'Jul 30' },
    { id: 3, title: 'Choir practice Saturday', desc: 'At 9:00 AM', date: 'Jul 29' },
  ];

  const getActivityIconClass = (type) => {
    const map = {
      student: 'student',
      attendance: 'attendance',
      scores: 'scores',
      teacher: 'teacher',
      class: 'class',
    };
    return map[type] || 'student';
  };

  return (
    <>
      {/* ===== SIDEBAR ===== */}
      <aside className="sidebar" id="sidebar">
        <div className="sidebar-header">
          <h2>
            フィールドマスター
            <span className="jp">カリキュラム</span>
          </h2>
        </div>

        <nav className="sidebar-nav" id="sidebarNav">
          <div className="nav-section">ADMIN</div>
          <a href="#" className="active"><i className="fas fa-th-large"></i> Dashboard</a>
          <a href="#"><i className="fas fa-users"></i> Users</a>
          <a href="#"><i className="fas fa-layer-group"></i> Classes</a>
          <a href="#"><i className="fas fa-book-open"></i> Courses</a>
          <a href="#"><i className="fas fa-pen-alt"></i> Enter Scores</a>
          <a href="#"><i className="fas fa-trophy"></i> Ranking</a>
          <a href="#"><i className="fas fa-calendar-check"></i> Attendance</a>
          <a href="#"><i className="fas fa-tshirt"></i> Church Cloth</a>
          <a href="#"><i className="fas fa-dumbbell"></i> Practice Days</a>
        </nav>

        <div className="sidebar-user">
          <div className="avatar">ZY</div>
          <div className="info">
            <div className="name">Zellem Ybabe</div>
            <div className="role">Administrator</div>
            <div className="status">
              <span className="dot"></span> Online
            </div>
          </div>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="main">

        <div className="page-header">
          <h1>
            ADMIN
            <small>· Dashboard</small>
          </h1>
          <button className="menu-toggle" id="menuToggle" aria-label="Toggle menu">
            <i className="fas fa-bars"></i>
          </button>
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-mini">
            <div className="icon blue"><i className="fas fa-user-graduate"></i></div>
            <div className="info">
              <h3>{stats.totalStudents}</h3>
              <p>Students</p>
            </div>
          </div>
          <div className="stat-mini">
            <div className="icon green"><i className="fas fa-chalkboard-teacher"></i></div>
            <div className="info">
              <h3>{stats.totalTeachers}</h3>
              <p>Teachers</p>
            </div>
          </div>
          <div className="stat-mini">
            <div className="icon orange"><i className="fas fa-layer-group"></i></div>
            <div className="info">
              <h3>{stats.totalClasses}</h3>
              <p>Classes</p>
            </div>
          </div>
          <div className="stat-mini">
            <div className="icon purple"><i className="fas fa-book-open"></i></div>
            <div className="info">
              <h3>{stats.totalCourses}</h3>
              <p>Courses</p>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="dash-grid">

          {/* LEFT COLUMN */}
          <div className="dash-left">

            {/* Attendance Summary */}
            <div className="card attendance-summary">
              <div className="card-header">
                <h3>Today's Attendance Summary</h3>
                <span className="sub">August 3, 2025</span>
              </div>

              <div className="total-row">
                <span className="label">Total Students</span>
                <span className="value">{attendanceData.total}</span>
              </div>

              <div className="attendance-stats">
                <div className="attendance-stat-item">
                  <div className="num present">{attendanceData.present}</div>
                  <div className="lbl">Present</div>
                  <span className="pct green">{attendanceData.presentPct}</span>
                </div>
                <div className="attendance-stat-item">
                  <div className="num late">{attendanceData.late}</div>
                  <div className="lbl">Late</div>
                  <span className="pct orange">{attendanceData.latePct}</span>
                </div>
                <div className="attendance-stat-item">
                  <div className="num absent">{attendanceData.absent}</div>
                  <div className="lbl">Absent</div>
                  <span className="pct red">{attendanceData.absentPct}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="card-header">
                <h3>Quick Actions</h3>
              </div>
              <div className="quick-actions">
                <button className="qa-btn" onClick={() => navigate('/admin/users')}>
                  <i className="fas fa-user-plus"></i> Add Student
                </button>
                <button className="qa-btn" onClick={() => navigate('/admin/attendance')}>
                  <i className="fas fa-clipboard-check"></i> Record Attendance
                </button>
                <button className="qa-btn" onClick={() => navigate('/admin/scores')}>
                  <i className="fas fa-pen-alt"></i> Enter Scores
                </button>
                <button className="qa-btn" onClick={() => navigate('/admin/users')}>
                  <i className="fas fa-user-plus"></i> Add Teacher
                </button>
              </div>
            </div>

            {/* Repeatedly Absent Students */}
            <div className="card">
              <div className="card-header">
                <h3>Repeatedly Absent Students</h3>
                <a href="#" className="link">View All →</a>
              </div>

              <div className="absent-table-wrap">
                <table className="absent-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Class</th>
                      <th>Absent Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {absentStudents.map((student, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="student-cell">
                            <span className="badge">{student.initials}</span>
                            <span className="name">{student.name}</span>
                          </div>
                        </td>
                        <td>{student.class}</td>
                        <td><span className="days">{student.days}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="dash-right">

            {/* Recent Activities */}
            <div className="card">
              <div className="card-header">
                <h3>Recent Activities</h3>
              </div>

              <div className="activities-list">
                {recentActivities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="activity-item">
                      <div className={`icon-wrap ${getActivityIconClass(activity.type)}`}>
                        <Icon size={16} />
                      </div>
                      <div className="content">
                        <div className="title">{activity.title}</div>
                        <div className="desc">{activity.desc}</div>
                      </div>
                      <span className="time">{activity.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Announcements */}
            <div className="card">
              <div className="card-header">
                <h3>Announcements</h3>
              </div>

              <div className="announcements-list">
                {announcements.map((ann) => (
                  <div key={ann.id} className="announcement-item">
                    <div className="icon-wrap"><i className="fas fa-bullhorn"></i></div>
                    <div className="content">
                      <div className="title">{ann.title}</div>
                      <div className="desc">{ann.desc}</div>
                    </div>
                    <span className="date">{ann.date}</span>
                  </div>
                ))}
              </div>

              <a href="#" className="view-all-announce">View All Announcements →</a>
            </div>

          </div>
        </div>

      </main>

      {/* ===== MOBILE MENU TOGGLE SCRIPT ===== */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const toggle = document.getElementById('menuToggle');
              const nav = document.getElementById('sidebarNav');
              const sidebar = document.getElementById('sidebar');

              if (toggle && nav) {
                toggle.addEventListener('click', function(e) {
                  e.stopPropagation();
                  nav.classList.toggle('open');
                });

                document.addEventListener('click', function(e) {
                  if (window.innerWidth <= 768) {
                    if (!sidebar.contains(e.target) && nav.classList.contains('open')) {
                      nav.classList.remove('open');
                    }
                  }
                });

                nav.querySelectorAll('a').forEach(function(link) {
                  link.addEventListener('click', function() {
                    if (window.innerWidth <= 768) {
                      nav.classList.remove('open');
                    }
                  });
                });
              }

              document.querySelectorAll('.sidebar-nav a').forEach(function(link) {
                link.addEventListener('click', function(e) {
                  document.querySelectorAll('.sidebar-nav a').forEach(function(l) {
                    l.classList.remove('active');
                  });
                  this.classList.add('active');
                });
              });
            })();
          `
        }}
      />
    </>
  );
};

export default AdminDashboard;