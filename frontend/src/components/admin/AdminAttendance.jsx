import { useRef, useState } from 'react';
import { FiCheckSquare, FiEye, FiFileText } from 'react-icons/fi';

import TakeAttendance from '../common/TakeAttendance';
import ViewAttendance from './ViewAttendance';
import StudentAttendanceReport from './StudentAttendanceReport';
import bgImage from '../../assets/L.png';
import './AdminAttendance.css';

const TABS = [
  { id: 'take', label: 'Take Attendance', icon: FiCheckSquare },
  { id: 'view', label: 'View Attendance', icon: FiEye },
  { id: 'report', label: 'Student Report', icon: FiFileText },
];

const AdminAttendance = () => {
  const [activeTab, setActiveTab] = useState('take');
  const tabRefs = useRef({});

  const handleTabKeyDown = (event, index) => {
    const handledKeys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!handledKeys.includes(event.key)) return;

    event.preventDefault();

    let nextIndex;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % TABS.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === 'Home') nextIndex = 0;
    else nextIndex = TABS.length - 1;

    const nextTab = TABS[nextIndex];
    setActiveTab(nextTab.id);
    tabRefs.current[nextTab.id]?.focus();
  };

  return (
    <section className="aa-page">
      <div
        className="aa-bg"
        style={{ backgroundImage: `url(${bgImage})` }}
        aria-hidden="true"
      />
      <div className="aa-wash" aria-hidden="true" />

      <main className="aa-content">
        <header className="aa-header">
          <div>
            <h1 className="aa-title">Attendance Management</h1>
            <p className="aa-subtitle">
              Take, review, and analyze attendance across your school.
            </p>
          </div>
        </header>

        <div className="aa-tabs" role="tablist" aria-label="Attendance sections">
          {TABS.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                type="button"
                role="tab"
                id={`aa-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`aa-panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                className={`aa-tab ${isActive ? 'aa-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
              >
                <Icon size={17} aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div
          key={activeTab}
          className="aa-panel"
          role="tabpanel"
          id={`aa-panel-${activeTab}`}
          aria-labelledby={`aa-tab-${activeTab}`}
        >
          {activeTab === 'take' && <TakeAttendance />}
          {activeTab === 'view' && <ViewAttendance />}
          {activeTab === 'report' && <StudentAttendanceReport />}
        </div>
      </main>
    </section>
  );
};

export default AdminAttendance;