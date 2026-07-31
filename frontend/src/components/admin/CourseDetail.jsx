import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiArrowLeft, FiEdit, FiTrash2, FiUpload, FiSave, FiX, FiPlus } from 'react-icons/fi';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Course state
  const [course, setCourse] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '' });

  // Materials state
  const [materials, setMaterials] = useState([]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Assignments state
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [editAssignmentId, setEditAssignmentId] = useState(null);
  const [assignForm, setAssignForm] = useState({ teacher: '', class: '' });

  useEffect(() => {
    fetchCourse();
    fetchMaterials();
    fetchAssignments();
    // Fetch teachers and classes for dropdowns
    api.get('/api/v1/users?role=teacher').then(r => setTeachers(r.data.data));
    api.get('/api/v1/classes').then(r => setClasses(r.data.data));
  }, [id]);

  const fetchCourse = async () => {
    const res = await api.get(`/api/v1/courses/${id}`);
    setCourse(res.data.data);
    setForm({
      name: res.data.data.name,
      code: res.data.data.code || '',
      description: res.data.data.description || '',
    });
  };

  const fetchMaterials = async () => {
    const res = await api.get(`/api/v1/courses/${id}/materials`);
    setMaterials(res.data.data);
  };

  const fetchAssignments = async () => {
    const res = await api.get(`/api/v1/assignments?course=${id}`);
    setAssignments(res.data.data);
  };

  // -- Course editing --
  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    await api.put(`/api/v1/courses/${id}`, form);
    setEditing(false);
    fetchCourse();
  };

  // -- Materials --
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', selectedFile);
    fd.append('title', uploadTitle);
    fd.append('description', uploadDesc);
    await api.post(`/api/v1/courses/${id}/materials`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setUploadTitle(''); setUploadDesc(''); setSelectedFile(null); setUploading(false);
    fetchMaterials();
  };

  const handleDeleteMaterial = async (matId) => {
    if (!window.confirm('Delete this material?')) return;
    await api.delete(`/api/v1/courses/${id}/materials/${matId}`);
    fetchMaterials();
  };

  // -- Assignments --
  const openAssignForm = (assignment = null) => {
    if (assignment) {
      setEditAssignmentId(assignment._id);
      setAssignForm({
        teacher: assignment.teacher._id,
        class: assignment.class._id,
      });
    } else {
      setEditAssignmentId(null);
      setAssignForm({ teacher: '', class: '' });
    }
    setShowAssignForm(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      course: id,
      teacher: assignForm.teacher,
      class: assignForm.class,
    };
    if (editAssignmentId) {
      await api.put(`/api/v1/assignments/${editAssignmentId}`, payload);
    } else {
      await api.post('/api/v1/assignments', payload);
    }
    setShowAssignForm(false);
    fetchAssignments();
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Remove this assignment?')) return;
    await api.delete(`/api/v1/assignments/${assignmentId}`);
    fetchAssignments();
  };

  if (!course) return <div className="spinner" />;

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => navigate('/admin/courses')} style={{ marginBottom: '1rem' }}>
        <FiArrowLeft /> Back to Courses
      </button>

      {/* Banner */}
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

      {/* Course Details Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Course Details</h3>
          <button className="btn btn-sm btn-secondary" onClick={() => setEditing(!editing)}>
            {editing ? <FiX /> : <FiEdit />} {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>
        {editing ? (
          <form onSubmit={handleUpdateCourse} className="form-grid" style={{ marginTop: '1rem' }}>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Course Name" required />
            <input value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="Code" />
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" rows={3} style={{ gridColumn: '1 / -1' }} />
            <button type="submit" className="btn btn-primary"><FiSave /> Save Changes</button>
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
        <form onSubmit={handleUpload} className="form-grid" style={{ marginBottom: '1.5rem' }}>
          <input type="text" placeholder="Title (optional)" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} />
          <input type="text" placeholder="Description (optional)" value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} />
          <input type="file" onChange={e => setSelectedFile(e.target.files[0])} accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt" required />
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            <FiUpload /> {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
        {materials.length === 0 ? (
          <p className="text-muted">No materials uploaded yet.</p>
        ) : (
          <div className="materials-grid">
            {materials.map(mat => (
              <div key={mat._id} className="material-item">
                {mat.fileType === 'image' ? (
                  <img src={`http://localhost:5000/${mat.file}`} alt={mat.title} className="material-image" />
                ) : (
                  <div className="material-file"><span>{mat.fileType.toUpperCase()}</span></div>
                )}
                <div className="material-info">
                  <h4>{mat.title}</h4>
                  <p>{mat.description}</p>
                  <a href={`http://localhost:5000/${mat.file}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">
                    {mat.fileType === 'image' ? 'View Full' : 'Download'}
                  </a>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteMaterial(mat._id)} style={{ marginLeft: '0.5rem' }}>
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Teacher Assignments Section */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Teacher Assignments</h3>
          <button className="btn btn-sm btn-primary" onClick={() => openAssignForm()}><FiPlus /> Add Assignment</button>
        </div>

        {showAssignForm && (
          <div className="modal-backdrop" onClick={() => setShowAssignForm(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>{editAssignmentId ? 'Edit Assignment' : 'New Assignment'}</h3>
              <form onSubmit={handleAssignSubmit} className="form-grid">
                <select value={assignForm.teacher} onChange={e => setAssignForm({...assignForm, teacher: e.target.value})} required>
                  <option value="">Select Teacher</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.fullName}</option>)}
                </select>
                <select value={assignForm.class} onChange={e => setAssignForm({...assignForm, class: e.target.value})} required>
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <button type="submit" className="btn btn-primary">{editAssignmentId ? 'Update' : 'Assign'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAssignForm(false)}>Cancel</button>
              </form>
            </div>
          </div>
        )}

        {assignments.length === 0 ? (
          <p className="text-muted">No teacher assigned to this course yet.</p>
        ) : (
          <table className="mini-table" style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Class</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a._id}>
                  <td>{a.teacher?.fullName}</td>
                  <td>{a.class?.name}</td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => openAssignForm(a)}><FiEdit /></button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteAssignment(a._id)} style={{ marginLeft: '0.5rem' }}><FiTrash2 /></button>
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

export default CourseDetail;