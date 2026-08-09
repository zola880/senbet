import { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import EmptyState from '../common/EmptyState';
import L from '../../assets/L.png';          // background image
import './EnterMarks.css';

const EnterMarks = () => {
  const { user } = useContext(AuthContext);

  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [students, setStudents] = useState([]);
  const [config, setConfig] = useState(null);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState({});
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Fetch teacher's assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await api.get(`/api/v1/assignments/teacher/${user._id}`);
        setAssignments(res.data.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load assignments.');
      }
    };
    fetchAssignments();
  }, [user._id]);

  // 2. When assignment is selected, fetch students & assessment config
  useEffect(() => {
    if (!selectedAssignment) {
      setStudents([]);
      setConfig(null);
      return;
    }

    const assignment = assignments.find((a) => a._id === selectedAssignment);
    if (!assignment) return;

    const classId = assignment.class._id;
    setLoading(true);
    setError('');
    setSuccessMsg('');
    setScores({});

    Promise.all([
      api.get(`/api/v1/users?role=student&class=${classId}`),
      api.get(`/api/v1/assessment-configs/${classId}`).catch((err) => {
        if (err.response?.status === 404) return null;
        throw err;
      }),
    ])
      .then(([studentsRes, configRes]) => {
        setStudents(studentsRes.data.data);
        if (configRes && configRes.data) {
          setConfig(configRes.data.data);
        } else {
          setConfig(null);
          setError(
            'No assessment configuration found for this class. Please ask the admin to set it up first.'
          );
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load class data. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [selectedAssignment, assignments]);

  // Handle score input change
  const handleScoreChange = (studentId, componentName, value) => {
    const key = `${studentId}-${componentName}`;
    setScores((prev) => ({ ...prev, [key]: value }));
  };

  // Submit scores for a specific component
  const submitComponentScores = async (componentName) => {
    const assignment = assignments.find((a) => a._id === selectedAssignment);
    if (!assignment || !config) return;

    const component = config.components.find((c) => c.name === componentName);
    if (!component) return;

    const payload = {
      class: assignment.class._id,
      course: assignment.course._id,
      componentName,
      scores: [],
    };

    students.forEach((student) => {
      const key = `${student._id}-${componentName}`;
      const rawValue = scores[key];
      if (rawValue !== undefined && rawValue.trim() !== '') {
        const numeric = parseFloat(rawValue);
        if (!isNaN(numeric) && numeric >= 0 && numeric <= component.maxScore) {
          payload.scores.push({
            student: student._id,
            scoreObtained: numeric,
            maxScore: component.maxScore,
          });
        }
      }
    });

    if (payload.scores.length === 0) {
      setError(`No valid scores entered for "${componentName}".`);
      return;
    }

    setSubmitting((prev) => ({ ...prev, [componentName]: true }));
    setError('');
    setSuccessMsg('');

    try {
      await api.post('/api/v1/scores', payload);
      setSuccessMsg(`Scores for "${componentName}" saved successfully.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Failed to save scores for "${componentName}".`
      );
    } finally {
      setSubmitting((prev) => ({ ...prev, [componentName]: false }));
    }
  };

  return (
    <div className="enter-marks">
      <h2 className="page-title">Enter Marks</h2>

      {/* Assignment selector */}
      <div className="form-group">
        <select
          value={selectedAssignment}
          onChange={(e) => setSelectedAssignment(e.target.value)}
        >
          <option value="">-- Select Course / Class --</option>
          {assignments.map((a) => (
            <option key={a._id} value={a._id}>
              {a.course?.name} - {a.class?.name}
            </option>
          ))}
        </select>
      </div>

      {/* Messages */}
      {loading && <div className="spinner" />}
      {error && <div className="message message--error">{error}</div>}
      {successMsg && (
        <div className="message message--success">{successMsg}</div>
      )}

      {/* Placeholder when no assignment is selected */}
      {!selectedAssignment && (
        <div
          className="selection-placeholder"
          style={{ backgroundImage: `url(${L})` }}
        >
          <p>Please select a course and class to enter marks</p>
        </div>
      )}

      {/* Data table */}
      {selectedAssignment && config && students.length > 0 && !loading && (
        <div className="marks-table-container">
          <table className="marks-table">
            <thead>
              <tr>
                <th>Student</th>
                {config.components.map((comp) => (
                  <th key={comp.name}>
                    {comp.name}
                    <br />
                    <small>(max {comp.maxScore})</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student._id}>
                  <td>{student.fullName}</td>
                  {config.components.map((comp) => (
                    <td key={comp.name}>
                      <input
                        type="number"
                        min="0"
                        max={comp.maxScore}
                        step="any"
                        className="score-input"
                        value={
                          scores[`${student._id}-${comp.name}`] || ''
                        }
                        onChange={(e) =>
                          handleScoreChange(
                            student._id,
                            comp.name,
                            e.target.value
                          )
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Save buttons per component */}
          <div className="save-buttons">
            {config.components.map((comp) => (
              <button
                key={comp.name}
                className="btn btn-primary"
                onClick={() => submitComponentScores(comp.name)}
                disabled={submitting[comp.name]}
              >
                {submitting[comp.name]
                  ? 'Saving...'
                  : `Save ${comp.name}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty states */}
      {!loading && selectedAssignment && !config && !error && (
        <EmptyState message="Set up assessment configuration for this class before entering marks." />
      )}

      {!loading && selectedAssignment && config && students.length === 0 && (
        <EmptyState message="No students found in this class." />
      )}
    </div>
  );
};

export default EnterMarks;