import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiAlertTriangle, FiCheckCircle, FiLock, FiX, FiUser } from 'react-icons/fi';

import AuthContext from '../context/AuthContext';
import api from '../services/api';
import bgImage from '../assets/L.png';
import './Login.css';

const Login = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });
  
  const { user, setUser, setToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      navigate(`/${user.role}`, { replace: true });
    }
  }, [user, navigate]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

  // Detect user type based on ID prefix
  const getUserType = (id) => {
    const upperId = id.trim().toUpperCase();
    if (upperId.startsWith('AS-') || upperId.startsWith('TS-')) return 'staff';
    if (upperId.startsWith('SS-')) return 'student';
    return null;
  };

  const userType = getUserType(userId);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const trimmedUserId = userId.trim().toUpperCase();
      const type = getUserType(trimmedUserId);

      if (!type) {
        showToast('error', 'Invalid ID format. Please use AS-XXXX, TS-XXXX, or SS-XXXX');
        setIsLoading(false);
        return;
      }

      let response;

      if (type === 'staff') {
        // Admin or Teacher login
        response = await api.post('/api/v1/auth/login', { 
          userId: trimmedUserId, 
          password 
        });
      } else {
        // Student login
        response = await api.post('/api/v1/auth/student/login', {
          studentId: trimmedUserId,
          pin: password,
        });
      }

      const { token: newToken, data: userData } = response.data;

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);

      showToast('success', 'Login successful! Redirecting...');
      
      const from = location.state?.from || `/${userData.role}`;
      setTimeout(() => navigate(from, { replace: true }), 800);
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
      showToast('error', message);
      setIsLoading(false);
    }
  };

  const handleUserIdChange = (e) => {
    const value = e.target.value.toUpperCase();
    setUserId(value);
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    // If student, only allow digits and limit to 6
    if (userType === 'student') {
      setPassword(value.replace(/\D/g, '').slice(0, 6));
    } else {
      setPassword(value);
    }
  };

  return (
    <section className="login-page">
      <div className="login-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="login-overlay" aria-hidden="true" />

      {toast.message && (
        <div className={`login-toast login-toast--${toast.type}`} role="alert">
          {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button 
            className="login-toast-close" 
            onClick={() => setToast({ type: '', message: '' })} 
            aria-label="Close notification"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      <div className="login-card">
        <header className="login-header">
          <div className="login-logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" transform="rotate(45 12 12)"/>
            </svg>
          </div>
          <h1 className="login-title">መስቀለ ብርሃን ሰንበት ትምህርት ቤት</h1>
          <p className="login-subtitle">Church Sunday School Management System</p>
        </header>

        <form className="login-form" onSubmit={handleLogin} noValidate>
          <div className="login-field">
            <label htmlFor="userId" className="login-label">
              <FiUser className="login-label-icon" />
              User ID
            </label>
            <input
              id="userId"
              type="text"
              className="login-input"
              placeholder="e.g., AS-0001, TS-0001, or SS-0001"
              value={userId}
              onChange={handleUserIdChange}
              required
              autoComplete="off"
              disabled={isLoading}
            />
            <small className="login-hint">
              {userId ? (
                userType === 'staff' ? 'Admin or Teacher ID detected' :
                userType === 'student' ? 'Student ID detected' :
                'Format: AS-XXXX, TS-XXXX, or SS-XXXX'
              ) : (
                'Enter your ID'
              )}
            </small>
          </div>

          <div className="login-field">
            <label htmlFor="password" className="login-label">
              <FiLock className="login-label-icon" />
              {userType === 'student' ? 'PIN' : 'Password'}
            </label>
            <input
              id="password"
              type="password"
              className="login-input"
              placeholder={userType === 'student' ? 'Enter your 6-digit PIN' : 'Enter your password'}
              value={password}
              onChange={handlePasswordChange}
              required
              autoComplete={userType === 'student' ? 'off' : 'current-password'}
              disabled={isLoading}
              inputMode={userType === 'student' ? 'numeric' : 'text'}
            />
            <small className="login-hint">
              {userType === 'student' ? 'Your 6-digit PIN' : 'Your secure password'}
            </small>
          </div>

          <button 
            type="submit" 
            className="login-btn" 
            disabled={isLoading || !userType}
          >
            {isLoading ? (
              <>
                <span className="login-spinner" aria-hidden="true" />
                <span>Signing In...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <footer className="login-footer">
          <p className="login-footer-text">
            <span className="login-footer-cross">✝</span>
            ስብሐት ለእግዚአብሔር በኵሉ!
          </p>
        </footer>
      </div>
    </section>
  );
};

export default Login;