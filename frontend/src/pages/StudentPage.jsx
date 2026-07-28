import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import StudentDashboard from '../components/student/StudentDashboard';
import MyMarks from '../components/student/MyMarks';
import MyRank from '../components/student/MyRank';
import PracticeCalendar from '../components/student/PracticeCalendar';
import AttendanceHistory from '../components/student/AttendanceHistory';

const StudentPage = () => (
  <div className="app-layout">
    <Sidebar role="student" />
    <main className="main-content">
      <Routes>
        <Route index element={<StudentDashboard />} />
        <Route path="marks" element={<MyMarks />} />
        <Route path="rank" element={<MyRank />} />
        <Route path="practices" element={<PracticeCalendar />} />
        <Route path="attendance" element={<AttendanceHistory />} />
      </Routes>
    </main>
  </div>
);
export default StudentPage;