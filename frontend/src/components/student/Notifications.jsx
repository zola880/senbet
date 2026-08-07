import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiBell, FiCheck, FiTrash2 } from 'react-icons/fi';
import EmptyState from '../common/EmptyState';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/v1/notifications');
      setNotifications(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    await api.put('/api/v1/notifications/read-all');
    fetchNotifications();
  };

  const handleMarkOne = async (id) => {
    await api.put(`/api/v1/notifications/${id}/read`);
    fetchNotifications();
  };

  if (loading) return <div className="spinner" />;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="page-title">Notifications</h2>
        {unreadCount > 0 && (
          <button className="btn btn-sm btn-secondary" onClick={handleMarkAllRead}>
            <FiCheck /> Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState message="No notifications yet." />
      ) : (
        <div className="table-container" style={{ marginTop: '1rem' }}>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Course</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map(n => (
                <tr key={n._id} style={{ background: n.read ? 'transparent' : '#fef7f2' }}>
                  <td>{n.title}</td>
                  <td>{n.course?.name || '—'}</td>
                  <td>{new Date(n.createdAt).toLocaleDateString()}</td>
                  <td>{n.read ? '✅ Read' : '🔵 New'}</td>
                  <td>
                    {!n.read && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleMarkOne(n._id)}
                      >
                        Mark Read
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Notifications;