import { useState, useEffect, useContext } from 'react';
import { FiArrowLeft, FiBookOpen, FiEdit, FiMessageSquare, FiFile, FiEye, FiDownload } from 'react-icons/fi';
import AuthContext from '../../context/AuthContext';
import api from '../../services/api';
import EmptyState from '../common/EmptyState';

const StudentCourseMaterials = () => {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [activeTab, setActiveTab] = useState('material');
  const [loading, setLoading] = useState(true);

  // Fetch courses assigned to the student's class
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        if (!user?.class?._id) {
          setLoading(false);
          return;
        }
        const res = await api.get(`/api/v1/assignments?class=${user.class._id}`);
        const assignments = res.data.data;
        const uniqueCourses = [];
        const seen = new Set();
        assignments.forEach(a => {
          if (!seen.has(a.course._id)) {
            uniqueCourses.push(a.course);
            seen.add(a.course._id);
          }
        });
        setCourses(uniqueCourses);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [user]);

  // Fetch materials for selected course
  const loadMaterials = async (courseId) => {
    try {
      const res = await api.get(`/api/v1/courses/${courseId}/materials`);
      setMaterials(res.data.data);
    } catch (err) {
      console.error(err);
      setMaterials([]);
    }
  };

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    loadMaterials(course._id);
  };

  const filteredMaterials = materials.filter(m => m.type === activeTab);

  if (loading) return <div className="spinner" />;

  // Course list view
  if (!selectedCourse) {
    return (
      <div>
        <h2 className="page-title">Course Materials</h2>
        {courses.length === 0 ? (
          <EmptyState message="No courses available for your class." />
        ) : (
          <div className="materials-grid">
            {courses.map(course => (
              <div
                key={course._id}
                className="material-item course-card"
                onClick={() => handleCourseClick(course)}
                style={{ cursor: 'pointer' }}
              >
                <div className="material-file" style={{ height: '120px' }}>
                  <FiBookOpen size={32} />
                </div>
                <div className="material-info">
                  <h4>{course.name}</h4>
                  <p>{course.code || 'Tap to view materials'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Course detail view with tabs
  return (
    <div>
      <button
        className="btn btn-secondary"
        onClick={() => setSelectedCourse(null)}
        style={{ marginBottom: '1rem' }}
      >
        <FiArrowLeft /> Back to Courses
      </button>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="page-title">{selectedCourse.name}</h2>
        <p><strong>Code:</strong> {selectedCourse.code || '—'}</p>
        <p><strong>Description:</strong> {selectedCourse.description || '—'}</p>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        {['material', 'homework', 'message'].map(tab => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'material' ? <FiBookOpen style={{ marginRight: '0.3rem' }} /> :
             tab === 'homework' ? <FiEdit style={{ marginRight: '0.3rem' }} /> :
             <FiMessageSquare style={{ marginRight: '0.3rem' }} />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}s
          </button>
        ))}
      </div>

      {/* List of items */}
      <div className="table-container" style={{ marginTop: '1.5rem' }}>
        {filteredMaterials.length === 0 ? (
          <EmptyState message={`No ${activeTab}s posted yet.`} />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>File</th>
                <th>Posted By</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map(item => (
                <tr key={item._id}>
                  <td>{item.title}</td>
                  <td>{item.description || '—'}</td>
                  <td>
                    {item.file ? (
                      <a
                        href={`http://localhost:5000/${item.file}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-secondary"
                      >
                        {item.fileType === 'image' ? <FiEye /> : <FiDownload />}
                        {item.fileType === 'image' ? ' View' : ' Download'}
                      </a>
                    ) : '—'}
                  </td>
                  <td>{item.postedBy?.fullName || 'Teacher'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StudentCourseMaterials;