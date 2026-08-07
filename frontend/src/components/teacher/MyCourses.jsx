import { useState, useEffect, useContext } from 'react';
import { FiBook, FiUsers, FiAlertCircle, FiLoader, FiChevronRight } from 'react-icons/fi';

import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import './MyCourses.css';

const MyCourses = () => {
  const { user } = useContext(AuthContext);
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?._id) return;

    let isMounted = true;

    const fetchAssignments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get(`/api/v1/assignments/teacher/${user._id}`);

        if (isMounted) {
          setAssignments(response.data?.data || []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch assignments:', err);
          setError('Unable to load your courses at this time. Please try again later.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchAssignments();

    return () => {
      isMounted = false;
    };
  }, [user?._id]);

  return (
    <section className="my-courses-page">
      <header className="my-courses-header">
        <h1 className="my-courses-title">My Courses</h1>
        <p className="my-courses-subtitle">
          Manage and view the classes and courses you are currently teaching.
        </p>
      </header>

      <div className="my-courses-content">
        {isLoading ? (
          <div className="my-courses-state my-courses-loading" role="status">
            <FiLoader className="spin-icon" size={28} />
            <span>Loading your courses...</span>
          </div>
        ) : error ? (
          <div className="my-courses-state my-courses-error" role="alert">
            <FiAlertCircle size={28} />
            <span>{error}</span>
          </div>
        ) : assignments.length === 0 ? (
          <div className="my-courses-state my-courses-empty">
            <FiBook size={48} strokeWidth={1.5} />
            <h3>No Courses Assigned</h3>
            <p>You don't have any teaching assignments at the moment.</p>
          </div>
        ) : (
          <div className="my-courses-table-wrapper">
            <table className="my-courses-table">
              <thead>
                <tr>
                  <th scope="col">Course Name</th>
                  <th scope="col">Assigned Class</th>
                  <th scope="col" className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment._id}>
                    <td data-label="Course">
                      <div className="course-cell">
                        <div className="course-icon" aria-hidden="true">
                          <FiBook size={18} />
                        </div>
                        <div className="course-info">
                          <span className="course-name">
                            {assignment.course?.name || 'Unnamed Course'}
                          </span>
                          <span className="course-meta">
                            ID: {assignment.course?._id?.slice(-6).toUpperCase() || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Class">
                      <div className="class-cell">
                        <div className="class-icon" aria-hidden="true">
                          <FiUsers size={18} />
                        </div>
                        <span className="class-name">
                          {assignment.class?.name || 'General Class'}
                        </span>
                      </div>
                    </td>
                    <td data-label="Actions" className="text-right">
                      <button className="btn-view-details" type="button">
                        View Details <FiChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default MyCourses;