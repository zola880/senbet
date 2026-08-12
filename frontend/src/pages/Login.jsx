import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiAlertTriangle, FiCheckCircle, FiLock, FiMail, FiX, FiUser } from 'react-icons/fi';

import AuthContext from '../context/AuthContext';
import api from '../services/api';
import bgImage from '../assets/L.png';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [pin, setPin] = useState('');
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' or 'student'
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });
  
  const { user, setUser, setToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(`/${user.role}`, { replace: true });
    }
  }, [user, navigate]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/api/v1/auth/login', { email, password });
      const { token, data: userData } = response.data;

      // Store token and update context
      localStorage.setItem('token', token);
      setToken(token);
      setUser(userData);

      showToast('success', 'Login successful! Redirecting...');
      
      const from = location.state?.from || `/${userData.role}`;
      setTimeout(() => navigate(from, { replace: true }), 800);
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
      showToast('error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/api/v1/auth/student/login', {
        studentId: studentId.trim(),
        pin: pin.trim(),
      });

      const { token, data: userData } = response.data;

      // Store token and update context
      localStorage.setItem('token', token);
      setToken(token);
      setUser(userData);

      showToast('success', 'Login successful! Redirecting...');
      
      const from = location.state?.from || '/student';
      setTimeout(() => navigate(from, { replace: true }), 800);
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please check your Student ID and PIN.';
      showToast('error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="login-page">
      {/* Background */}
      <div className="login-bg" style={{ backgroundImage: `url(${bgImage})` }} aria-hidden="true" />
      <div className="login-overlay" aria-hidden="true" />

      {/* Toast Notification */}
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

      {/* Login Card */}
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

        {/* Login Type Tabs */}
        <div className="login-tabs" role="tablist" aria-label="Login type">
          <button
            className={`login-tab ${activeTab === 'admin' ? 'login-tab--active' : ''}`}
            onClick={() => { setActiveTab('admin'); setEmail(''); setPassword(''); }}
            role="tab"
            aria-selected={activeTab === 'admin'}
          >
            Admin / Teacher
          </button>
          <button
            className={`login-tab ${activeTab === 'student' ? 'login-tab--active' : ''}`}
            onClick={() => { setActiveTab('student'); setStudentId(''); setPin(''); }}
            role="tab"
            aria-selected={activeTab === 'student'}
          >
            Student
          </button>
        </div>

        <form className="login-form" onSubmit={activeTab === 'admin' ? handleAdminLogin : handleStudentLogin} noValidate>
          {activeTab === 'admin' ? (
            <>
              <div className="login-field">
                <label htmlFor="email" className="login-label">
                  <FiMail className="login-label-icon" />
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  className="login-input"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>

              <div className="login-field">
                <label htmlFor="password" className="login-label">
                  <FiLock className="login-label-icon" />
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="login-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>
            </>
          ) : (
            <>
              <div className="login-field">
                <label htmlFor="studentId" className="login-label">
                  <FiUser className="login-label-icon" />
                  Student ID
                </label>
                <input
                  id="studentId"
                  type="text"
                  className="login-input"
                  placeholder="e.g., SS-0001"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                  required
                  autoComplete="off"
                  disabled={isLoading}
                  pattern="SS-\d{4}"
                  title="Format: SS-XXXX (e.g., SS-0001)"
                />
                <small className="login-hint">Format: SS-XXXX (e.g., SS-0001)</small>
              </div>

              <div className="login-field">
                <label htmlFor="pin" className="login-label">
                  <FiLock className="login-label-icon" />
                  PIN
                </label>
                <input
                  id="pin"
                  type="password"
                  className="login-input"
                  placeholder="Enter your 6-digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  autoComplete="off"
                  disabled={isLoading}
                  inputMode="numeric"
                  pattern="\d{6}"
                  title="6-digit PIN"
                />
                <small className="login-hint">Your 6-digit PIN</small>
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="login-btn" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="login-spinner" aria-hidden="true" />
                <span>Signing In...</span>
              </>
            ) : (
              activeTab === 'admin' ? 'Sign In' : 'Student Login'
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