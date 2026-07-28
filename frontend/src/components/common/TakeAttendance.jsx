import { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import { FiSave, FiCheck, FiX, FiClock } from 'react-icons/fi';

const TakeAttendance = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState(null);
  const [records, setRecords] = useState({}); // {studentId: 'present'|'absent'|'late'}
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        if (isAdmin) {
          const res = await api.get('/api/v1/classes');
          setClasses(res.data.data);
        } else {
          // For teacher, get their assigned classes (distinct)
          const res = await api.get(`/api/v1/assignments/teacher/${user._id}`);
          const uniqueClasses = [];
          const seen = new Set();
          res.data.data.forEach(a => {
            if (!seen.has(a.class._id)) {
              uniqueClasses.push(a.class);
              seen.add(a.class._id);
            }
          });
          setClasses(uniqueClasses);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchClasses();
  }, [isAdmin, user._id]);

  useEffect(() => {
    if (!selectedClass || !date) return;
    setLoading(true);
    setMessage('');
    api.get(`/api/v1/attendance?class=${selectedClass}&date=${date}`)
      .then(res => {
        setAttendanceData(res.data.data);
        // Initialize records from existing data, or empty
        const initRecords = {};
        if (res.data.data.records) {
          res.data.data.records.forEach(r => {
            if (r.student?._id) {
              initRecords[r.student._id] = r.status;
            }
          });
        }
        setRecords(initRecords);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedClass, date]);

  const handleStatusChange = (studentId, status) => {
    setRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    const payload = {
      class: selectedClass,
      date,
      records: Object.entries(records).map(([student, status]) => ({
        student,
        status,
      })),
    };
    setSaving(true);
    try {
      await api.post('/api/v1/attendance', payload);
      setMessage('Attendance saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving attendance');
    } finally {
      setSaving(false);
    }
  };

  const students = attendanceData?.records?.map(r => r.student) || [];

  return (
    <div>
      <h2 className="page-title">Take Attendance</h2>

      <div className="form-grid" style={{ marginBottom: '1rem' }}>
        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
          <option value="">Select Class</option>
          {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      {message && <div className="success-message">{message}</div>}

      {loading && <div className="spinner" />}

      {!loading && selectedClass && date && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll No</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student._id}>
                  <td>{student.fullName}</td>
                  <td>{student.rollNumber || '—'}</td>
                  <td>
                    <div className="attendance-status-group">
                      <button
                        className={`attendance-btn ${records[student._id] === 'present' ? 'attendance-present' : ''}`}
                        onClick={() => handleStatusChange(student._id, 'present')}
                      >
                        <FiCheck /> Present
                      </button>
                      <button
                        className={`attendance-btn ${records[student._id] === 'absent' ? 'attendance-absent' : ''}`}
                        onClick={() => handleStatusChange(student._id, 'absent')}
                      >
                        <FiX /> Absent
                      </button>
                      <button
                        className={`attendance-btn ${records[student._id] === 'late' ? 'attendance-late' : ''}`}
                        onClick={() => handleStatusChange(student._id, 'late')}
                      >
                        <FiClock /> Late
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <FiSave /> {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      )}

      {!loading && !selectedClass && (
        <div className="card" style={{ marginTop: '1rem', textAlign: 'center', color: '#666' }}>
          <p>Select a class and date to start taking attendance.</p>
        </div>
      )}
    </div>
  );
};

export default TakeAttendance;