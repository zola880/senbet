import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import DevelopmentHome from '../components/development/DevelopmentHome';

const DevelopmentPage = () => (
  <div className="app-layout">
    <Sidebar role="development" />
    <main className="main-content">
      <Routes>
        <Route index element={<DevelopmentHome />} />
        <Route path="entries" element={<DevelopmentHome />} />
        <Route path="*" element={<DevelopmentHome />} />
      </Routes>
    </main>
  </div>
);

export default DevelopmentPage;