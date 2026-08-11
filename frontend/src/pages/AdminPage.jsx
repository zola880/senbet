import { Routes, Route } from 'react-router-dom';

import Sidebar from '../components/common/Sidebar';

// Admin pages
import AdminDashboard from '../components/admin/AdminDashboard';
import ManageUsers from '../components/admin/ManageUsers';
import ManageClasses from '../components/admin/ManageClasses';
import ManageCourses from '../components/admin/ManageCourses';
import EnterScores from '../components/admin/EnterScores';
import FullRanking from '../components/admin/FullRanking';
import AdminAttendance from '../components/admin/AdminAttendance';
import ChurchClothRegistry from '../components/admin/ChurchClothRegistry';
import PracticeScheduler from '../components/admin/PracticeScheduler';
import DevelopmentReports from '../components/admin/DevelopmentReports';

// Detail pages
import CourseDetail from '../components/admin/CourseDetail';
import ClassDetail from '../components/admin/ClassDetail';
import StudentDetail from '../components/admin/StudentDetail';

/**
 * Admin layout with sidebar + routed content.
 *
 * NOTE: Detail routes (e.g., "users/:id") MUST appear before their
 * corresponding list routes (e.g., "users") so React Router matches them first.
 */
const AdminPage = () => (
  <div className="app-layout">
    <Sidebar role="admin" />
    <main className="main-content">
      <Routes>
        {/* Dashboard */}
        <Route index element={<AdminDashboard />} />

        {/* Users */}
        <Route path="users/:id" element={<StudentDetail />} />
        <Route path="users" element={<ManageUsers />} />

        {/* Classes */}
        <Route path="classes/:id" element={<ClassDetail />} />
        <Route path="classes" element={<ManageClasses />} />

        {/* Courses */}
        <Route path="courses/:id" element={<CourseDetail />} />
        <Route path="courses" element={<ManageCourses />} />

        {/* Academic */}
        <Route path="scores" element={<EnterScores />} />
        <Route path="ranking" element={<FullRanking />} />

        {/* Attendance & Activities */}
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="practices" element={<PracticeScheduler />} />
        <Route path="church-cloth" element={<ChurchClothRegistry />} />

        {/* Development (ልማት ክፍል) */}
        <Route path="development" element={<DevelopmentReports />} />

        {/* Fallback for unknown admin routes */}
        <Route path="*" element={<AdminDashboard />} />
      </Routes>
    </main>
  </div>
);

export default AdminPage;