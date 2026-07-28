import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiArrowLeft, FiUser, FiBook, FiAward, FiMail, FiHash } from 'react-icons/fi';
import EmptyState from '../common/EmptyState';

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [scores, setScores] = useState([]);
  const [rankData, setRankData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const [studentRes, scoresRes, rankRes] = await Promise.all([
          api.get(`/api/v1/users/${id}`),
          api.get(`/api/v1/scores?student=${id}`),
          api.get(`/api/v1/rankings/student/${id}`).catch(() => null), // ranking may not exist
        ]);

        setStudent(studentRes.data.data);
        setScores(scoresRes.data.data);

        if (rankRes && rankRes.data) {
          setRankData(rankRes.data.data);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load student details.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [id]);

  // Group scores by course
  const scoresByCourse = scores.reduce((acc, score) => {
    const courseId = score.course?._id || 'unknown';
    if (!acc[courseId]) {
      acc[courseId] = {
        courseName: score.course?.name || 'Unknown Course',
        components: [],
      };
    }
    acc[courseId].components.push(score);
    return acc;
  }, {});

  if (loading) return <div className="spinner" />;
  if (error) return <div className="error-message">{error}</div>;
  if (!student) return <div className="error-message">Student not found.</div>;

  return (
    <div>
      <button
        className="btn btn-secondary"
        onClick={() => navigate('/admin/users')}
        style={{ marginBottom: '1rem' }}
      >
        <FiArrowLeft /> Back to Users
      </button>

      {/* Student Header Card */}
      <div className="student-header-card">
        <div className="student-avatar">
          <FiUser size={48} />
        </div>
        <div className="student-header-info">
          <h2>{student.fullName}</h2>
          <p className="student-class">
            {student.class?.name || 'No class assigned'}
            {student.rollNumber && ` · Roll No: ${student.rollNumber}`}
          </p>
          <p className="student-email">
            <FiMail style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
            {student.email}
          </p>
        </div>
      </div>

      {/* Rank Card (if available) */}
      {rankData && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3><FiAward /> Current Rank</h3>
          <div className="rank-display">
            <span className={`rank-badge ${rankData.rank <= 3 ? `rank-${rankData.rank}` : ''}`}>
              {rankData.rank}
            </span>
            <span className="rank-total">
              Total Score: {rankData.overallTotal?.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Marks Summary */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3><FiBook /> Marks Summary</h3>
        {Object.keys(scoresByCourse).length === 0 ? (
          <EmptyState message="No marks recorded yet." />
        ) : (
          <div className="marks-summary-grid">
            {Object.entries(scoresByCourse).map(([courseId, courseData]) => (
              <div key={courseId} className="marks-course-card">
                <h4>{courseData.courseName}</h4>
                <table className="mini-table">
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Score</th>
                      <th>Max</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseData.components.map((sc) => (
                      <tr key={sc._id}>
                        <td>{sc.componentName}</td>
                        <td>{sc.scoreObtained}</td>
                        <td>{sc.maxScore}</td>
                        <td>{((sc.scoreObtained / sc.maxScore) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDetail;