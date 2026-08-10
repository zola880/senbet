import { Routes, Route } from 'react-router-dom';

import Sidebar from '../components/common/Sidebar';

// Student pages
import StudentDashboard from '../components/student/StudentDashboard';
import MyMarks from '../components/student/MyMarks';
import MyRank from '../components/student/MyRank';
import AttendanceHistory from '../components/student/AttendanceHistory';
import PracticeCalendar from '../components/student/PracticeCalendar';
import StudentCourseMaterials from '../components/student/StudentCourseMaterials';
import Notifications from '../components/student/Notifications';

/**
 * Student layout with sidebar + routed content.
 * All routes are relative to /student/*
 */
const StudentPage = () => (
  <div className="app-layout">
    <Sidebar role="student" />
    <main className="main-content">
      <Routes>
        {/* Dashboard */}
        <Route index element={<StudentDashboard />} />

        {/* Academic */}
        <Route path="marks" element={<MyMarks />} />
        <Route path="rank" element={<MyRank />} />

        {/* Attendance & Schedule */}
        <Route path="attendance" element={<AttendanceHistory />} />
        <Route path="practices" element={<PracticeCalendar />} />

        {/* Resources */}
        <Route path="materials" element={<StudentCourseMaterials />} />
        <Route path="notifications" element={<Notifications />} />

        {/* Fallback for unknown student routes */}
        <Route path="*" element={<StudentDashboard />} />
      </Routes>
    </main>
  </div>
);

export default StudentPage;