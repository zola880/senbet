import { useState, useEffect } from 'react';
import { FaUsers, FaBookOpen, FaClipboardCheck, FaUserGraduate, FaCheckSquare } from 'react-icons/fa';
import api from '../../services/api';
import EmptyState from '../common/EmptyState';

// 🌄 Hero image for the "no selection yet" state — drop your file at src/assets/c.jpg
import heroImage from '../../assets/c.jpg';

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

  // Stats for the summary row
  const [totalStudents, setTotalStudents] = useState(0);
  const [scoresToday, setScoresToday] = useState(0);

  useEffect(() => {
    api.get('/api/v1/classes').then((r) => setClasses(r.data.data));
    api.get('/api/v1/courses').then((r) => setCourses(r.data.data));

    // Total students across the school, for the stats row.
    api
      .get('/api/v1/users?role=student')
      .then((r) => setTotalStudents(r.data.data.length))
      .catch(() => setTotalStudents(0));

    // NOTE: there's no dedicated "scores entered today" endpoint in the
    // code you shared, so this is left at 0 for now. If you have (or add)
    // an endpoint like /api/v1/scores?enteredToday=true, wire it up here.
    setScoresToday(0);
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

  const hasSelection = selectedClass && selectedCourse;

  return (
    <div>
      <div className="enter-scores-header">
        <h2 className="page-title">Enter Scores (Admin)</h2>
        <p className="enter-scores-subtitle">Select class and course to manage student scores</p>
      </div>

      <div className="enter-scores-select-grid">
        <div className="enter-scores-select-card">
          <div className="enter-scores-select-icon icon-class">
            <FaUsers />
          </div>
          <div className="enter-scores-select-body">
            <label>Select Class</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="">Choose a class</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="enter-scores-select-card">
          <div className="enter-scores-select-icon icon-course">
            <FaBookOpen />
          </div>
          <div className="enter-scores-select-body">
            <label>Select Course</label>
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
              <option value="">Choose a course</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!hasSelection ? (
        <>
          <div className="enter-scores-hero">
            <div
              className="enter-scores-hero-image"
              style={{ backgroundImage: `url(${heroImage})` }}
            />
            <div className="enter-scores-hero-content">
              <div className="enter-scores-hero-icon">
                <FaClipboardCheck />
              </div>
              <h3>Ready to Enter Scores</h3>
              <p>
                Please select a class and course from the dropdowns above to view students and
                enter their scores.
              </p>
              <div className="enter-scores-quote">
                <span className="enter-scores-quote-mark">&ldquo;</span>
                <p>
                  Train up a child in the way he should go, and when he is old, he will not
                  depart from it.
                </p>
                <span className="enter-scores-quote-author">– Proverbs 22:6</span>
              </div>
            </div>
          </div>

          <div className="enter-scores-stats-row">
            <div className="enter-scores-stat-card">
              <div className="enter-scores-stat-icon stat-classes">
                <FaUsers />
              </div>
              <div>
                <h4>{classes.length}</h4>
                <p>Total Classes</p>
              </div>
            </div>
            <div className="enter-scores-stat-card">
              <div className="enter-scores-stat-icon stat-courses">
                <FaBookOpen />
              </div>
              <div>
                <h4>{courses.length}</h4>
                <p>Total Courses</p>
              </div>
            </div>
            <div className="enter-scores-stat-card">
              <div className="enter-scores-stat-icon stat-students">
                <FaUserGraduate />
              </div>
              <div>
                <h4>{totalStudents}</h4>
                <p>Total Students</p>
              </div>
            </div>
            <div className="enter-scores-stat-card">
              <div className="enter-scores-stat-icon stat-scores">
                <FaCheckSquare />
              </div>
              <div>
                <h4>{scoresToday}</h4>
                <p>Scores Entered Today</p>
              </div>
            </div>
          </div>

          <p className="enter-scores-footer-text">
            <span className="enter-scores-footer-cross">✝</span> Glory to God for all things
          </p>
        </>
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
                      <th key={comp.name}>{comp.name}<br /><small>(max {comp.maxScore})</small></th>
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