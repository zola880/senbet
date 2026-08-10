import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiAlertTriangle, FiArrowLeft, FiBookOpen, FiCheckCircle,
  FiDownload, FiEdit2, FiEye, FiFile, FiImage, FiInbox,
  FiMessageSquare, FiRefreshCw, FiUser, FiX
} from 'react-icons/fi';

import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import bgImage from '../../assets/L.png';
import './StudentCourseMaterials.css';

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */
const getFileUrl = (filePath) => {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const filename = filePath.split('/').pop();
  return `${base}/api/v1/files/${filename}`;
};

const handleFileAction = async (filePath, fileType, showToast) => {
  try {
    const url = getFileUrl(filePath);
    const response = await api.get(url, { responseType: 'blob' });
    const blob = response.data;
    const blobUrl = URL.createObjectURL(blob);

    if (fileType === 'image') {
      window.open(blobUrl, '_blank');
    } else {
      const filename = filePath.split('/').pop();
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  } catch (err) {
    console.error('Failed to fetch file:', err);
    showToast('error', 'Unable to access the file. Please try again.');
  }
};

/* --------------------------------------------------------------------------
   Data Hook: Fetch Student Courses
   -------------------------------------------------------------------------- */
const useStudentCourses = (user) => {
  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const reload = useCallback(async () => {
    if (!user?.class?._id) {
      setCourses([]);
      setStatus('success');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;

    setStatus('loading');
    setError(null);

    try {
      const res = await api.get(`/api/v1/assignments?class=${user.class._id}`, { signal });
      const assignments = Array.isArray(res.data?.data) ? res.data.data : [];
      
      const uniqueCourses = [];
      const seen = new Set();
      assignments.forEach(a => {
        if (a.course?._id && !seen.has(a.course._id)) {
          uniqueCourses.push(a.course);
          seen.add(a.course._id);
        }
      });
      
      setCourses(uniqueCourses);
      setStatus('success');
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
      console.error('Failed to load courses:', err);
      setError('Unable to load your courses. Please try again.');
      setStatus('error');
    }
  }, [user?.class?._id]);

  useEffect(() => {
    reload();
    return () => abortRef.current?.abort();
  }, [reload]);

  return { courses, status, error, reload };
};

/* --------------------------------------------------------------------------
   Data Hook: Fetch Course Materials
   -------------------------------------------------------------------------- */
const useCourseMaterials = (courseId) => {
  const [materials, setMaterials] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!courseId) {
      setMaterials([]);
      setStatus('idle');
      setError(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;

    setStatus('loading');
    setError(null);

    api.get(`/api/v1/courses/${courseId}/materials`, { signal })
      .then((res) => {
        if (signal.aborted) return;
        setMaterials(Array.isArray(res.data?.data) ? res.data.data : []);
        setStatus('success');
      })
      .catch((err) => {
        if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
        console.error('Failed to load materials:', err);
        setError('Unable to load course materials.');
        setStatus('error');
      });

    return () => controller.abort();
  }, [courseId]);

  return { materials, status, error, reload: () => {} };
};

/* --------------------------------------------------------------------------
   Tabs Configuration
   -------------------------------------------------------------------------- */
const TABS = [
  { id: 'material', label: 'Materials', icon: FiBookOpen },
  { id: 'homework', label: 'Homework', icon: FiEdit2 },
  { id: 'message', label: 'Messages', icon: FiMessageSquare },
];

/* --------------------------------------------------------------------------
   Main Component
   -------------------------------------------------------------------------- */
const StudentCourseMaterials = () => {
  const { user } = useContext(AuthContext);
  const { courses, status: coursesStatus, error: coursesError, reload: reloadCourses } = useStudentCourses(user);
  
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('material');
  const [toast, setToast] = useState({ type: '', message: '' });
  
  const tabRefs = useRef({});

  const { materials, status: materialsStatus, error: materialsError } = useCourseMaterials(selectedCourse?._id);

  const isLoadingCourses = coursesStatus === 'loading';
  const hasCourses = courses.length > 0;
  const isLoadingMaterials = materialsStatus === 'loading';
  const hasMaterials = materials.length > 0;

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => m.type === activeTab);
  }, [materials, activeTab]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    setActiveTab('material');
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
  };

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

  const getFileIcon = (fileType) => {
    if (fileType === 'image') return FiImage;
    if (fileType === 'pdf') return FiFile;
    return FiFile;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Course List View
  if (!selectedCourse) {
    return (
      <section className="scm-page">
        <div className="scm-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
        <div className="scm-wash" aria-hidden="true" />

        {toast.message && (
          <div className={`scm-toast scm-toast--${toast.type}`} role="alert">
            {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
            <span>{toast.message}</span>
            <button className="scm-toast-close" onClick={() => setToast({ type: '', message: '' })} aria-label="Close">
              <FiX size={16} />
            </button>
          </div>
        )}

        <main className="scm-content">
          <header className="scm-header">
            <h1 className="scm-title">Course Materials</h1>
            <p className="scm-subtitle">
              Access study materials, homework, and messages from your teachers.
            </p>
          </header>

          {isLoadingCourses && !hasCourses ? (
            <div className="scm-grid" aria-busy="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="scm-skeleton-card" aria-hidden="true">
                  <div className="scm-sk-icon" />
                  <div className="scm-sk-title" />
                  <div className="scm-sk-line" />
                </div>
              ))}
            </div>
          ) : coursesStatus === 'error' && !hasCourses ? (
            <div className="scm-state scm-state--error" role="alert">
              <FiAlertTriangle size={32} />
              <h3>Failed to load courses</h3>
              <p>{coursesError}</p>
              <button className="scm-btn scm-btn--primary" onClick={reloadCourses}>
                <FiRefreshCw size={16} /> Try Again
              </button>
            </div>
          ) : !hasCourses ? (
            <div className="scm-state">
              <FiInbox size={40} />
              <h3>No Courses Available</h3>
              <p>There are no courses assigned to your class yet.</p>
            </div>
          ) : (
            <div className="scm-grid">
              {courses.map((course) => (
                <article
                  key={course._id}
                  className="scm-course-card"
                  onClick={() => handleCourseClick(course)}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCourseClick(course); }}
                  role="button"
                  aria-label={`Open ${course.name}`}
                >
                  <div className="scm-course-icon" aria-hidden="true">
                    <FiBookOpen size={28} />
                  </div>
                  
                  <div className="scm-course-content">
                    <h2 className="scm-course-title">{course.name}</h2>
                    {course.code && <span className="scm-course-code">{course.code}</span>}
                    <span className="scm-course-hint">Tap to view materials</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </section>
    );
  }

  // Course Detail View with Tabs
  return (
    <section className="scm-page">
      <div className="scm-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="scm-wash" aria-hidden="true" />

      {toast.message && (
        <div className={`scm-toast scm-toast--${toast.type}`} role="alert">
          {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button className="scm-toast-close" onClick={() => setToast({ type: '', message: '' })} aria-label="Close">
            <FiX size={16} />
          </button>
        </div>
      )}

      <main className="scm-content">
        <button className="scm-back-btn" onClick={handleBackToCourses}>
          <FiArrowLeft size={18} /> Back to Courses
        </button>

        <header className="scm-course-header">
          <div className="scm-course-header-icon" aria-hidden="true">
            <FiBookOpen size={28} />
          </div>
          <div>
            <h1 className="scm-title">{selectedCourse.name}</h1>
            {selectedCourse.code && <span className="scm-code-badge">{selectedCourse.code}</span>}
            {selectedCourse.description && (
              <p className="scm-course-desc">{selectedCourse.description}</p>
            )}
          </div>
        </header>

        <div className="scm-tabs" role="tablist" aria-label="Material types">
          {TABS.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[tab.id] = el; }}
                type="button"
                role="tab"
                id={`scm-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`scm-panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                className={`scm-tab ${isActive ? 'scm-tab--active' : ''}`}
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
          className="scm-panel"
          role="tabpanel"
          id={`scm-panel-${activeTab}`}
          aria-labelledby={`scm-tab-${activeTab}`}
        >
          {isLoadingMaterials ? (
            <div className="scm-state" role="status">
              <span className="scm-spinner" />
              <p>Loading {activeTab}s…</p>
            </div>
          ) : materialsStatus === 'error' ? (
            <div className="scm-state scm-state--error" role="alert">
              <FiAlertTriangle size={32} />
              <h3>Failed to load materials</h3>
              <p>{materialsError}</p>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="scm-state">
              <FiInbox size={40} />
              <h3>No {activeTab}s Posted Yet</h3>
              <p>Your teacher hasn't posted any {activeTab}s for this course.</p>
            </div>
          ) : (
            <div className="scm-materials-list">
              {filteredMaterials.map((item) => {
                const FileIcon = getFileIcon(item.fileType);
                return (
                  <article key={item._id} className="scm-material-card">
                    <div className="scm-material-preview">
                      {item.file ? (
                        <FileIcon size={32} />
                      ) : (
                        <FiMessageSquare size={32} />
                      )}
                    </div>
                    
                    <div className="scm-material-info">
                      <h3 className="scm-material-title">{item.title || 'Untitled'}</h3>
                      {item.description && (
                        <p className="scm-material-desc">{item.description}</p>
                      )}
                      <div className="scm-material-meta">
                        <span className="scm-material-author">
                          <FiUser size={14} />
                          {item.postedBy?.fullName || 'Teacher'}
                        </span>
                        {item.createdAt && (
                          <span className="scm-material-date">
                            {formatDate(item.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    {item.file && (
                      <div className="scm-material-actions">
                        <button
                          className="scm-btn scm-btn--primary scm-btn--sm"
                          onClick={() => handleFileAction(item.file, item.fileType, showToast)}
                        >
                          {item.fileType === 'image' ? (
                            <><FiEye size={14} /> View</>
                          ) : (
                            <><FiDownload size={14} /> Download</>
                          )}
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </section>
  );
};

export default StudentCourseMaterials;