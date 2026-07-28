import { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import EmptyState from '../common/EmptyState';

const MyMarks = () => {
  const { user } = useContext(AuthContext);
  const [scores, setScores] = useState([]);
  const [config, setConfig] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?._id) return;

    const fetchData = async () => {
      try {
        // Fetch student scores
        const scoresRes = await api.get(`/api/v1/scores?student=${user._id}`);
        const rawScores = scoresRes.data.data;
        setScores(rawScores);

        // If student has a class, fetch the assessment config for that class
        if (user.class?._id || user.class) {
          const classId = user.class?._id || user.class;
          try {
            const configRes = await api.get(`/api/v1/assessment-configs/${classId}`);
            setConfig(configRes.data.data);
          } catch (err) {
            // Config not found – that's fine, we'll just show raw scores
            setConfig(null);
          }
        }

        // Fetch list of courses to display course names
        const coursesRes = await api.get('/api/v1/courses');
        setCourses(coursesRes.data.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load marks.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Group scores by course ID
  const scoresByCourse = {};
  scores.forEach((score) => {
    const courseId = score.course?._id || score.course;
    if (!courseId) return;
    if (!scoresByCourse[courseId]) {
      scoresByCourse[courseId] = {
        courseId,
        courseName: score.course?.name || 'Unknown Course',
        components: [],
      };
    }
    scoresByCourse[courseId].components.push(score);
  });

  // Compute course totals if config available
  const computeCourseTotal = (courseId, components) => {
    if (!config) return null;
    // Build a map of componentName -> score object
    const componentMap = {};
    components.forEach((sc) => {
      componentMap[sc.componentName] = sc;
    });
    let total = 0;
    config.components.forEach((comp) => {
      const sc = componentMap[comp.name];
      if (sc) {
        const percentage = (sc.scoreObtained / sc.maxScore) * 100;
        total += (percentage * comp.weightage) / 100;
      }
    });
    return total.toFixed(2);
  };

  if (loading) return <div className="spinner" />;
  if (error) return <div className="error-message">{error}</div>;

  const courseIds = Object.keys(scoresByCourse);

  return (
    <div>
      <h2 className="page-title">My Marks</h2>

      {courseIds.length === 0 ? (
        <EmptyState message="No marks have been entered yet." />
      ) : (
        <div className="marks-grid">
          {courseIds.map((courseId) => {
            const courseData = scoresByCourse[courseId];
            const total = computeCourseTotal(courseId, courseData.components);
            return (
              <div key={courseId} className="card">
                <h3>{courseData.courseName}</h3>
                {total !== null && (
                  <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                    Course Total: {total}%
                  </p>
                )}
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyMarks;