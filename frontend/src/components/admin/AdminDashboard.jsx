import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiUsers, FiUserCheck, FiGrid, FiBook } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import bgImage from '../../assets/image.png';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalCourses: 0,
  });

  useEffect(() => {
    api.get('/api/v1/dashboard/admin')
      .then((res) => {
        const d = res.data?.data || {};
        setStats({
          totalStudents: d.totalStudents ?? 0,
          totalTeachers: d.totalTeachers ?? 0,
          totalClasses: d.totalClasses ?? 0,
          totalCourses: d.totalCourses ?? 0,
        });
      })
      .catch(console.error);
  }, []);

  const statCardsData = [
    { id: 'students', label: 'Students', count: stats.totalStudents, icon: FiUsers, link: '/admin/users' },
    { id: 'teachers', label: 'Teachers', count: stats.totalTeachers, icon: FiUserCheck, link: '/admin/users' },
    { id: 'classes', label: 'Classes', count: stats.totalClasses, icon: FiGrid, link: '/admin/classes' },
    { id: 'courses', label: 'Courses', count: stats.totalCourses, icon: FiBook, link: '/admin/courses' },
  ];

  return (
    <div className="hero-dash-wrapper">
      {/* Background photo (imported from src/assets/image.png) */}
      <div className="hero-dash-bg" style={{ backgroundImage: `url(${bgImage})` }} />

      <div className="hero-dash-content">
        <h1 className="hero-dash-title">
          የ ቤ ተ ክ ርስ ቲ ያ ን ም ህ ረት ቅ ዱስ ላ ሊ በ ላ
        </h1>
        <p className="hero-dash-subtitle-am">
          መስቀለ ብርሃን ስንበት ትምህርት ቤት
        </p>
        <p className="hero-dash-subtitle-en">
          Manage your school with ease and efficiency
        </p>

        <div className="hero-dash-cards-grid">
          {statCardsData.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="hero-dash-card"
                onClick={() => navigate(card.link)}
                role="button"
                tabIndex={0}
              >
                <div className="hero-dash-icon">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="hero-dash-card-value">{card.count}</p>
                  <p className="hero-dash-card-label">{card.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;


