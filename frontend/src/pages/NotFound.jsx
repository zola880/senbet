import { useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiAlertCircle,
  FiArrowLeft,
  FiHome,
  FiLogIn,
} from 'react-icons/fi';

import AuthContext from '../context/AuthContext';
import bgImage from '../assets/L.png';
import './NotFound.css';

/**
 * A beautiful, theme-consistent 404 page that:
 *  - Matches the parchment / maroon / gold design system
 *  - Uses the L.png background with the signature wash overlay
 *  - Detects the user's role to send them to the right dashboard
 *  - Offers both a primary action (back) and a secondary one (home)
 *  - Includes an Amharic touch to stay on-brand with the church school
 */
const NotFound = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Smart fallback based on role — teachers go to /teacher, admins to /admin, etc.
  const homePath = user?.role ? `/${user.role}` : '/login';
  const homeLabel = user?.role
    ? `Back to ${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard`
    : 'Go to Login';

  return (
    <section className="nf-page">
      <div
        className="nf-bg"
        style={{ backgroundImage: `url(${bgImage})` }}
        aria-hidden="true"
      />
      <div className="nf-wash" aria-hidden="true" />

      <main className="nf-content">
        <div className="nf-card">
          {/* Icon */}
          <div className="nf-icon-wrap" aria-hidden="true">
            <FiAlertCircle size={40} />
          </div>

          {/* 404 Number */}
          <span className="nf-code">404</span>

          {/* Title */}
          <h1 className="nf-title">Page Not Found</h1>

          {/* Description */}
          <p className="nf-description">
            The page you're looking for doesn't exist, has been moved, or the
            link may be broken. Let's get you back on track.
          </p>

          {/* Amharic quote */}
          <div className="nf-quote">
            <span className="nf-quote-mark">&ldquo;</span>
            <p>መንገድህን አስተካክል፤ እግዚአብሔር ይመራሃል።</p>
            <span className="nf-quote-author">— መዝሙር 37:23</span>
          </div>

          {/* Actions */}
          <div className="nf-actions">
            <button
              type="button"
              className="nf-btn nf-btn--primary"
              onClick={() => navigate(-1)}
            >
              <FiArrowLeft size={16} />
              Go Back
            </button>

            <Link to={homePath} className="nf-btn nf-btn--ghost">
              <FiHome size={16} />
              {homeLabel}
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="nf-footer">
          <p>
            <span className="nf-footer-cross" aria-hidden="true">✝</span>
            ስብሐት ለእግዚአብሔር በኵሉ!
          </p>
          {!user && (
            <Link to="/login" className="nf-login-link">
              <FiLogIn size={14} /> Sign in to your account
            </Link>
          )}
        </footer>
      </main>
    </section>
  );
};

export default NotFound;