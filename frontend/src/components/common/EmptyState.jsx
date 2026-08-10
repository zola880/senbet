import { FiInbox } from 'react-icons/fi';
import './EmptyState.css';

/**
 * A versatile empty-state component that matches the maroon/gold/parchment theme.
 *
 * Props:
 *  - icon      : ReactNode (optional) — custom icon; defaults to FiInbox
 *  - title     : string    (optional) — bold heading
 *  - message   : string    (optional) — descriptive text (fallback: "No data available.")
 *  - size      : 'sm' | 'md' | 'lg'   (default: 'md')
 *  - actionLabel : string  (optional) — label for the primary action button
 *  - onAction    : func    (optional) — handler for the primary action
 *  - className   : string  (optional) — additional class names on the wrapper
 */
const EmptyState = ({
  icon,
  title,
  message,
  size = 'md',
  actionLabel,
  onAction,
  className = '',
}) => {
  const hasAction = Boolean(actionLabel) && typeof onAction === 'function';

  return (
    <div
      className={`es-wrapper es-wrapper--${size} ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <div className="es-icon-wrap" aria-hidden="true">
        {icon || <FiInbox size={size === 'sm' ? 28 : size === 'lg' ? 48 : 36} />}
      </div>

      {title && <h3 className="es-title">{title}</h3>}

      <p className="es-message">
        {message || 'No data available.'}
      </p>

      {hasAction && (
        <button
          type="button"
          className="es-action"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;