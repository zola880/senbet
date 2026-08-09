import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiEdit2, FiTrash2, FiUpload, FiSave, FiX, FiPlus,
  FiFile, FiEye, FiDownload, FiAlertTriangle, FiRefreshCw, FiImage,
  FiUsers, FiBookOpen, FiCheckCircle, FiChevronDown
} from 'react-icons/fi';

import api from '../../services/api';
import bgImage from '../../assets/L.png';
import './CourseDetail.css';

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
    showToast('error', 'Unable to access the file.');
  }
};

/* --------------------------------------------------------------------------
   Data Hook
   -------------------------------------------------------------------------- */
const useCourseDetail = (id) => {
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const reload = useCallback(async () => {
    if (!id) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;

    setStatus('loading');
    setError(null);

    try {
      const [courseRes, matRes, assignRes, teachRes, classRes] = await Promise.all([
        api.get(`/api/v1/courses/${id}`, { signal }),
        api.get(`/api/v1/courses/${id}/materials`, { signal }),
        api.get(`/api/v1/assignments?course=${id}`, { signal }),
        api.get('/api/v1/users?role=teacher', { signal }),
        api.get('/api/v1/classes', { signal }),
      ]);

      setCourse(courseRes.data?.data || null);
      setMaterials(Array.isArray(matRes.data?.data) ? matRes.data.data : []);
      setAssignments(Array.isArray(assignRes.data?.data) ? assignRes.data.data : []);
      setTeachers(Array.isArray(teachRes.data?.data) ? teachRes.data.data : []);
      setClasses(Array.isArray(classRes.data?.data) ? classRes.data.data : []);
      setStatus('success');
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
      console.error('Failed to load course details:', err);
      setError('Unable to load course details.');
      setStatus('error');
    }
  }, [id]);

  useEffect(() => {
    reload();
    return () => abortRef.current?.abort();
  }, [reload]);

  return { course, materials, assignments, teachers, classes, status, error, reload, setMaterials, setAssignments, setCourse };
};

/* --------------------------------------------------------------------------
   Assignment Modal
   -------------------------------------------------------------------------- */
const AssignmentModal = ({ isOpen, onClose, onSubmit, initialData, teachers, classes, isSaving }) => {
  const [formData, setFormData] = useState({ teacher: '', class: '' });
  const selectRef = useRef(null);
  const isEditing = Boolean(initialData);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        teacher: initialData?.teacher?._id || '',
        class: initialData?.class?._id || '',
      });
      setTimeout(() => selectRef.current?.focus(), 50);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="cd-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="cd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cd-modal-header">
          <h2>{isEditing ? 'Edit Assignment' : 'Assign Teacher'}</h2>
          <button className="cd-modal-close" onClick={onClose} aria-label="Close modal"><FiX size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="cd-form">
          <div className="cd-form-group">
            <label htmlFor="cd-teacher" className="cd-label">Teacher <span className="cd-required">*</span></label>
            <div className="cd-select-wrapper">
              <select id="cd-teacher" ref={selectRef} className="cd-select" value={formData.teacher} onChange={(e) => setFormData({ ...formData, teacher: e.target.value })} required>
                <option value="">Select Teacher</option>
                {teachers.map(t => <option key={t._id} value={t._id}>{t.fullName}</option>)}
              </select>
              <FiChevronDown className="cd-select-icon" />
            </div>
          </div>

          <div className="cd-form-group">
            <label htmlFor="cd-class" className="cd-label">Class <span className="cd-required">*</span></label>
            <div className="cd-select-wrapper">
              <select id="cd-class" className="cd-select" value={formData.class} onChange={(e) => setFormData({ ...formData, class: e.target.value })} required>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <FiChevronDown className="cd-select-icon" />
            </div>
          </div>

          <div className="cd-form-actions">
            <button type="button" className="cd-btn cd-btn--ghost" onClick={onClose} disabled={isSaving}>Cancel</button>
            <button type="submit" className="cd-btn cd-btn--primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : (isEditing ? 'Update' : 'Assign')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   Main Component
   -------------------------------------------------------------------------- */
const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const { course, materials, assignments, teachers, classes, status, error, reload, setMaterials, setAssignments, setCourse } = useCourseDetail(id);
  
  const [editingCourse, setEditingCourse] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [isSavingCourse, setIsSavingCourse] = useState(false);

  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);

  const [toast, setToast] = useState({ type: '', message: '' });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

  useEffect(() => {
    if (course) {
      setForm({
        name: course.name || '',
        code: course.code || '',
        description: course.description || '',
      });
    }
  }, [course]);

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    setIsSavingCourse(true);
    try {
      const res = await api.put(`/api/v1/courses/${id}`, form);
      setCourse(res.data?.data || form);
      setEditingCourse(false);
      showToast('success', 'Course details updated.');
    } catch (err) {
      showToast('error', 'Failed to update course.');
    } finally {
      setIsSavingCourse(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('error', 'Please select a file to upload.');
      return;
    }
    setIsUploading(true);
    const fd = new FormData();
    fd.append('file', selectedFile);
    fd.append('title', uploadTitle);
    fd.append('description', uploadDesc);
    
    try {
      await api.post(`/api/v1/courses/${id}/materials`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('success', 'Material uploaded successfully.');
      setUploadTitle(''); setUploadDesc(''); setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      const matRes = await api.get(`/api/v1/courses/${id}/materials`);
      setMaterials(Array.isArray(matRes.data?.data) ? matRes.data.data : []);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMaterial = async (matId) => {
    if (!window.confirm('Delete this material?')) return;
    try {
      await api.delete(`/api/v1/courses/${id}/materials/${matId}`);
      setMaterials((prev) => prev.filter((m) => m._id !== matId));
      showToast('success', 'Material deleted.');
    } catch (err) {
      showToast('error', 'Failed to delete material.');
    }
  };

  const openAssignModal = (assignment = null) => {
    setEditingAssignment(assignment);
    setModalOpen(true);
  };

  const handleAssignSubmit = async (formData) => {
    setIsSavingAssignment(true);
    const payload = { course: id, teacher: formData.teacher, class: formData.class };
    try {
      if (editingAssignment) {
        await api.put(`/api/v1/assignments/${editingAssignment._id}`, payload);
        showToast('success', 'Assignment updated.');
      } else {
        await api.post('/api/v1/assignments', payload);
        showToast('success', 'Teacher assigned successfully.');
      }
      setModalOpen(false);
      const assignRes = await api.get(`/api/v1/assignments?course=${id}`);
      setAssignments(Array.isArray(assignRes.data?.data) ? assignRes.data.data : []);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to save assignment.');
    } finally {
      setIsSavingAssignment(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Remove this assignment?')) return;
    try {
      await api.delete(`/api/v1/assignments/${assignmentId}`);
      setAssignments((prev) => prev.filter((a) => a._id !== assignmentId));
      showToast('success', 'Assignment removed.');
    } catch (err) {
      showToast('error', 'Failed to remove assignment.');
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (status === 'loading' && !course) {
    return (
      <section className="cd-page">
        <div className="cd-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
        <div className="cd-wash" aria-hidden="true" />
        <div className="cd-state">
          <span className="cd-spinner" aria-hidden="true" />
          <p>Loading course details…</p>
        </div>
      </section>
    );
  }

  if (status === 'error' && !course) {
    return (
      <section className="cd-page">
        <div className="cd-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
        <div className="cd-wash" aria-hidden="true" />
        <div className="cd-state cd-state--error" role="alert">
          <FiAlertTriangle size={32} />
          <h3>Failed to load course</h3>
          <p>{error}</p>
          <button className="cd-btn cd-btn--primary" onClick={reload}><FiRefreshCw size={16} /> Try Again</button>
        </div>
      </section>
    );
  }

  return (
    <section className="cd-page">
      <div className="cd-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="cd-wash" aria-hidden="true" />

      {toast.message && (
        <div className={`cd-toast cd-toast--${toast.type}`} role="alert">
          {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button className="cd-toast-close" onClick={() => setToast({ type: '', message: '' })} aria-label="Close"><FiX size={16} /></button>
        </div>
      )}

      <main className="cd-content">
        <button className="cd-back-btn" onClick={() => navigate('/admin/courses')}>
          <FiArrowLeft size={18} /> Back to Courses
        </button>

        <header className="cd-header">
          <div className="cd-header-icon" aria-hidden="true"><FiBookOpen size={28} /></div>
          <div>
            <h1 className="cd-title">{course.name}</h1>
            {course.code && <span className="cd-code-badge">{course.code}</span>}
          </div>
        </header>

        {/* Course Details Card */}
        <div className="cd-card">
          <div className="cd-card-header">
            <h2 className="cd-card-title">Course Details</h2>
            <button className="cd-btn cd-btn--ghost cd-btn--sm" onClick={() => setEditingCourse(!editingCourse)}>
              {editingCourse ? <><FiX size={16} /> Cancel</> : <><FiEdit2 size={16} /> Edit</>}
            </button>
          </div>

          {editingCourse ? (
            <form onSubmit={handleUpdateCourse} className="cd-form">
              <div className="cd-form-group">
                <label className="cd-label">Course Name</label>
                <input className="cd-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="cd-form-group">
                <label className="cd-label">Code</label>
                <input className="cd-input" value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
              </div>
              <div className="cd-form-group">
                <label className="cd-label">Description</label>
                <textarea className="cd-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} />
              </div>
              <button type="submit" className="cd-btn cd-btn--primary" disabled={isSavingCourse}>
                {isSavingCourse ? 'Saving...' : <><FiSave size={16} /> Save Changes</>}
              </button>
            </form>
          ) : (
            <div className="cd-details-grid">
              <div><strong>Code:</strong> {course.code || '—'}</div>
              <div><strong>Description:</strong> {course.description || '—'}</div>
            </div>
          )}
        </div>

        {/* Materials Card */}
        <div className="cd-card">
          <h2 className="cd-card-title">Course Materials</h2>
          
          <form onSubmit={handleUpload} className="cd-upload-form">
            <input type="text" className="cd-input" placeholder="Title (optional)" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} />
            <input type="text" className="cd-input" placeholder="Description (optional)" value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} />
            
            <div className="cd-file-drop">
              <input type="file" ref={fileInputRef} onChange={e => setSelectedFile(e.target.files[0])} accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt" id="cd-file" hidden />
              <label htmlFor="cd-file" className="cd-file-label">
                {selectedFile ? (
                  <>
                    <FiFile size={16} />
                    <span className="cd-file-name">{selectedFile.name}</span>
                    <button type="button" className="cd-file-clear" onClick={(e) => { e.preventDefault(); clearFile(); }} aria-label="Remove file"><FiX size={16} /></button>
                  </>
                ) : (
                  <><FiUpload size={16} /> Click to select a file</>
                )}
              </label>
            </div>

            <button type="submit" className="cd-btn cd-btn--primary" disabled={isUploading}>
              {isUploading ? <><span className="cd-spinner cd-spinner--sm" /> Uploading...</> : <><FiUpload size={16} /> Upload</>}
            </button>
          </form>

          {materials.length === 0 ? (
            <p className="cd-muted">No materials uploaded yet.</p>
          ) : (
            <div className="cd-materials-grid">
              {materials.map(mat => (
                <div key={mat._id} className="cd-material-card">
                  <div className="cd-material-preview">
                    {mat.fileType === 'image' ? <FiImage size={32} /> : <FiFile size={32} />}
                  </div>
                  <div className="cd-material-info">
                    <h4>{mat.title || 'Untitled'}</h4>
                    <p>{mat.description || 'No description'}</p>
                    <div className="cd-material-actions">
                      <button className="cd-btn cd-btn--sm cd-btn--ghost" onClick={() => handleFileAction(mat.file, mat.fileType, showToast)}>
                        {mat.fileType === 'image' ? <><FiEye size={14} /> View</> : <><FiDownload size={14} /> Download</>}
                      </button>
                      <button className="cd-btn cd-btn--sm cd-btn--danger" onClick={() => handleDeleteMaterial(mat._id)}>
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assignments Card */}
        <div className="cd-card">
          <div className="cd-card-header">
            <h2 className="cd-card-title">Teacher Assignments</h2>
            <button className="cd-btn cd-btn--primary cd-btn--sm" onClick={() => openAssignModal()}>
              <FiPlus size={16} /> Add Assignment
            </button>
          </div>

          {assignments.length === 0 ? (
            <p className="cd-muted">No teacher assigned to this course yet.</p>
          ) : (
            <div className="cd-table-wrapper">
              <table className="cd-table">
                <thead>
                  <tr>
                    <th>Teacher</th>
                    <th>Class</th>
                    <th className="cd-th-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(a => (
                    <tr key={a._id}>
                      <td data-label="Teacher">{a.teacher?.fullName || 'Unknown'}</td>
                      <td data-label="Class">{a.class?.name || 'Unknown'}</td>
                      <td data-label="Actions" className="cd-td-actions">
                        <button className="cd-icon-btn" onClick={() => openAssignModal(a)} title="Edit"><FiEdit2 size={16} /></button>
                        <button className="cd-icon-btn cd-icon-btn--danger" onClick={() => handleDeleteAssignment(a._id)} title="Delete"><FiTrash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <AssignmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAssignSubmit}
        initialData={editingAssignment}
        teachers={teachers}
        classes={classes}
        isSaving={isSavingAssignment}
      />
    </section>
  );
};

export default CourseDetail;