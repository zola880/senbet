import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiArrowLeft, FiEdit, FiTrash2, FiUpload, FiSave, FiX } from 'react-icons/fi';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [materials, setMaterials] = useState([]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCourse();
    fetchMaterials();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await api.get(`/api/v1/courses/${id}`);
      setCourse(res.data.data);
      setForm({
        name: res.data.data.name,
        code: res.data.data.code || '',
        description: res.data.data.description || '',
      });
    } catch (err) {
      console.error(err);
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

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/v1/courses/${id}`, form);
      setEditing(false);
      fetchCourse();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating course');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', uploadTitle);
    formData.append('description', uploadDesc);
    try {
      await api.post(`/api/v1/courses/${id}/materials`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadTitle('');
      setUploadDesc('');
      setSelectedFile(null);
      fetchMaterials();
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Delete this material?')) return;
    try {
      await api.delete(`/api/v1/courses/${id}/materials/${materialId}`);
      fetchMaterials();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  if (!course) return <div className="spinner" />;

  return (
    <div>
      <button
        className="btn btn-secondary"
        onClick={() => navigate('/admin/courses')}
        style={{ marginBottom: '1rem' }}
      >
        <FiArrowLeft /> Back to Courses
      </button>

      {/* Ethiopian Church Banner */}
      <div
        className="course-banner"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.5)), url('https://media.istockphoto.com/id/2228817333/photo/ethiopian-nun-reading-holy-book-in-a-rock-hewn-church-in-lalibela.jpg?s=612x612&w=0&k=20&c=S1a_4Oyyapq4eK0pWvsvktkxa0xYWSNGm4Um2XzL5ng=')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: 'var(--radius)',
          padding: '3rem 2rem',
          marginBottom: '1.5rem',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{course.name}</h2>
        <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>{course.code || 'Course Management'}</p>
      </div>

      {/* Edit Course Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Course Details</h3>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setEditing(!editing)}
          >
            {editing ? <FiX /> : <FiEdit />} {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleUpdateCourse} className="form-grid" style={{ marginTop: '1rem' }}>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Course Name"
              required
            />
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="Code"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description"
              rows={3}
              style={{ gridColumn: '1 / -1' }}
            />
            <button type="submit" className="btn btn-primary" style={{ justifySelf: 'start' }}>
              <FiSave /> Save Changes
            </button>
          </form>
        ) : (
          <div style={{ marginTop: '1rem' }}>
            <p><strong>Code:</strong> {course.code || '—'}</p>
            <p><strong>Description:</strong> {course.description || '—'}</p>
          </div>
        )}
      </div>

      {/* Materials Section */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3>Course Materials</h3>

        {/* Upload Form */}
        <form onSubmit={handleUpload} className="form-grid" style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            placeholder="Title (optional)"
            value={uploadTitle}
            onChange={(e) => setUploadTitle(e.target.value)}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={uploadDesc}
            onChange={(e) => setUploadDesc(e.target.value)}
          />
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
            required
          />
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            <FiUpload /> {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>

        {/* Materials List */}
        {materials.length === 0 ? (
          <p className="text-muted">No materials uploaded yet.</p>
        ) : (
          <div className="materials-grid">
            {materials.map((mat) => (
              <div key={mat._id} className="material-item">
                {mat.fileType === 'image' ? (
                  <img
                    src={`http://localhost:5000/${mat.file}`}
                    alt={mat.title}
                    className="material-image"
                  />
                ) : (
                  <div className="material-file">
                    <span>{mat.fileType.toUpperCase()}</span>
                  </div>
                )}
                <div className="material-info">
                  <h4>{mat.title}</h4>
                  <p>{mat.description}</p>
                  <a
                    href={`http://localhost:5000/${mat.file}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-secondary"
                  >
                    {mat.fileType === 'image' ? 'View Full' : 'Download'}
                  </a>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDeleteMaterial(mat._id)}
                    style={{ marginLeft: '0.5rem' }}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;