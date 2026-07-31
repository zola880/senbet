import { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import EmptyState from '../common/EmptyState';

const StudentList = () => {
  const { user } = useContext(AuthContext);
  const [classes, setClasses] = useState([]);       // unique classes teacher teaches
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Step 1: get teacher's assignments → unique classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get(`/api/v1/assignments/teacher/${user._id}`);
        const assignments = res.data.data;
        const uniqueClasses = [];
        const seen = new Set();
        assignments.forEach(a => {
          if (!seen.has(a.class._id)) {
            uniqueClasses.push(a.class);
            seen.add(a.class._id);
          }
        });
        setClasses(uniqueClasses);

        // If only one class, auto-select it
        if (uniqueClasses.length === 1) {
          setSelectedClass(uniqueClasses[0]._id);
        } else {
          setLoading(false); // will show dropdown
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchClasses();
  }, [user._id]);

  // Step 2: when selectedClass changes, fetch students
  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    api.get(`/api/v1/users?role=student&class=${selectedClass}`)
      .then(res => setStudents(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedClass]);

  if (loading && classes.length === 0) {
    return <div className="spinner" />;
  }

  return (
    <div>
      <h2 className="page-title">My Students</h2>

      {/* Show dropdown only if teacher has more than one class */}
      {classes.length > 1 && (
        <div className="form-grid" style={{ marginBottom: '1rem' }}>
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
          >
            <option value="">-- Select Class --</option>
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {loading && <div className="spinner" />}

      {!loading && selectedClass && students.length === 0 && (
        <EmptyState message="No students found in this class." />
      )}

      {!loading && students.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Roll No</th>
                <th>Class</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s._id}>
                  <td>{s.fullName}</td>
                  <td>{s.rollNumber || '—'}</td>
                  <td>{s.class?.name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentList;