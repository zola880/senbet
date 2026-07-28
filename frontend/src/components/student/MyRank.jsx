import { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import AuthContext from '../../context/AuthContext';

const MyRank = () => {
  const { user } = useContext(AuthContext);
  const [rankData, setRankData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?._id) return;
    setLoading(true);
    api.get(`/api/v1/rankings/student/${user._id}`)
      .then((res) => setRankData(res.data.data))
      .catch((err) => {
        console.error(err);
        if (err.response?.status === 404) {
          setError('No ranking data yet. Your teacher may not have entered marks.');
        } else {
          setError('Could not load your rank.');
        }
      })
      .finally(() => setLoading(false));
  }, [user._id]);

  if (loading) return <div className="spinner" />;
  if (error) return <div className="error-message">{error}</div>;
  if (!rankData) return <div className="error-message">No ranking available.</div>;

  return (
    <div>
      <h2 className="page-title">My Rank</h2>
      <div className="card">
        <h3>
          Overall Rank:{' '}
          <span className={`rank-badge ${rankData.rank <= 3 ? `rank-${rankData.rank}` : ''}`}>
            {rankData.rank}
          </span>
        </h3>
        <p>Total Score: {rankData.overallTotal?.toFixed(2)}</p>
        {rankData.courseBreakdown && Object.keys(rankData.courseBreakdown).length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h4>Course Breakdown</h4>
            <ul>
              {Object.entries(rankData.courseBreakdown).map(([courseId, details]) => (
                <li key={courseId}>
                  {/* The course name isn't included directly; we could fetch it, but for simplicity show course ID */}
                  Course Total: {details.courseTotal?.toFixed(2) ?? '—'}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRank;