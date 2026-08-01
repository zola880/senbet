import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiSearch, FiCalendar } from 'react-icons/fi';
import EmptyState from '../common/EmptyState';

const StudentAttendanceReport = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch classes
  useEffect(() => {
    api.get('/api/v1/classes').then(res => setClasses(res.data.data)).catch(console.error);
  }, []);

  // When class changes, fetch students
  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      return;
    }
    api.get(`/api/v1/users?role=student&class=${selectedClass}`)
      .then(res => setStudents(res.data.data))
      .catch(console.error);
  }, [selectedClass]);

  const generateReport = async () => {
    if (!selectedStudent || !startDate || !endDate) {
      alert('Please select a student and a date range.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(
        `/api/v1/attendance/student/${selectedStudent}?startDate=${startDate}&endDate=${endDate}`
      );
      const data = res.data.data;

      // Compute totals
      let present = 0, absent = 0, late = 0;
      data.forEach(record => {
        if (record.status === 'present') present++;
        else if (record.status === 'absent') absent++;
        else if (record.status === 'late') late++;
      });

      setReport({
        records: data,
        totals: { present, absent, late },
        totalDays: data.length,
      });
    } catch (err) {
      console.error(err);
      alert('Failed to fetch report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: '1rem' }}>Student Attendance Report</h3>

      <div className="form-grid" style={{ marginBottom: '1rem' }}>
        <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedStudent(''); }}>
          <option value="">Select Class</option>
          {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} disabled={!selectedClass}>
          <option value="">Select Student</option>
          {students.map(s => <option key={s._id} value={s._id}>{s.fullName} {s.rollNumber ? `(${s.rollNumber})` : ''}</option>)}
        </select>
        <div>
          <label>Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label>End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>

      <button
        className="btn btn-primary"
        onClick={generateReport}
        disabled={!selectedStudent || !startDate || !endDate}
        style={{ marginBottom: '1rem' }}
      >
        <FiSearch /> Generate Report
      </button>

      {loading && <div className="spinner" />}

      {report && (
        <>
          {/* Summary cards */}
          <div className="stats-grid" style={{ marginBottom: '1rem' }}>
            <div className="stat-card">
              <div className="stat-icon"><FiCalendar /></div>
              <div className="stat-info">
                <h3>{report.totals.present}</h3>
                <p>Present</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><FiCalendar /></div>
              <div className="stat-info">
                <h3>{report.totals.absent}</h3>
                <p>Absent</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><FiCalendar /></div>
              <div className="stat-info">
                <h3>{report.totals.late}</h3>
                <p>Late</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><FiCalendar /></div>
              <div className="stat-info">
                <h3>{report.totalDays}</h3>
                <p>Total Days</p>
              </div>
            </div>
          </div>

          {/* Detailed records table */}
          <div className="table-container">
            {report.records.length === 0 ? (
              <EmptyState message="No attendance records found for this period." />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Class</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.records.map((rec, idx) => (
                    <tr key={idx}>
                      <td>{rec.date}</td>
                      <td>{rec.class}</td>
                      <td>
                        <span className={`attendance-badge ${rec.status}`}>
                          {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentAttendanceReport;