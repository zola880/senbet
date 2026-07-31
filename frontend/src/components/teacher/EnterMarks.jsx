import { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import EmptyState from '../common/EmptyState';

// 🌄 Background image shown before any assignment is selected
const BACKGROUND_IMAGE = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQUgBDixxPesefod7AUSte7eApcia7_n5VZUp6I16ar1XpdpE-6fIMwP6M&s';

const EnterMarks = () => {
  const { user } = useContext(AuthContext);

  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [students, setStudents] = useState([]);
  const [config, setConfig] = useState(null);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(false);
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

    // Fetch students and config in parallel
    Promise.all([
      api.get(`/api/v1/users?role=student&class=${classId}`),
      api.get(`/api/v1/assessment-configs/${classId}`).catch((err) => {
        if (err.response?.status === 404) return null; // config not found
        throw err;
      }),
    ])
      .then(([studentsRes, configRes]) => {
        setStudents(studentsRes.data.data);
        if (configRes && configRes.data) {
          setConfig(configRes.data.data);
        } else {
          setConfig(null);
          setError('No assessment configuration found for this class. Please ask the admin to set it up first.');
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load data. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [selectedAssignment, assignments]);

  // Handle score input change
  const handleScoreChange = (studentId, componentName, value) => {
    setScores((prev) => ({
      ...prev,
      [`${studentId}-${componentName}`]: value,
    }));
  };

  // Submit scores for a specific component
  const submitComponentScores = async (componentName) => {
    const assignment = assignments.find((a) => a._id === selectedAssignment);
    if (!assignment) return;

    const payload = {
      class: assignment.class._id,
      course: assignment.course._id,
      componentName,
      scores: [],
    };

    students.forEach((student) => {
      const key = `${student._id}-${componentName}`;
      const val = scores[key];
      if (val !== undefined && val !== '') {
        payload.scores.push({
          student: student._id,
          scoreObtained: Number(val),
          maxScore: config.components.find((c) => c.name === componentName)?.maxScore || 100,
        });
      }
    });

    if (payload.scores.length === 0) {
      alert('No scores entered for this component.');
      return;
    }

    try {
      await api.post('/api/v1/scores', payload);
      setSuccessMsg(`Scores for "${componentName}" saved successfully.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving scores.');
    }
  };

  // Get the selected assignment object
  const assignmentObj = assignments.find((a) => a._id === selectedAssignment);

  return (
    <div>
      <h2 className="page-title">Enter Marks</h2>

      {/* Assignment selector */}
      <div className="form-grid" style={{ marginBottom: '1rem' }}>
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
      {error && <div className="error-message">{error}</div>}
      {successMsg && <div className="success-message">{successMsg}</div>}

      {/* Background placeholder when no assignment selected */}
      {!selectedAssignment ? (
        <div
          className="selection-placeholder"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url('${BACKGROUND_IMAGE}')`,
          }}
        >
          <p>Please select a course and class to enter marks</p>
        </div>
      ) : (
        /* If config loaded and students present, show table */
        config && students.length > 0 && !loading && (
          <div className="table-container" style={{ marginTop: '1rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  {config.components.map((comp) => (
                    <th key={comp.name}>
                      {comp.name} <br />
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
                          value={scores[`${student._id}-${comp.name}`] || ''}
                          onChange={(e) =>
                            handleScoreChange(student._id, comp.name, e.target.value)
                          }
                          style={{
                            width: '80px',
                            padding: '0.4rem',
                            borderRadius: '6px',
                            border: '1px solid #ccc',
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Save buttons */}
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              {config.components.map((comp) => (
                <button
                  key={comp.name}
                  className="btn btn-primary"
                  onClick={() => submitComponentScores(comp.name)}
                >
                  Save {comp.name}
                </button>
              ))}
            </div>
          </div>
        )
      )}

      {/* Fallback if no students or config */}
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