import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiEdit, FiSave, FiX } from 'react-icons/fi';
import EmptyState from '../common/EmptyState';
import './ViewAttendance.css';

const ViewAttendance = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [records, setRecords] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/api/v1/classes').then(res => setClasses(res.data.data)).catch(console.error);
  }, []);

  const fetchAttendance = async () => {
    if (!selectedClass || !date) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/attendance?class=${selectedClass}&date=${date}`);
      setAttendance(res.data.data);
      // Initialize records from existing data
      const init = {};
      res.data.data.records.forEach(r => {
        if (r.student?._id) init[r.student._id] = r.status;
      });
      setRecords(init);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
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
      alert('Attendance updated');
      setEditing(false);
      fetchAttendance();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating attendance');
    } finally {
      setSaving(false);
    }
  };

  const students = attendance?.records?.map(r => r.student) || [];

  return (
    <div>
      <div className="form-grid" style={{ marginBottom: '1rem' }}>
        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
          <option value="">Select Class</option>
          {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      {loading && <div className="spinner" />}

      {!loading && selectedClass && date && students.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll No</th>
                <th>Status</th>
                {editing && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student._id}>
                  <td>{student.fullName}</td>
                  <td>{student.rollNumber || '—'}</td>
                  <td>
                    {editing ? (
                      <div className="attendance-status-group">
                        <button
                          className={`attendance-btn ${records[student._id] === 'present' ? 'attendance-present' : ''}`}
                          onClick={() => handleStatusChange(student._id, 'present')}
                        >
                          Present
                        </button>
                        <button
                          className={`attendance-btn ${records[student._id] === 'absent' ? 'attendance-absent' : ''}`}
                          onClick={() => handleStatusChange(student._id, 'absent')}
                        >
                          Absent
                        </button>
                        <button
                          className={`attendance-btn ${records[student._id] === 'late' ? 'attendance-late' : ''}`}
                          onClick={() => handleStatusChange(student._id, 'late')}
                        >
                          Late
                        </button>
                      </div>
                    ) : (
                      <span className={`attendance-badge ${records[student._id] || 'absent'}`}>
                        {records[student._id] === 'present' && 'Present'}
                        {records[student._id] === 'absent' && 'Absent'}
                        {records[student._id] === 'late' && 'Late'}
                        {!records[student._id] && '—'}
                      </span>
                    )}
                  </td>
                  {editing && (
                    <td>
                      {/* No individual save; save all at once */}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            {!editing ? (
              <button className="btn btn-primary" onClick={() => setEditing(true)}>
                <FiEdit /> Edit Attendance
              </button>
            ) : (
              <>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn btn-secondary" onClick={() => { setEditing(false); fetchAttendance(); }}>
                  <FiX /> Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {!loading && selectedClass && date && students.length === 0 && (
        <EmptyState message="No attendance recorded for this date." />
      )}
    </div>
  );
};

export default ViewAttendance;