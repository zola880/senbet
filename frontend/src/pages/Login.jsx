import { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiAlertTriangle, FiCheckCircle, FiLock, FiMail, FiX } from 'react-icons/fi';

import AuthContext from '../context/AuthContext';
import bgImage from '../assets/L.png';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await login(email, password);
      showToast('success', 'Login successful! Redirecting...');
      
      // Check if there's a saved location to redirect back to
      const from = location.state?.from || `/${data.data.role}`;
      setTimeout(() => navigate(from, { replace: true }), 800);
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
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
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="login-title">የተማሪ ሥርዓት</h1>
          <p className="login-subtitle">Church School Management System</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
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