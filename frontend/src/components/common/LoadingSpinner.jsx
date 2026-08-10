import { FiRefreshCw } from 'react-icons/fi';
import './LoadingSpinner.css';

/**
 * A beautiful loading spinner that matches the maroon/gold/parchment theme.
 *
 * Props:
 *  - size      : 'sm' | 'md' | 'lg'   (default: 'md')
 *  - message   : string    (optional) — custom loading message
 *  - fullPage  : boolean   (optional) — whether to center on full page
 *  - className : string    (optional) — additional class names
 */
const LoadingSpinner = ({
  size = 'md',
  message = 'Loading...',
  fullPage = false,
  className = '',
}) => {
  return (
    <div
      className={`ls-wrapper ${fullPage ? 'ls-wrapper--fullpage' : ''} ls-wrapper--${size} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="ls-spinner-container" aria-hidden="true">
        <div className="ls-spinner-ring" />
        <FiRefreshCw className="ls-spinner-icon" />
      </div>

      {message && <p className="ls-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;