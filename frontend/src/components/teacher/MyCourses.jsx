import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiArrowRight,
  FiBook,
  FiBookOpen,
  FiInbox,
  FiUsers,
} from 'react-icons/fi';

import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import bgImage from '../../assets/L.png';
import './MyCourses.css';

/**
 * Route opened when a teacher taps "Manage" on a course card.
 * TODO: point this to your real course-management screen.
 */
const buildManageRoute = (assignment) =>
  `/teacher/courses/${assignment?.course?._id || assignment?._id}`;

const MyCourses = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const teacherId = user?._id;

  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!teacherId) {
      setIsLoading(false);
      return undefined;
    }

    let isMounted = true;

    const loadAssignments = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await api.get(`/api/v1/assignments/teacher/${teacherId}`);
        const payload = response?.data?.data;

        if (isMounted) {
          setAssignments(Array.isArray(payload) ? payload : []);
        }
      } catch (requestError) {
        console.error('Failed to load teacher courses:', requestError);
        if (isMounted) {
          setError('We could not load your courses. Please try again.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadAssignments();

    return () => {
      isMounted = false;
    };
  }, [teacherId]);

  const handleManage = (assignment) => navigate(buildManageRoute(assignment));

  return (
    <section className="mc-page">
      {/* Background photo (imported from src/assets/L.png) */}
      <div
        className="mc-bg"
        style={{ backgroundImage: `url(${bgImage})` }}
        aria-hidden="true"
      />
      <div className="mc-overlay" aria-hidden="true" />

      <header className="mc-header">
        <div>
          <h1 className="mc-title">My Courses</h1>
          <p className="mc-subtitle">
            Courses and classes assigned to you for this term.
          </p>
        </div>

        {!isLoading && !error && assignments.length > 0 && (
          <span className="mc-count-badge">
            <FiBookOpen size={16} aria-hidden="true" />
            {assignments.length} {assignments.length === 1 ? 'Course' : 'Courses'}
          </span>
        )}
      </header>

      {isLoading ? (
        <div className="mc-state" role="status" aria-live="polite">
          <span className="mc-spinner" aria-hidden="true" />
          <p>Loading your courses…</p>
        </div>
      ) : error ? (
        <div className="mc-state mc-state--error" role="alert">
          <FiAlertTriangle size={30} aria-hidden="true" />
          <h3>Something went wrong</h3>
          <p>{error}</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="mc-state">
          <FiInbox size={32} aria-hidden="true" />
          <h3>No courses assigned yet</h3>
          <p>You have no teaching assignments at the moment.</p>
        </div>
      ) : (
        <div className="mc-grid">
          {assignments.map((assignment) => {
            const courseName = assignment.course?.name || 'Unnamed Course';
            const className = assignment.class?.name || 'General Class';

            return (
              <article className="mc-card" key={assignment._id}>
                <div className="mc-card-head">
                  <span className="mc-card-icon" aria-hidden="true">
                    <FiBook size={20} />
                  </span>
                  <span className="mc-card-chip" title={className}>
                    <FiUsers size={13} aria-hidden="true" />
                    {className}
                  </span>
                </div>

                <h2 className="mc-card-title" title={courseName}>
                  {courseName}
                </h2>

                <div className="mc-card-footer">
                  <span className="mc-card-hint">Tap to manage</span>
                  <button
                    type="button"
                    className="mc-card-btn"
                    onClick={() => handleManage(assignment)}
                  >
                    Manage <FiArrowRight size={15} aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default MyCourses;