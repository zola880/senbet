import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FiAlertTriangle, FiCheckCircle, FiChevronDown, FiClock,
  FiEdit2, FiInbox, FiPhone, FiPlus, FiRefreshCw, FiSearch,
  FiTrash2, FiUser, FiX, FiCalendar
} from 'react-icons/fi';

import api from '../../services/api';
import bgImage from '../../assets/L.png';
import './ChurchClothRegistry.css';

/* --------------------------------------------------------------------------
   Data Hook: Fetch Church Cloth Records
   -------------------------------------------------------------------------- */
const useChurchClothRecords = () => {
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const reload = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setError(null);

    try {
      const res = await api.get('/api/v1/church-cloth', { signal: controller.signal });
      setRecords(Array.isArray(res.data?.data) ? res.data.data : []);
      setStatus('success');
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
      console.error('Failed to load cloth records:', err);
      setError('Unable to load cloth records. Please try again.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    reload();
    return () => abortRef.current?.abort();
  }, [reload]);

  return { records, status, error, reload, setRecords };
};

/* --------------------------------------------------------------------------
   Modal Component
   -------------------------------------------------------------------------- */
const ChurchClothModal = ({ isOpen, onClose, onSubmit, initialData, isSaving }) => {
  const emptyForm = {
    borrowerName: '',
    phoneNumber: '',
    borrowedDate: new Date().toISOString().slice(0, 10),
    expectedReturnDate: '',
    returnedAt: '',
    status: 'borrowed',
    notes: '',
  };

  const [formData, setFormData] = useState(emptyForm);
  const inputRef = useRef(null);
  const isEditing = Boolean(initialData);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          borrowerName: initialData.borrowerName || '',
          phoneNumber: initialData.phoneNumber || '',
          borrowedDate: initialData.borrowedDate ? new Date(initialData.borrowedDate).toISOString().slice(0, 10) : '',
          expectedReturnDate: initialData.expectedReturnDate ? new Date(initialData.expectedReturnDate).toISOString().slice(0, 10) : '',
          returnedAt: initialData.returnedAt ? new Date(initialData.returnedAt).toISOString().slice(0, 10) : '',
          status: initialData.status || 'borrowed',
          notes: initialData.notes || '',
        });
      } else {
        setFormData(emptyForm);
      }
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      borrowedDate: formData.borrowedDate || null,
      expectedReturnDate: formData.expectedReturnDate || null,
      returnedAt: formData.returnedAt || null,
    };
    onSubmit(payload);
  };

  return (
    <div className="ccr-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ccr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ccr-modal-header">
          <h2>{isEditing ? 'Edit Cloth Record' : 'Register Cloth Borrower'}</h2>
          <button className="ccr-modal-close" onClick={onClose} aria-label="Close modal">
            <FiX size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="ccr-form">
          <div className="ccr-form-grid">
            <div className="ccr-form-group">
              <label htmlFor="ccr-borrowerName" className="ccr-label">
                Borrower Name <span className="ccr-required">*</span>
              </label>
              <input
                id="ccr-borrowerName"
                ref={inputRef}
                name="borrowerName"
                type="text"
                className="ccr-input"
                placeholder="e.g., John Doe"
                value={formData.borrowerName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="ccr-form-group">
              <label htmlFor="ccr-phoneNumber" className="ccr-label">Phone Number</label>
              <input
                id="ccr-phoneNumber"
                name="phoneNumber"
                type="tel"
                className="ccr-input"
                placeholder="e.g., +251 912 345 678"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>

            <div className="ccr-form-group">
              <label htmlFor="ccr-borrowedDate" className="ccr-label">
                Borrowed Date <span className="ccr-required">*</span>
              </label>
              <input
                id="ccr-borrowedDate"
                name="borrowedDate"
                type="date"
                className="ccr-input"
                value={formData.borrowedDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="ccr-form-group">
              <label htmlFor="ccr-expectedReturnDate" className="ccr-label">Expected Return Date</label>
              <input
                id="ccr-expectedReturnDate"
                name="expectedReturnDate"
                type="date"
                className="ccr-input"
                value={formData.expectedReturnDate}
                onChange={handleChange}
              />
            </div>

            <div className="ccr-form-group">
              <label htmlFor="ccr-returnedAt" className="ccr-label">Returned Date</label>
              <input
                id="ccr-returnedAt"
                name="returnedAt"
                type="date"
                className="ccr-input"
                value={formData.returnedAt}
                onChange={handleChange}
              />
            </div>

            <div className="ccr-form-group">
              <label htmlFor="ccr-status" className="ccr-label">Status</label>
              <div className="ccr-select-wrapper">
                <select
                  id="ccr-status"
                  name="status"
                  className="ccr-select"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="borrowed">Borrowed</option>
                  <option value="returned">Returned</option>
                </select>
                <FiChevronDown className="ccr-select-icon" />
              </div>
            </div>
          </div>

          <div className="ccr-form-group">
            <label htmlFor="ccr-notes" className="ccr-label">Notes</label>
            <textarea
              id="ccr-notes"
              name="notes"
              className="ccr-textarea"
              placeholder="Additional details or remarks..."
              rows="3"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          <div className="ccr-form-actions">
            <button type="button" className="ccr-btn ccr-btn--ghost" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="ccr-btn ccr-btn--primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : (isEditing ? 'Update Record' : 'Register Borrower')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   Confirm Modal
   -------------------------------------------------------------------------- */
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, isConfirming }) => {
  if (!isOpen) return null;
  return (
    <div className="ccr-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ccr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ccr-modal-header">
          <h2>{title}</h2>
          <button className="ccr-modal-close" onClick={onClose} aria-label="Close modal">
            <FiX size={20} />
          </button>
        </div>
        <div className="ccr-confirm-body">
          <p>{message}</p>
          <div className="ccr-form-actions">
            <button className="ccr-btn ccr-btn--ghost" onClick={onClose} disabled={isConfirming}>
              Cancel
            </button>
            <button className="ccr-btn ccr-btn--danger" onClick={onConfirm} disabled={isConfirming}>
              {isConfirming ? 'Deleting...' : 'Delete Record'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   Main Component
   -------------------------------------------------------------------------- */
const ChurchClothRegistry = () => {
  const { records, status, error, reload, setRecords } = useChurchClothRecords();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState({ type: '', message: '' });

  const isLoading = status === 'loading';
  const hasRecords = records.length > 0;

  const filteredRecords = records.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.borrowerName?.toLowerCase().includes(q) ||
      r.phoneNumber?.toLowerCase().includes(q) ||
      r.status?.toLowerCase().includes(q)
    );
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

  const openNewModal = () => {
    setEditingRecord(null);
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRecord(null);
  };

  const openDeleteModal = (record) => {
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeletingRecord(null);
  };

  const handleSave = async (payload) => {
    setIsSaving(true);
    try {
      if (editingRecord) {
        await api.put(`/api/v1/church-cloth/${editingRecord._id}`, payload);
        showToast('success', 'Record updated successfully.');
      } else {
        await api.post('/api/v1/church-cloth', payload);
        showToast('success', 'Borrower registered successfully.');
      }
      closeModal();
      reload();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Unable to save record.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/v1/church-cloth/${deletingRecord._id}`);
      showToast('success', 'Record deleted successfully.');
      closeDeleteModal();
      reload();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Unable to delete record.');
    } finally {
      setIsDeleting(false);
    }
  };

  const markReturned = async (record) => {
    try {
      await api.put(`/api/v1/church-cloth/${record._id}`, {
        status: 'returned',
        returnedAt: new Date().toISOString(),
      });
      showToast('success', `"${record.borrowerName}" marked as returned.`);
      reload();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Unable to update return status.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <section className="ccr-page">
      <div className="ccr-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="ccr-wash" aria-hidden="true" />

      {toast.message && (
        <div className={`ccr-toast ccr-toast--${toast.type}`} role="alert">
          {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button className="ccr-toast-close" onClick={() => setToast({ type: '', message: '' })} aria-label="Close">
            <FiX size={16} />
          </button>
        </div>
      )}

      <main className="ccr-content">
        <header className="ccr-header">
          <div>
            <h1 className="ccr-title">Church Cloth Registry</h1>
            <p className="ccr-subtitle">
              Register anyone who takes the church cloth and track when they return it after washing it.
            </p>
          </div>
          <button className="ccr-btn ccr-btn--primary" onClick={openNewModal}>
            <FiPlus size={18} /> Register Borrower
          </button>
        </header>

        {hasRecords && (
          <div className="ccr-toolbar">
            <div className="ccr-search">
              <FiSearch className="ccr-search-icon" size={16} aria-hidden="true" />
              <input
                type="search"
                className="ccr-search-input"
                placeholder="Search by name, phone, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search records"
              />
            </div>
          </div>
        )}

        {isLoading && !hasRecords ? (
          <div className="ccr-state" role="status">
            <span className="ccr-spinner" aria-hidden="true" />
            <p>Loading cloth records…</p>
          </div>
        ) : status === 'error' && !hasRecords ? (
          <div className="ccr-state ccr-state--error" role="alert">
            <FiAlertTriangle size={32} />
            <h3>Failed to load records</h3>
            <p>{error}</p>
            <button className="ccr-btn ccr-btn--primary" onClick={reload}>
              <FiRefreshCw size={16} /> Try Again
            </button>
          </div>
        ) : !hasRecords ? (
          <div className="ccr-state">
            <FiInbox size={40} />
            <h3>No cloth records yet</h3>
            <p>Get started by registering your first borrower.</p>
            <button className="ccr-btn ccr-btn--primary" onClick={openNewModal}>
              <FiPlus size={16} /> Register First Borrower
            </button>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="ccr-state">
            <FiSearch size={40} />
            <h3>No matches found</h3>
            <p>No records match "{searchQuery}".</p>
            <button className="ccr-btn ccr-btn--ghost" onClick={() => setSearchQuery('')}>
              Clear Search
            </button>
          </div>
        ) : (
          <div className="ccr-table-wrapper">
            <table className="ccr-table">
              <thead>
                <tr>
                  <th>Borrower</th>
                  <th>Phone</th>
                  <th>Borrowed On</th>
                  <th>Expected Return</th>
                  <th>Status</th>
                  <th className="ccr-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record._id}>
                    <td data-label="Borrower">
                      <div className="ccr-borrower-cell">
                        <span className="ccr-avatar" aria-hidden="true">
                          {record.borrowerName?.charAt(0).toUpperCase() || '?'}
                        </span>
                        <span className="ccr-borrower-name">{record.borrowerName}</span>
                      </div>
                    </td>
                    <td data-label="Phone">
                      {record.phoneNumber ? (
                        <span className="ccr-phone-cell">
                          <FiPhone size={14} />
                          {record.phoneNumber}
                        </span>
                      ) : '—'}
                    </td>
                    <td data-label="Borrowed On">
                      <span className="ccr-date-cell">
                        <FiCalendar size={14} />
                        {formatDate(record.borrowedDate)}
                      </span>
                    </td>
                    <td data-label="Expected Return">
                      {formatDate(record.expectedReturnDate)}
                    </td>
                    <td data-label="Status">
                      <span className={`ccr-status-badge ${record.status === 'returned' ? 'ccr-status-returned' : 'ccr-status-borrowed'}`}>
                        {record.status === 'returned' ? (
                          <><FiCheckCircle size={14} /> Returned</>
                        ) : (
                          <><FiClock size={14} /> Borrowed</>
                        )}
                      </span>
                    </td>
                    <td data-label="Actions" className="ccr-td-actions">
                      <div className="ccr-actions">
                        {record.status !== 'returned' && (
                          <button
                            className="ccr-icon-btn ccr-icon-btn--success"
                            onClick={() => markReturned(record)}
                            title="Mark as Returned"
                            aria-label={`Mark ${record.borrowerName} as returned`}
                          >
                            <FiCheckCircle size={16} />
                          </button>
                        )}
                        <button
                          className="ccr-icon-btn"
                          onClick={() => openEditModal(record)}
                          title="Edit"
                          aria-label={`Edit ${record.borrowerName}`}
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          className="ccr-icon-btn ccr-icon-btn--danger"
                          onClick={() => openDeleteModal(record)}
                          title="Delete"
                          aria-label={`Delete ${record.borrowerName}`}
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <ChurchClothModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleSave}
        initialData={editingRecord}
        isSaving={isSaving}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Delete Record"
        message={`Are you sure you want to delete the record for "${deletingRecord?.borrowerName}"? This action cannot be undone.`}
        isConfirming={isDeleting}
      />
    </section>
  );
};

export default ChurchClothRegistry;