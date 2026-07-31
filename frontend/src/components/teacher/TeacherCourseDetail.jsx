import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import { FiArrowLeft, FiUpload, FiTrash2, FiFile, FiMessageSquare, FiBookOpen, FiEdit } from 'react-icons/fi';
import EmptyState from '../common/EmptyState';

const TeacherCourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [activeTab, setActiveTab] = useState('material'); // 'material' | 'homework' | 'message'
  const [form, setForm] = useState({ title: '', description: '', type: 'material' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourse();
    fetchMaterials();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await api.get(`/api/v1/courses/${id}`);
      setCourse(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const res = await api.get(`/api/v1/courses/${id}/materials`);
      setMaterials(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.title && !selectedFile) {
      alert('Please provide a title or file.');
      return;
    }

    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('type', activeTab);
    if (selectedFile) {
      fd.append('file', selectedFile);
    }

    setUploading(true);
    try {
      await api.post(`/api/v1/courses/${id}/materials`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm({ title: '', description: '', type: activeTab });
      setSelectedFile(null);
      fetchMaterials();
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId) => {
    if (!window.confirm('Delete this item?')) return;
    await api.delete(`/api/v1/courses/${id}/materials/${materialId}`);
    fetchMaterials();
  };

  const filteredMaterials = materials.filter(m => m.type === activeTab);

  if (loading) return <div className="spinner" />;
  if (!course) return <div className="error-message">Course not found.</div>;

  return (
    <div>
      <button
        className="btn btn-secondary"
        onClick={() => navigate('/teacher/courses')}
        style={{ marginBottom: '1rem' }}
      >
        <FiArrowLeft /> Back to My Courses
      </button>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="page-title">{course.name}</h2>
        <p><strong>Code:</strong> {course.code || '—'}</p>
        <p><strong>Description:</strong> {course.description || '—'}</p>
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

      {/* Upload form */}
      <div className="card">
        <h3>New {activeTab}</h3>
        <form onSubmit={handleUpload} className="form-grid">
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            required={activeTab !== 'message'}  // message can be without title
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
          {(activeTab === 'material' || activeTab === 'homework') && (
            <input
              type="file"
              onChange={e => setSelectedFile(e.target.files[0])}
              accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
            />
          )}
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            <FiUpload /> {uploading ? 'Uploading...' : 'Post'}
          </button>
        </form>
      </div>

      {/* List of items */}
      <div className="table-container" style={{ marginTop: '1.5rem' }}>
        {filteredMaterials.length === 0 ? (
          <EmptyState message={`No ${activeTab}s yet.`} />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>File</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map(item => (
                <tr key={item._id}>
                  <td>{item.title}</td>
                  <td>{item.description || '—'}</td>
                  <td>
                    {item.file ? (
                      <a href={`http://localhost:5000/${item.file}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">
                        <FiFile /> {item.fileType}
                      </a>
                    ) : '—'}
                  </td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item._id)}>
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TeacherCourseDetail;