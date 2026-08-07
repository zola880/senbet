import { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import EmptyState from '../common/EmptyState';
import './MyMarks.css';

const MyMarks = () => {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [scores, setScores] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch courses assigned to the student's class
  useEffect(() => {
    if (!user?.class?._id) return;
    api.get(`/api/v1/assignments?class=${user.class._id}`)
      .then(res => {
        const assignments = res.data.data;
        const uniqueCourses = [];
        const seen = new Set();
        assignments.forEach(a => {
          if (!seen.has(a.course._id)) {
            uniqueCourses.push(a.course);
            seen.add(a.course._id);
          }
        });
        setCourses(uniqueCourses);
      })
      .catch(err => console.error(err));
  }, [user]);

  // Fetch scores and config when a course is selected
  useEffect(() => {
    if (!selectedCourse || !user?._id) {
      setScores([]);
      return;
    }

    setLoading(true);
    setError('');

    // Fetch scores for this student and course
    const scoresPromise = api.get(`/api/v1/scores?student=${user._id}&course=${selectedCourse}`);

    // Fetch assessment config for the student's class (to get component structure)
    const configPromise = user.class?._id
      ? api.get(`/api/v1/assessment-configs/${user.class._id}`).catch(() => null)
      : Promise.resolve(null);

    Promise.all([scoresPromise, configPromise])
      .then(([scoresRes, configRes]) => {
        setScores(scoresRes.data.data);
        if (configRes && configRes.data) {
          setConfig(configRes.data.data);
        } else {
          setConfig(null);
        }
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load marks.');
      })
      .finally(() => setLoading(false));
  }, [selectedCourse, user]);

  // Group scores by component name (for the table)
  const groupedScores = {};
  scores.forEach(sc => {
    if (!groupedScores[sc.componentName]) {
      groupedScores[sc.componentName] = {
        componentName: sc.componentName,
        scoreObtained: sc.scoreObtained,
        maxScore: sc.maxScore,
      };
    } else {
      // If multiple entries for same component (shouldn't happen, but just in case)
      groupedScores[sc.componentName].scoreObtained += sc.scoreObtained;
    }
  });

  // Build table rows based on config components, or raw if no config
  const tableRows = [];
  if (config) {
    // Use the config's component order
    config.components.forEach(comp => {
      const scoreData = groupedScores[comp.name];
      tableRows.push({
        component: comp.name,
        score: scoreData ? scoreData.scoreObtained : '-',
        max: scoreData ? scoreData.maxScore : comp.maxScore,
        percentage: scoreData
          ? ((scoreData.scoreObtained / scoreData.maxScore) * 100).toFixed(1) + '%'
          : '-',
      });
    });
  } else {
    // No config – just show raw scores
    Object.values(groupedScores).forEach(scoreData => {
      tableRows.push({
        component: scoreData.componentName,
        score: scoreData.scoreObtained,
        max: scoreData.maxScore,
        percentage: ((scoreData.scoreObtained / scoreData.maxScore) * 100).toFixed(1) + '%',
      });
    });
  }

  return (
    <div>
      <h2 className="page-title">My Marks</h2>

      {/* Course selector */}
      <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
        <select
          value={selectedCourse}
          onChange={e => setSelectedCourse(e.target.value)}
        >
          <option value="">-- Select a Course --</option>
          {courses.map(c => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading && <div className="spinner" />}
      {error && <div className="error-message">{error}</div>}

      {!loading && selectedCourse && tableRows.length === 0 && !error && (
        <EmptyState message="No marks recorded for this course yet." />
      )}

      {!loading && selectedCourse && tableRows.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Component</th>
                <th>Score</th>
                <th>Max</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.component}</td>
                  <td>{row.score}</td>
                  <td>{row.max}</td>
                  <td>{row.percentage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyMarks;