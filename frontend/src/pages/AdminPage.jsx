import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import AdminDashboard from '../components/admin/AdminDashboard';
import ManageUsers from '../components/admin/ManageUsers';
import ManageClasses from '../components/admin/ManageClasses';
import TeacherAssignments from '../components/admin/TeacherAssignments';
import AssessmentConfig from '../components/admin/AssessmentConfig';
import EnterScores from '../components/admin/EnterScores';
import FullRanking from '../components/admin/FullRanking';
import PracticeScheduler from '../components/admin/PracticeScheduler';
import ManageCourses from '../components/admin/ManageCourses';
import CourseDetail from '../components/admin/CourseDetail';
import StudentDetail from '../components/admin/StudentDetail'; // new
import TakeAttendance from '../components/common/TakeAttendance';
import AdminAttendance from '../components/admin/AdminAttendance';
import ClassDetail from '../components/admin/ClassDetail';
import ChurchClothRegistry from '../components/admin/ChurchClothRegistry';

const AdminPage = () => (
  <div className="app-layout">
    <Sidebar role="admin" />
    <main className="main-content">
      <Routes>
  <Route index element={<AdminDashboard />} />
  <Route path="users/:id" element={<StudentDetail />} />
  <Route path="users" element={<ManageUsers />} />
  <Route path="courses/:id" element={<CourseDetail />} />
  <Route path="courses" element={<ManageCourses />} />
  <Route path="scores" element={<EnterScores />} />
  <Route path="ranking" element={<FullRanking />} />
  <Route path="attendance" element={<AdminAttendance />} />
  <Route path="church-cloth" element={<ChurchClothRegistry />} />
  <Route path="practices" element={<PracticeScheduler />} />
  <Route path="classes/:id" element={<ClassDetail />} />
<Route path="classes" element={<ManageClasses />} />
</Routes>
    </main>
  </div>
);

export default AdminPage;