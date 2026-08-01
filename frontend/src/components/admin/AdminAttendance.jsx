import { useState } from 'react';
import TakeAttendance from '../common/TakeAttendance';
import ViewAttendance from './ViewAttendance';
import StudentAttendanceReport from './StudentAttendanceReport';

const AdminAttendance = () => {
  const [activeTab, setActiveTab] = useState('take');

  return (
    <div>
      <h2 className="page-title">Attendance Management</h2>

      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'take' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('take')}
        >
          Take Attendance
        </button>
        <button
          className={`tab-button ${activeTab === 'view' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('view')}
        >
          View Attendance
        </button>
        <button
          className={`tab-button ${activeTab === 'report' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('report')}
        >
          Student Report
        </button>
      </div>

      {activeTab === 'take' && <TakeAttendance />}
      {activeTab === 'view' && <ViewAttendance />}
      {activeTab === 'report' && <StudentAttendanceReport />}
    </div>
  );
};

export default AdminAttendance;