import { useState, useEffect } from 'react';
import api from '../../services/api';
import EmptyState from '../common/EmptyState';

// 🌄 Replace this URL with your own image
const BACKGROUND_IMAGE = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkwpjvGXir0uK3CkxmmOqt18Sy4NHipO-FIDY3IxHjsA&s=10';

const FullRanking = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/v1/classes')
      .then((res) => setClasses(res.data.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setRanking([]);
      return;
    }

    setLoading(true);
    setError('');

    api.get(`/api/v1/rankings/class/${selectedClass}`)
      .then((res) => {
        setRanking(res.data.data);
        if (res.data.data.length === 0) {
          setError('No ranking data available. Ensure students have scores and an assessment config is set for this class.');
        }
      })
      .catch((err) => {
        console.error(err);
        if (err.response?.status === 400) {
          setError('Assessment configuration is missing for this class. Please set it up first.');
        } else {
          setError('Failed to load ranking data.');
        }
      })
      .finally(() => setLoading(false));
  }, [selectedClass]);

  return (
    <div>
      <h2 className="page-title">Class Ranking</h2>

      <div className="form-grid" style={{ marginBottom: '1rem' }}>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">-- Select Class --</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {!selectedClass ? (
        <div
          className="selection-placeholder"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url('${BACKGROUND_IMAGE}')`,
          }}
        >
          <p>Please choose a class to view the ranking</p>
        </div>
      ) : (
        <>
          {loading && <div className="spinner" />}
          {error && !loading && <div className="error-message">{error}</div>}

          {!loading && ranking.length > 0 && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>Roll No</th>
                    <th>Total Score</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((student) => (
                    <tr key={student.studentId}>
                      <td>
                        <span className={`rank-badge ${student.rank <= 3 ? `rank-${student.rank}` : ''}`}>
                          {student.rank}
                        </span>
                      </td>
                      <td>{student.fullName}</td>
                      <td>{student.rollNumber || '—'}</td>
                      <td>{student.overallTotal?.toFixed(2) ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && ranking.length === 0 && selectedClass && (
            <EmptyState message="No students or scores found for this class. Enter marks first." />
          )}
        </>
      )}
    </div>
  );
};

export default FullRanking;