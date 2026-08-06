import { useState, useEffect, useContext } from 'react';

import api from '../../services/api';

import AuthContext from '../../context/AuthContext';

import { FiBook, FiCalendar } from 'react-icons/fi';

import { useNavigate } from 'react-router-dom';

import bgImage from '../../assets/image.png';



const TeacherDashboard = () => {

  const navigate = useNavigate();

  const { user: authUser } = useContext(AuthContext);

  const [data, setData] = useState({

    assignmentsCount: 0,

    assignments: [],

    upcomingPracticeCount: 0,

  });



  useEffect(() => {

    api.get('/api/v1/dashboard/teacher')

      .then((res) => {

        if (res.data?.data) {

          setData(res.data.data);

        }

      })

      .catch(console.error);

  }, []);



  const teacher = authUser || {};

  const { assignmentsCount, assignments, upcomingPracticeCount } = data;

  const coursesCount = assignmentsCount || assignments.length || 0;



  return (

    <div className="hero-dash-wrapper">

      {/* Background photo (imported from src/assets/image.png) */}

      <div className="hero-dash-bg" style={{ backgroundImage: `url(${bgImage})` }} />



      <div className="hero-dash-content">

        <h1 className="hero-dash-title">

          የ ቤሮ ደብረ ምህረት ቅድስት ስላሴ ወ ቅዱስ ላሊበላ

        </h1>

        <p className="hero-dash-subtitle-am">

          መስቀለ ብርሃን ስንበት ትምህርት ቤት

        </p>

        <p className="hero-dash-subtitle-en">

          {teacher.fullName ? `Welcome, ${teacher.fullName}` : 'Sacred Chant - Wisdom for your ministry'}

        </p>



        <div className="hero-dash-cards">

          {/* My Courses */}

          <div

            className="hero-dash-card"

            onClick={() => navigate('/teacher/courses')}

            role="button"

            tabIndex={0}

          >

            <div className="hero-dash-icon">

              <FiBook size={20} />

            </div>

            <div>

              <p className="hero-dash-card-value">{coursesCount}</p>

              <p className="hero-dash-card-label">My Courses</p>

            </div>

          </div>



          {/* Upcoming Practices */}

          <div

            className="hero-dash-card"

            onClick={() => navigate('/teacher/practices')}

            role="button"

            tabIndex={0}

          >

            <div className="hero-dash-icon">

              <FiCalendar size={20} />

            </div>

            <div>

              <p className="hero-dash-card-value">{upcomingPracticeCount || 0}</p>

              <p className="hero-dash-card-label">Upcoming Practices</p>

            </div>

          </div>



          {/* My Teaching Assignments */}

          <div className="hero-dash-list-card">

            <h3>My Teaching Assignments</h3>

            {assignments && assignments.length > 0 ? (

              <ul>

                {assignments.map((a) => (

                  <li key={a._id}>

                    {a.course?.name || 'Assigned Course'} – {a.class?.name || 'General Class'}

                  </li>

                ))}

              </ul>

            ) : (

              <p className="hero-dash-empty">No teaching assignments currently assigned.</p>

            )}

          </div>

        </div>

      </div>

    </div>

  );

};



export default TeacherDashboard; 