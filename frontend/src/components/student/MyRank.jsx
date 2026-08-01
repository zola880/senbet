import { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import { FiAward, FiBookOpen, FiTrendingUp } from 'react-icons/fi';
import EmptyState from '../common/EmptyState';

/* Subtle cross watermark */
const CROSS_WATERMARK = (
  <svg
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      position: 'absolute',
      top: '50%',
      left: '55%',
      transform: 'translate(-50%, -50%)',
      width: '300px',
      height: '300px',
      opacity: 0.05,
      pointerEvents: 'none',
    }}
  >
    <rect x="90" y="10" width="20" height="180" rx="4" fill="black" />
    <rect x="30" y="80" width="140" height="20" rx="4" fill="black" />
    <circle cx="100" cy="90" r="18" fill="white" />
    <circle cx="100" cy="90" r="12" fill="black" />
    <circle cx="100" cy="20" r="8" fill="black" />
    <circle cx="100" cy="180" r="8" fill="black" />
    <circle cx="40" cy="90" r="8" fill="black" />
    <circle cx="160" cy="90" r="8" fill="black" />
  </svg>
);

const MyRank = () => {
  const { user } = useContext(AuthContext);
  const [rankData, setRankData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Fetch ranking data
  useEffect(() => {
    if (!user?._id) return;
    api.get(`/api/v1/rankings/student/${user._id}`)
      .then(res => setRankData(res.data.data))
      .catch(err => {
        console.error(err);
        if (err.response?.status === 404) {
          setError('No ranking data yet. Your teacher may not have entered marks.');
        } else {
          setError('Could not load your rank.');
        }
      })
      .finally(() => setLoading(false));
  }, [user._id]);

  // 2. Fetch course names if missing from breakdown (always called, but guarded inside)
  useEffect(() => {
    if (!rankData || !rankData.courseBreakdown) return;

    const courseArray = Object.entries(rankData.courseBreakdown).map(([courseId, details]) => ({
      courseId,
      courseName: details.courseName || 'Course',
      total: details.courseTotal || 0,
    }));

    const needsNames = courseArray.some(c => !c.courseName || c.courseName === 'Course');
    if (!needsNames) return;

    api.get('/api/v1/courses')
      .then(res => {
        const allCourses = res.data.data;
        setRankData(prev => {
          if (!prev) return prev;
          const updatedBreakdown = { ...prev.courseBreakdown };
          Object.entries(updatedBreakdown).forEach(([cid, details]) => {
            const course = allCourses.find(c => c._id === cid);
            if (course) {
              updatedBreakdown[cid] = { ...details, courseName: course.name };
            }
          });
          return { ...prev, courseBreakdown: updatedBreakdown };
        });
      })
      .catch(console.error);
  }, [rankData]);

  // After all hooks – render logic
  if (loading) return <div className="spinner" />;
  if (error) return <div className="error-message">{error}</div>;
  if (!rankData) return <EmptyState message="No ranking available." />;

  const { rank, overallTotal, courseBreakdown } = rankData;

  // Build course array for display
  const courseArray = courseBreakdown
    ? Object.entries(courseBreakdown).map(([courseId, details]) => ({
        courseId,
        courseName: details.courseName || 'Course',
        total: details.courseTotal || 0,
      }))
    : [];

  const rankColorClass = rank <= 1 ? 'rank-1' : rank <= 2 ? 'rank-2' : rank <= 3 ? 'rank-3' : '';

  return (
    <div style={{
      position: 'relative',
      minHeight: '80vh',
      background: '#fcf9f2',
      borderRadius: 'var(--radius)',
      padding: '2rem',
      overflow: 'hidden',
    }}>
      {CROSS_WATERMARK}

      <div style={{ position: 'relative', zIndex: 1 }}>
        <h2 className="page-title">My Rank</h2>

        {/* Hero Rank Card */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '2.5rem',
          padding: '2rem',
          background: 'linear-gradient(135deg, #ffffff, #fef7f2)',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          border: '1px solid rgba(212,160,23,0.3)',
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            border: '6px solid var(--secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            background: 'white',
            boxShadow: '0 0 30px rgba(212,160,23,0.3)',
          }}>
            <span style={{
              fontSize: '3rem',
              fontWeight: '700',
              color: rank <= 3 ? (rank === 1 ? 'gold' : rank === 2 ? 'silver' : '#cd7f32') : 'var(--secondary)',
              lineHeight: 1,
            }}>
              {rank}
            </span>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: '600', color: 'var(--primary-dark)', marginBottom: '0.3rem' }}>
            Your Overall Rank
          </h3>
          <p style={{ color: 'var(--text-light)', fontSize: '1rem' }}>
            Total Score: {overallTotal?.toFixed(2) ?? '—'}
          </p>
        </div>

        {/* Course Breakdown */}
        {courseArray.length > 0 && (
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-dark)' }}>
              <FiBookOpen style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              Course Breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {courseArray.map((course, idx) => (
                <div key={course.courseId || idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text)' }}>{course.courseName}</span>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{course.total?.toFixed(1)}%</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '12px',
                    background: '#f0e6d2',
                    borderRadius: '6px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${Math.min(course.total, 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--secondary), var(--primary))',
                      borderRadius: '6px',
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Motivational message */}
        <div style={{
          textAlign: 'center',
          padding: '1rem',
          color: 'var(--text-light)',
          fontStyle: 'italic',
          borderTop: '1px solid var(--border)',
          marginTop: '1rem',
        }}>
          <FiTrendingUp style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
          {rank <= 3
            ? 'Excellent work! Keep striving for excellence.'
            : 'Every step is progress. Keep learning and growing!'}
        </div>
      </div>
    </div>
  );
};

export default MyRank;