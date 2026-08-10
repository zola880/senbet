import { Routes, Route } from 'react-router-dom';

import Sidebar from '../components/common/Sidebar';

// Teacher pages
import TeacherDashboard from '../components/teacher/TeacherDashboard';
import EnterMarks from '../components/teacher/EnterMarks';
import StudentList from '../components/teacher/StudentList';
import TeacherCourseDetail from '../components/teacher/TeacherCourseDetail';

// Common pages
import TakeAttendance from '../components/common/TakeAttendance';
import CoursesPage from '../components/common/CoursesPage';

// Reused pages
import StudentDetail from '../components/admin/StudentDetail';
import PracticeCalendar from '../components/student/PracticeCalendar';

/**
 * Teacher layout with sidebar + routed content.
 * All routes are relative to /teacher/*
 */
const TeacherPage = () => (
  <div className="app-layout">
    <Sidebar role="teacher" />
    <main className="main-content">
      <Routes>
        {/* Dashboard */}
        <Route index element={<TeacherDashboard />} />

        {/* Courses */}
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/:id" element={<TeacherCourseDetail />} />

        {/* Academic */}
        <Route path="enter-marks" element={<EnterMarks />} />

        {/* Students */}
        <Route path="students" element={<StudentList />} />
        <Route path="students/:id" element={<StudentDetail />} />

        {/* Attendance & Schedule */}
        <Route path="attendance" element={<TakeAttendance />} />
        <Route path="practices" element={<PracticeCalendar />} />

        {/* Fallback for unknown teacher routes */}
        <Route path="*" element={<TeacherDashboard />} />
      </Routes>
    </main>
  </div>
);

export default TeacherPage;