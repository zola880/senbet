import { useState, useEffect } from 'react';
import api from '../../services/api';
import EmptyState from '../common/EmptyState';

// 🌄 Replace this URL with your own image
const BACKGROUND_IMAGE = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkwpjvGXir0uK3CkxmmOqt18Sy4NHipO-FIDY3IxHjsA&s=10';

const EnterScores = () => {
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState([]);
  const [config, setConfig] = useState(null);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    api.get('/api/v1/classes').then((r) => setClasses(r.data.data));
    api.get('/api/v1/courses').then((r) => setCourses(r.data.data));
  }, []);

  useEffect(() => {
    if (!selectedClass || !selectedCourse) {
      setStudents([]);
      setConfig(null);
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    Promise.all([
      api.get(`/api/v1/users?role=student&class=${selectedClass}`),
      api.get(`/api/v1/assessment-configs/${selectedClass}`).catch((err) => {
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
          setError('No assessment configuration found for this class. Please configure it first.');
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load data.');
      })
      .finally(() => setLoading(false));
  }, [selectedClass, selectedCourse]);

  const handleScoreChange = (studentId, componentName, value) => {
    setScores((prev) => ({
      ...prev,
      [`${studentId}-${componentName}`]: value,
    }));
  };

  const submitComponentScores = async (componentName) => {
    const payload = {
      class: selectedClass,
      course: selectedCourse,
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
      setSuccessMsg(`Scores for "${componentName}" saved.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving scores.');
    }
  };

  return (
    <div>
      <h2 className="page-title">Enter Scores (Admin)</h2>

      <div className="form-grid" style={{ marginBottom: '1rem' }}>
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
          <option value="">Select Class</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
          <option value="">Select Course</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      { (!selectedClass || !selectedCourse) ? (
        <div
          className="selection-placeholder"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url('${BACKGROUND_IMAGE}')`,
          }}
        >
          <p>Please select a class and course to enter scores</p>
        </div>
      ) : (
        <>
          {loading && <div className="spinner" />}
          {error && <div className="error-message">{error}</div>}
          {successMsg && <div className="success-message">{successMsg}</div>}

          {config && students.length > 0 && !loading && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    {config.components.map((comp) => (
                      <th key={comp.name}>{comp.name}<br/><small>(max {comp.maxScore})</small></th>
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
                            onChange={(e) => handleScoreChange(student._id, comp.name, e.target.value)}
                            style={{ width: '80px' }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
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
          )}

          {!loading && !config && selectedClass && selectedCourse && !error && (
            <EmptyState message="Set up assessment configuration for this class before entering marks." />
          )}

          {!loading && config && students.length === 0 && (
            <EmptyState message="No students in this class." />
          )}
        </>
      )}
    </div>
  );
};

export default EnterScores;