import { useState, useEffect } from 'react';
import { FaGraduationCap, FaTrophy, FaUserCircle, FaChartBar, FaCross } from 'react-icons/fa';
import api from '../../services/api';
import EmptyState from '../common/EmptyState';

// 🌄 Hero image used elsewhere in the app — kept here in case you want it
// as a fallback/empty-state background. Not required for this design.
// import heroImage from '../../assets/c.jpg';

const FullRanking = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/v1/classes')
      .then((res) => setClasses(res.data.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setRanking([]);
      return;
    }

    setLoading(true);
    setError('');

    api.get(`/api/v1/rankings/class/${selectedClass}`)
      .then((res) => {
        setRanking(res.data.data);
        if (res.data.data.length === 0) {
          setError('No ranking data available. Ensure students have scores and an assessment config is set for this class.');
        }
      })
      .catch((err) => {
        console.error(err);
        if (err.response?.status === 400) {
          setError('Assessment configuration is missing for this class. Please set it up first.');
        } else {
          setError('Failed to load ranking data.');
        }
      })
      .finally(() => setLoading(false));
  }, [selectedClass]);

  const topThree = ranking.slice(0, 3);

  return (
    <div className="rank-page">
      <div className="rank-page-header">
        <div>
          <h2 className="page-title">Class Ranking</h2>
          <p className="rank-page-subtitle">View overall ranking of students in the selected class.</p>
        </div>
        <div className="rank-welcome">
          <span>
            Welcome back,
            <br />
            <strong>Admin</strong>
          </span>
          <div className="rank-welcome-avatar">
            <FaCross />
          </div>
        </div>
      </div>

      <div className="rank-select-card">
        <div className="rank-select-icon">
          <FaGraduationCap />
        </div>
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
          <option value="">Select Class</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      {!selectedClass ? (
        <EmptyState message="Please choose a class to view the ranking." />
      ) : (
        <>
          {loading && <div className="spinner" />}
          {error && !loading && <div className="error-message">{error}</div>}

          {!loading && ranking.length > 0 && (
            <>
              <div className="rank-top-row">
                <div className="rank-top-intro">
                  <div className="rank-top-icon">
                    <FaTrophy />
                  </div>
                  <h4>Top Performers</h4>
                  <p>in Selected Class</p>
                </div>

                {topThree.map((student, idx) => (
                  <div key={student.studentId} className={`rank-podium-card rank-podium-${idx + 1}`}>
                    <span className={`rank-podium-badge badge-${idx + 1}`}>{idx + 1}</span>
                    <div className="rank-podium-avatar">
                      <FaUserCircle />
                    </div>
                    <h5>{student.fullName}</h5>
                    <p>Total Score: {student.overallTotal?.toFixed(0) ?? '—'}</p>
                    <div className="rank-podium-bar" />
                  </div>
                ))}
              </div>

              <div className="rank-full-card">
                <div className="rank-full-header">
                  <div className="rank-full-icon">
                    <FaChartBar />
                  </div>
                  <h3>Full Ranking</h3>
                </div>
                <div className="table-container rank-table-container">
                  <table className="rank-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Student Name</th>
                        <th>Role Number</th>
                        <th>Total Score</th>
                        <th>Average (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranking.map((student) => (
                        <tr key={student.studentId}>
                          <td>
                            <span className={`rank-badge ${student.rank <= 3 ? `rank-${student.rank}` : ''}`}>
                              {student.rank}
                            </span>
                          </td>
                          <td>
                            <span className="rank-table-student">
                              <FaUserCircle className="rank-table-avatar" />
                              {student.fullName}
                            </span>
                          </td>
                          <td>{student.rollNumber || '—'}</td>
                          <td>{student.overallTotal?.toFixed(0) ?? '—'}</td>
                          {/*
                            NOTE: the ranking API you shared only returns
                            `overallTotal`, not a percentage. If your API
                            adds a field like `averagePercentage`, swap the
                            line below to use it — for now it falls back to
                            "—" when it isn't present.
                          */}
                          <td>{student.averagePercentage != null ? `${student.averagePercentage.toFixed(1)}%` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {!loading && !error && ranking.length === 0 && selectedClass && (
            <EmptyState message="No students or scores found for this class. Enter marks first." />
          )}

          <p className="rank-footer-text">
            <span className="rank-footer-cross">✝</span> Glory to God for all things
          </p>
        </>
      )}
    </div>
  );
};

export default FullRanking;