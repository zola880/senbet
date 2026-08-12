import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiSearch, FiCalendar, FiAlertTriangle, FiX, FiRefreshCw } from 'react-icons/fi';
import EmptyState from '../common/EmptyState';
import './StudentAttendanceReport.css';

const StudentAttendanceReport = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState(null);

  // Fetch classes
  useEffect(() => {
    const loadClasses = async () => {
      setLoadingClasses(true);
      setError(null);
      try {
        const res = await api.get('/api/v1/classes');
        setClasses(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        console.error('Failed to load classes:', err);
        setError('Failed to load classes. Please refresh and try again.');
      } finally {
        setLoadingClasses(false);
      }
    };
    loadClasses();
  }, []);

  // When class changes, fetch students
  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      return;
    }
    
    const loadStudents = async () => {
      setLoadingStudents(true);
      setError(null);
      try {
        const res = await api.get(`/api/v1/users?role=student&class=${selectedClass}`);
        setStudents(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        console.error('Failed to load students:', err);
        setError('Failed to load students for this class.');
      } finally {
        setLoadingStudents(false);
      }
    };
    loadStudents();
  }, [selectedClass]);

  const generateReport = async () => {
    if (!selectedStudent || !startDate || !endDate) {
      setError('Please select a student and a date range.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.get(
        `/api/v1/attendance/student/${selectedStudent}?startDate=${startDate}&endDate=${endDate}`
      );
      const data = Array.isArray(res.data?.data) ? res.data.data : [];

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
      console.error('Failed to generate report:', err);
      setError('Failed to generate attendance report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  if (loadingClasses) {
    return (
      <div>
        <h3 style={{ marginBottom: '1rem' }}>Student Attendance Report</h3>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ marginBottom: '1rem' }}>Loading classes...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ marginBottom: '1rem' }}>Student Attendance Report</h3>

      {error && (
        <div className="sar-error-banner" role="alert">
          <FiAlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={clearError} className="sar-error-close" aria-label="Close error">
            <FiX size={16} />
          </button>
        </div>
      )}

      <div className="sar-form-grid" style={{ marginBottom: '1rem' }}>
        <select 
          value={selectedClass} 
          onChange={e => { setSelectedClass(e.target.value); setSelectedStudent(''); }}
          disabled={loadingClasses}
        >
          <option value="">
            {loadingClasses ? 'Loading classes...' : 'Select Class'}
          </option>
          {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        
        <select 
          value={selectedStudent} 
          onChange={e => setSelectedStudent(e.target.value)} 
          disabled={!selectedClass || loadingStudents}
        >
          <option value="">
            {!selectedClass 
              ? 'Select a class first' 
              : loadingStudents 
              ? 'Loading students...' 
              : 'Select Student'}
          </option>
          {students.map(s => (
            <option key={s._id} value={s._id}>
              {s.fullName} {s.rollNumber ? `(${s.rollNumber})` : ''}
            </option>
          ))}
        </select>
        
        <div>
          <label>Start Date</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)} 
          />
        </div>
        
        <div>
          <label>End Date</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)} 
          />
        </div>
      </div>

      <button
        className="sar-btn sar-btn-primary"
        onClick={generateReport}
        disabled={!selectedStudent || !startDate || !endDate || loading}
        style={{ marginBottom: '1rem' }}
      >
        {loading ? (
          <>
            <FiRefreshCw className="sar-spin" /> Generating...
          </>
        ) : (
          <>
            <FiSearch /> Generate Report
          </>
        )}
      </button>

      {report && (
        <>
          {/* Summary cards */}
          <div className="sar-stats-grid" style={{ marginBottom: '1rem' }}>
            <div className="sar-stat-card">
              <div className="sar-stat-icon sar-present"><FiCalendar /></div>
              <div className="sar-stat-info">
                <h3>{report.totals.present}</h3>
                <p>Present</p>
              </div>
            </div>
            <div className="sar-stat-card">
              <div className="sar-stat-icon sar-absent"><FiCalendar /></div>
              <div className="sar-stat-info">
                <h3>{report.totals.absent}</h3>
                <p>Absent</p>
              </div>
            </div>
            <div className="sar-stat-card">
              <div className="sar-stat-icon sar-late"><FiCalendar /></div>
              <div className="sar-stat-info">
                <h3>{report.totals.late}</h3>
                <p>Late</p>
              </div>
            </div>
            <div className="sar-stat-card">
              <div className="sar-stat-icon sar-total"><FiCalendar /></div>
              <div className="sar-stat-info">
                <h3>{report.totalDays}</h3>
                <p>Total Days</p>
              </div>
            </div>
          </div>

          {/* Detailed records table */}
          <div className="sar-table-container">
            {report.records.length === 0 ? (
              <EmptyState message="No attendance records found for this period." />
            ) : (
              <table className="sar-table">
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
                        <span className={`sar-attendance-badge sar-${rec.status}`}>
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