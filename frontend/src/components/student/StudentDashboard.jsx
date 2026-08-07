import { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import { FiBook, FiClipboard } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import bgImage from '../../assets/image.png';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user: authUser } = useContext(AuthContext);
  const [data, setData] = useState({
    user: authUser || { fullName: 'Student', class: { name: 'Grade 5' } },
    courses: [],
  });

  useEffect(() => {
    api.get('/api/v1/dashboard/student')
      .then((res) => {
        if (res.data?.data) {
          setData(res.data.data);
        }
      })
      .catch(console.error);
  }, []);

  const student = data.user || authUser || {};
  // Falls back to whatever shape the API returns for the student's enrolled courses
  const coursesCount =
    data.courses?.length ??
    student.class?.courses?.length ??
    student.courses?.length ??
    0;

  return (
    <div className="hero-dash-wrapper">
      {/* Background photo (imported from src/assets/image.png) */}
      <div className="hero-dash-bg" style={{ backgroundImage: `url(${bgImage})` }} />

      <div className="hero-dash-content">
        <h1 className="hero-dash-title">
          የቤሮ ደብረ ምህረት ቅድስት ስላሴ ወ ቅዱስ ላሊበላ
        </h1>
        <p className="hero-dash-subtitle-am">
          መስቀለ ብርሃን ስንበት ትምህርት ቤት
        </p>
        <p className="hero-dash-subtitle-en">
          {student.fullName ? `Welcome, ${student.fullName}` : 'Student Dashboard'}
        </p>

        <div className="hero-dash-cards">
          {/* Current Class */}
          <div
            className="hero-dash-card"
            onClick={() => navigate('/student/materials')}
            role="button"
            tabIndex={0}
          >
            <div className="hero-dash-icon">
              <FiBook size={20} />
            </div>
            <div>
              <p className="hero-dash-card-value">{student.class?.name || 'N/A'}</p>
              <p className="hero-dash-card-label">Current Class</p>
            </div>
          </div>

          {/* Total Courses */}
          <div
            className="hero-dash-card"
            onClick={() => navigate('/student/materials')}
            role="button"
            tabIndex={0}
          >
            <div className="hero-dash-icon">
              <FiClipboard size={20} />
            </div>
            <div>
              <p className="hero-dash-card-value">{coursesCount}</p>
              <p className="hero-dash-card-label">Total Courses</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;