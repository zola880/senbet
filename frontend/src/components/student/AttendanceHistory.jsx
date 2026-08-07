import { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import { FiCalendar, FiCheck, FiX, FiClock } from 'react-icons/fi';
import EmptyState from '../common/EmptyState';
import './AttendanceHistory.css';
const AttendanceHistory = () => {
  const { user } = useContext(AuthContext);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;
    api.get(`/api/v1/attendance/student/${user._id}`)
      .then(res => setAttendance(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user._id]);

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <h2 className="page-title">My Attendance</h2>
      <div className="table-container">
        {attendance.length === 0 ? (
          <EmptyState message="No attendance records found." />
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
              {attendance.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.date}</td>
                  <td>{item.class}</td>
                  <td>
                    {item.status === 'present' && <span className="attendance-badge present"><FiCheck /> Present</span>}
                    {item.status === 'absent' && <span className="attendance-badge absent"><FiX /> Absent</span>}
                    {item.status === 'late' && <span className="attendance-badge late"><FiClock /> Late</span>}
                    {!['present','absent','late'].includes(item.status) && <span>{item.status}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AttendanceHistory;