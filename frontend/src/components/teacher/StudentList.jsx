import { useContext, useEffect, useState } from 'react';
import { 
  FiUsers, 
  FiAlertTriangle, 
  FiInbox, 
  FiChevronDown, 
  FiBookOpen 
} from 'react-icons/fi';

import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import bgImage from '../../assets/L.png';
import './StudentList.css';

const StudentList = () => {
  const { user } = useContext(AuthContext);
  const teacherId = user?._id;

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState([]);
  
  const [isFetchingClasses, setIsFetchingClasses] = useState(true);
  const [isFetchingStudents, setIsFetchingStudents] = useState(false);
  const [classesError, setClassesError] = useState(null);
  const [studentsError, setStudentsError] = useState(null);

  // Step 1: Fetch teacher's unique classes
  useEffect(() => {
    if (!teacherId) return;
    let isMounted = true;
    setIsFetchingClasses(true);

    api.get(`/api/v1/assignments/teacher/${teacherId}`)
      .then(res => {
        if (!isMounted) return;
        const assignments = res.data?.data || [];
        const uniqueClasses = [];
        const seen = new Set();
        
        assignments.forEach(a => {
          if (a.class && a.class._id && !seen.has(a.class._id)) {
            uniqueClasses.push(a.class);
            seen.add(a.class._id);
          }
        });
        
        setClasses(uniqueClasses);
        // Auto-select if there's only one class
        if (uniqueClasses.length === 1) {
          setSelectedClassId(uniqueClasses[0]._id);
        }
      })
      .catch(err => {
        if (!isMounted) return;
        console.error('Failed to load classes:', err);
        setClassesError('We could not load your assigned classes.');
      })
      .finally(() => {
        if (isMounted) setIsFetchingClasses(false);
      });

    return () => { isMounted = false; };
  }, [teacherId]);

  // Step 2: Fetch students when a class is selected
  useEffect(() => {
    if (!selectedClassId) return;
    let isMounted = true;
    setIsFetchingStudents(true);
    setStudentsError(null);

    api.get(`/api/v1/users?role=student&class=${selectedClassId}`)
      .then(res => {
        if (!isMounted) return;
        setStudents(res.data?.data || []);
      })
      .catch(err => {
        if (!isMounted) return;
        console.error('Failed to load students:', err);
        setStudentsError('We could not load the students for this class.');
      })
      .finally(() => {
        if (isMounted) setIsFetchingStudents(false);
      });

    return () => { isMounted = false; };
  }, [selectedClassId]);

  const activeClassName = classes.find(c => c._id === selectedClassId)?.name;

  return (
    <section className="sl-page">
      <div className="sl-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="sl-overlay" aria-hidden="true" />

      <header className="sl-header">
        <div>
          <h1 className="sl-title">My Students</h1>
          <p className="sl-subtitle">
            View and manage the students enrolled in your assigned classes.
          </p>
        </div>
        {!isFetchingClasses && classes.length > 0 && (
          <span className="sl-count-badge">
            <FiUsers size={16} aria-hidden="true" />
            {classes.length} {classes.length === 1 ? 'Class' : 'Classes'}
          </span>
        )}
      </header>

      <main className="sl-content">
        {/* Initial Loading / Error States for Classes */}
        {isFetchingClasses ? (
          <div className="sl-state" role="status">
            <span className="sl-spinner" aria-hidden="true" />
            <p>Loading your classes…</p>
          </div>
        ) : classesError ? (
          <div className="sl-state sl-state--error" role="alert">
            <FiAlertTriangle size={30} aria-hidden="true" />
            <h3>Unable to load classes</h3>
            <p>{classesError}</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="sl-state">
            <FiInbox size={32} aria-hidden="true" />
            <h3>No Classes Assigned</h3>
            <p>You are not currently assigned to teach any classes.</p>
          </div>
        ) : (
          <>
            {/* Class Selector Toolbar */}
            <div className="sl-toolbar">
              {classes.length > 1 ? (
                <div className="sl-select-group">
                  <label htmlFor="class-select" className="sl-label">
                    Select Class
                  </label>
                  <div className="sl-select-wrapper">
                    <select
                      id="class-select"
                      className="sl-select"
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      disabled={isFetchingStudents}
                    >
                      <option value="" disabled>-- Choose a class --</option>
                      {classes.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                    <FiChevronDown className="sl-select-icon" aria-hidden="true" />
                  </div>
                </div>
              ) : (
                <div className="sl-active-class-badge">
                  <FiBookOpen size={16} aria-hidden="true" />
                  <span>Viewing: <strong>{activeClassName}</strong></span>
                </div>
              )}
            </div>

            {/* Students Data Area */}
            <div className="sl-data-area">
              {isFetchingStudents ? (
                <div className="sl-state" role="status">
                  <span className="sl-spinner" aria-hidden="true" />
                  <p>Loading students…</p>
                </div>
              ) : studentsError ? (
                <div className="sl-state sl-state--error" role="alert">
                  <FiAlertTriangle size={30} aria-hidden="true" />
                  <h3>Unable to load students</h3>
                  <p>{studentsError}</p>
                </div>
              ) : !selectedClassId ? (
                <div className="sl-state">
                  <p>Please select a class from the dropdown above to view students.</p>
                </div>
              ) : students.length === 0 ? (
                <div className="sl-state">
                  <FiUsers size={32} aria-hidden="true" />
                  <h3>No Students Found</h3>
                  <p>There are no students currently enrolled in {activeClassName}.</p>
                </div>
              ) : (
                <div className="sl-table-wrapper">
                  <table className="sl-table">
                    <thead>
                      <tr>
                        <th scope="col">Student Name</th>
                        <th scope="col">Roll Number</th>
                        <th scope="col">Class</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(s => (
                        <tr key={s._id}>
                          <td data-label="Student Name">
                            <div className="sl-student-name">
                              <span className="sl-avatar" aria-hidden="true">
                                {s.fullName?.charAt(0).toUpperCase() || '?'}
                              </span>
                              {s.fullName || 'Unnamed Student'}
                            </div>
                          </td>
                          <td data-label="Roll Number">
                            <span className="sl-roll-num">{s.rollNumber || '—'}</span>
                          </td>
                          <td data-label="Class">
                            <span className="sl-class-name">{s.class?.name || '—'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </section>
  );
};

export default StudentList;