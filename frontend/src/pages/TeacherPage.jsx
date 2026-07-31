import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import TeacherDashboard from '../components/teacher/TeacherDashboard';
import EnterMarks from '../components/teacher/EnterMarks';
import StudentList from '../components/teacher/StudentList';
import TakeAttendance from '../components/common/TakeAttendance';
import CoursesPage from '../components/common/CoursesPage';
import TeacherCourseDetail from '../components/teacher/TeacherCourseDetail';
import StudentDetail from '../components/admin/StudentDetail';   // reuse the admin component

const TeacherPage = () => (
  <div className="app-layout">
    <Sidebar role="teacher" />
    <main className="main-content">
      <Routes>
        <Route index element={<TeacherDashboard />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/:id" element={<TeacherCourseDetail />} />
        <Route path="enter-marks" element={<EnterMarks />} />
        <Route path="students" element={<StudentList />} />
        <Route path="students/:id" element={<StudentDetail />} />   {/* new */}
        <Route path="attendance" element={<TakeAttendance />} />
        <Route path="practices" element={<div>Practice List</div>} />
      </Routes>
    </main>
  </div>
);

export default TeacherPage;