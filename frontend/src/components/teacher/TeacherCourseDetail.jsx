import { useContext, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiUpload,
  FiTrash2,
  FiFile,
  FiMessageSquare,
  FiBookOpen,
  FiEdit,
  FiAlertTriangle,
  FiInbox,
  FiX,
  FiDownload,
} from 'react-icons/fi';

import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import bgImage from '../../assets/L.png';
import './TeacherCourseDetail.css';

/* Helper: build the authenticated download URL */
const getFileUrl = (filePath) => {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const filename = filePath.split('/').pop();
  return `${base}/api/v1/files/${filename}`;
};

/* Fetch file with auth, then open in new tab or download */
const handleFileClick = async (filePath, fileType) => {
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
    alert('Unable to access the file. Please try again.');
  }
};

const TABS = [
  { id: 'material', label: 'Materials', icon: FiBookOpen },
  { id: 'homework', label: 'Homework', icon: FiEdit },
  { id: 'message', label: 'Messages', icon: FiMessageSquare },
];

const TeacherCourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const fileInputRef = useRef(null);

  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [activeTab, setActiveTab] = useState('material');
  
  const [form, setForm] = useState({ title: '', description: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [isFetchingCourse, setIsFetchingCourse] = useState(true);
  const [isFetchingMaterials, setIsFetchingMaterials] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [courseError, setCourseError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    const loadData = async () => {
      setIsFetchingCourse(true);
      setIsFetchingMaterials(true);
      setCourseError(null);

      try {
        const courseRes = await api.get(`/api/v1/courses/${id}`);
        if (isMounted) setCourse(courseRes.data?.data || null);
      } catch (err) {
        if (isMounted) setCourseError('Unable to load course details.');
      } finally {
        if (isMounted) setIsFetchingCourse(false);
      }

      try {
        const matRes = await api.get(`/api/v1/courses/${id}/materials`);
        if (isMounted) setMaterials(matRes.data?.data || []);
      } catch (err) {
        console.error('Failed to load materials:', err);
      } finally {
        if (isMounted) setIsFetchingMaterials(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [id]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.title && !selectedFile) {
      alert('Please provide a title or attach a file.');
      return;
    }

    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('type', activeTab);
    if (selectedFile) fd.append('file', selectedFile);

    setIsUploading(true);
    try {
      await api.post(`/api/v1/courses/${id}/materials`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Reset form
      setForm({ title: '', description: '' });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Refresh list
      const matRes = await api.get(`/api/v1/courses/${id}/materials`);
      setMaterials(matRes.data?.data || []);
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/api/v1/courses/${id}/materials/${materialId}`);
      setMaterials((prev) => prev.filter((m) => m._id !== materialId));
    } catch (err) {
      alert('Failed to delete item.');
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredMaterials = materials.filter((m) => m.type === activeTab);
  const ActiveTabIcon = TABS.find((t) => t.id === activeTab)?.icon || FiFile;

  return (
    <section className="tcd-page">
      <div className="tcd-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="tcd-overlay" aria-hidden="true" />

      <header className="tcd-header">
        <button className="tcd-back-btn" onClick={() => navigate('/teacher/courses')}>
          <FiArrowLeft size={18} /> Back to My Courses
        </button>

        {isFetchingCourse ? (
          <div className="tcd-state" role="status">
            <span className="tcd-spinner" aria-hidden="true" />
            <p>Loading course…</p>
          </div>
        ) : courseError ? (
          <div className="tcd-state tcd-state--error" role="alert">
            <FiAlertTriangle size={30} aria-hidden="true" />
            <h3>Course Not Found</h3>
            <p>{courseError}</p>
          </div>
        ) : !course ? null : (
          <div className="tcd-course-info">
            <h1 className="tcd-title">{course.name}</h1>
            <div className="tcd-meta">
              {course.code && <span className="tcd-badge">Code: {course.code}</span>}
              <span className="tcd-badge tcd-badge--gold">
                <ActiveTabIcon size={14} /> {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}s
              </span>
            </div>
            {course.description && <p className="tcd-desc">{course.description}</p>}
          </div>
        )}
      </header>

      {!isFetchingCourse && course && (
        <>
          <nav className="tcd-tabs" role="tablist">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`tcd-tab ${activeTab === tab.id ? 'tcd-tab--active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={16} aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="tcd-content">
            {/* Upload Form */}
            <div className="tcd-card tcd-form-card">
              <h2 className="tcd-card-title">
                Add New {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h2>
              <form onSubmit={handleUpload} className="tcd-form">
                <div className="tcd-form-group">
                  <label htmlFor="tcd-title" className="tcd-label">
                    Title {activeTab !== 'message' && <span className="tcd-required">*</span>}
                  </label>
                  <input
                    id="tcd-title"
                    type="text"
                    className="tcd-input"
                    placeholder="Enter a descriptive title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required={activeTab !== 'message'}
                  />
                </div>

                <div className="tcd-form-group">
                  <label htmlFor="tcd-desc" className="tcd-label">
                    Description
                  </label>
                  <textarea
                    id="tcd-desc"
                    className="tcd-textarea"
                    placeholder="Add details or instructions (optional)"
                    rows="3"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                {(activeTab === 'material' || activeTab === 'homework') && (
                  <div className="tcd-form-group">
                    <label className="tcd-label">Attachment</label>
                    <div className="tcd-file-drop">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                        accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
                        id="tcd-file"
                        hidden
                      />
                      <label htmlFor="tcd-file" className="tcd-file-label">
                        {selectedFile ? (
                          <>
                            <FiFile size={16} />
                            <span className="tcd-file-name">{selectedFile.name}</span>
                            <button
                              type="button"
                              className="tcd-file-clear"
                              onClick={(e) => { e.preventDefault(); clearFile(); }}
                              aria-label="Remove file"
                            >
                              <FiX size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <FiUpload size={16} />
                            <span>Click to select a file</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                <button type="submit" className="tcd-btn tcd-btn--primary" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <span className="tcd-spinner tcd-spinner--sm" aria-hidden="true" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <FiUpload size={16} /> Post {activeTab}
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Materials List */}
            <div className="tcd-card tcd-list-card">
              <h2 className="tcd-card-title">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}s
                <span className="tcd-count">{filteredMaterials.length}</span>
              </h2>

              <div className="tcd-list-body">
                {isFetchingMaterials ? (
                  <div className="tcd-state" role="status">
                    <span className="tcd-spinner" aria-hidden="true" />
                    <p>Loading items…</p>
                  </div>
                ) : filteredMaterials.length === 0 ? (
                  <div className="tcd-state">
                    <FiInbox size={32} aria-hidden="true" />
                    <h3>No {activeTab}s yet</h3>
                    <p>Use the form above to add your first item.</p>
                  </div>
                ) : (
                  <div className="tcd-table-wrapper">
                    <table className="tcd-table">
                      <thead>
                        <tr>
                          <th scope="col">Title</th>
                          <th scope="col">Description</th>
                          <th scope="col">File</th>
                          <th scope="col" className="tcd-text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMaterials.map((item) => (
                          <tr key={item._id}>
                            <td data-label="Title">
                              <div className="tcd-item-title">
                                {item.title}
                              </div>
                            </td>
                            <td data-label="Description">
                              <span className="tcd-item-desc">
                                {item.description || '—'}
                              </span>
                            </td>
                            <td data-label="File">
                              {item.file ? (
                                <button
                                  className="tcd-btn tcd-btn--sm tcd-btn--ghost"
                                  onClick={() => handleFileClick(item.file, item.fileType)}
                                >
                                  <FiDownload size={14} /> {item.fileType || 'Download'}
                                </button>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td data-label="Actions" className="tcd-text-right">
                              <button
                                className="tcd-btn tcd-btn--sm tcd-btn--danger"
                                onClick={() => handleDelete(item._id)}
                                title="Delete item"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default TeacherCourseDetail;