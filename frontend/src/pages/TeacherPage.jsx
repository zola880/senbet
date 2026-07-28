import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import TeacherDashboard from '../components/teacher/TeacherDashboard';
import MyCourses from '../components/teacher/MyCourses';        // old, we can keep or remove
import EnterMarks from '../components/teacher/EnterMarks';
import StudentList from '../components/teacher/StudentList';
import CoursesPage from '../components/common/CoursesPage';   // new unified page
import TakeAttendance from '../components/common/TakeAttendance';


const TeacherPage = () => (
  <div className="app-layout">
    <Sidebar role="teacher" />
    <main className="main-content">
      <Routes>
        <Route index element={<TeacherDashboard />} />
        <Route path="courses" element={<CoursesPage />} />  {/* replaced MyCourses */}
        <Route path="enter-marks" element={<EnterMarks />} />
        <Route path="students" element={<StudentList />} />
        <Route path="attendance" element={<TakeAttendance />} />
      </Routes>
    </main>
  </div>
);
export default TeacherPage;