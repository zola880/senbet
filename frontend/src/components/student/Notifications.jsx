import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiAlertTriangle, FiBell, FiCheck, FiCheckCircle,
  FiInbox, FiRefreshCw, FiTrash2, FiX
} from 'react-icons/fi';

import api from '../../services/api';
import bgImage from '../../assets/L.png';
import './Notifications.css';

/* --------------------------------------------------------------------------
   Data Hook: Notifications
   -------------------------------------------------------------------------- */
const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
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
      const res = await api.get('/api/v1/notifications', { signal: controller.signal });
      setNotifications(Array.isArray(res.data?.data) ? res.data.data : []);
      setStatus('success');
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
      console.error('Failed to load notifications:', err);
      setError('Unable to load your notifications. Please try again.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    reload();
    return () => abortRef.current?.abort();
  }, [reload]);

  return { notifications, status, error, reload, setNotifications };
};

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

/* --------------------------------------------------------------------------
   Main Component
   -------------------------------------------------------------------------- */
const Notifications = () => {
  const { notifications, status, error, reload, setNotifications } = useNotifications();
  const [toast, setToast] = useState({ type: '', message: '' });

  const isLoading = status === 'loading';
  const hasNotifications = notifications.length > 0;

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/api/v1/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      showToast('success', 'All notifications marked as read.');
    } catch (err) {
      showToast('error', 'Failed to mark all as read.');
    }
  };

  const handleMarkOne = async (id) => {
    try {
      await api.put(`/api/v1/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      showToast('success', 'Notification marked as read.');
    } catch (err) {
      showToast('error', 'Failed to mark notification as read.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/v1/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      showToast('success', 'Notification deleted.');
    } catch (err) {
      showToast('error', 'Failed to delete notification.');
    }
  };

  // Loading State
  if (isLoading && !hasNotifications) {
    return (
      <section className="ntf-page">
        <div className="ntf-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
        <div className="ntf-wash" aria-hidden="true" />
        <main className="ntf-content">
          <header className="ntf-header">
            <h1 className="ntf-title">Notifications</h1>
            <p className="ntf-subtitle">Stay updated with important announcements and messages.</p>
          </header>
          <div className="ntf-state" role="status">
            <span className="ntf-spinner" />
            <p>Loading your notifications…</p>
          </div>
        </main>
      </section>
    );
  }

  // Error State
  if (status === 'error' && !hasNotifications) {
    return (
      <section className="ntf-page">
        <div className="ntf-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
        <div className="ntf-wash" aria-hidden="true" />
        <main className="ntf-content">
          <header className="ntf-header">
            <h1 className="ntf-title">Notifications</h1>
            <p className="ntf-subtitle">Stay updated with important announcements and messages.</p>
          </header>
          <div className="ntf-state ntf-state--error" role="alert">
            <FiAlertTriangle size={32} />
            <h3>Failed to Load Notifications</h3>
            <p>{error}</p>
            <button className="ntf-btn ntf-btn--primary" onClick={reload}>
              <FiRefreshCw size={16} /> Try Again
            </button>
          </div>
        </main>
      </section>
    );
  }

  return (
    <section className="ntf-page">
      <div className="ntf-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="ntf-wash" aria-hidden="true" />

      {toast.message && (
        <div className={`ntf-toast ntf-toast--${toast.type}`} role="alert">
          {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button className="ntf-toast-close" onClick={() => setToast({ type: '', message: '' })} aria-label="Close">
            <FiX size={16} />
          </button>
        </div>
      )}

      <main className="ntf-content">
        <header className="ntf-header">
          <div className="ntf-header-left">
            <h1 className="ntf-title">Notifications</h1>
            <p className="ntf-subtitle">
              Stay updated with important announcements and messages.
            </p>
          </div>
          <div className="ntf-header-right">
            {unreadCount > 0 && (
              <span className="ntf-unread-badge">
                <FiBell size={14} />
                {unreadCount} Unread
              </span>
            )}
            {unreadCount > 0 && (
              <button className="ntf-btn ntf-btn--primary" onClick={handleMarkAllRead}>
                <FiCheck size={16} /> Mark All Read
              </button>
            )}
          </div>
        </header>

        {!hasNotifications ? (
          <div className="ntf-state">
            <FiInbox size={40} />
            <h3>No Notifications</h3>
            <p>You're all caught up! Check back later for new updates.</p>
          </div>
        ) : (
          <div className="ntf-list">
            {notifications.map((notification) => (
              <article
                key={notification._id}
                className={`ntf-card ${notification.read ? 'ntf-card--read' : 'ntf-card--unread'}`}
              >
                <div className="ntf-card-icon" aria-hidden="true">
                  <FiBell size={20} />
                </div>

                <div className="ntf-card-content">
                  <div className="ntf-card-header">
                    <h3 className="ntf-card-title">{notification.title}</h3>
                    {!notification.read && <span className="ntf-new-badge">New</span>}
                  </div>

                  {notification.message && (
                    <p className="ntf-card-message">{notification.message}</p>
                  )}

                  <div className="ntf-card-meta">
                    {notification.course?.name && (
                      <span className="ntf-meta-item">
                        <strong>{notification.course.name}</strong>
                      </span>
                    )}
                    <span className="ntf-meta-item ntf-meta-date">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="ntf-card-actions">
                  {!notification.read && (
                    <button
                      className="ntf-action-btn ntf-action-btn--primary"
                      onClick={() => handleMarkOne(notification._id)}
                      aria-label={`Mark "${notification.title}" as read`}
                      title="Mark as read"
                    >
                      <FiCheck size={16} />
                    </button>
                  )}
                  <button
                    className="ntf-action-btn ntf-action-btn--danger"
                    onClick={() => handleDelete(notification._id)}
                    aria-label={`Delete "${notification.title}"`}
                    title="Delete"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </section>
  );
};

export default Notifications;