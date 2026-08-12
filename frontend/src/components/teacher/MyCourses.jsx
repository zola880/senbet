import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiArrowRight,
  FiBook,
  FiBookOpen,
  FiGrid,
  FiInbox,
  FiRefreshCw,
  FiSearch,
  FiUsers,
  FiX,
} from 'react-icons/fi';

import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import bgImage from '../../assets/L.png';
import './MyCourses.css';

/** Base route for the course-management screen. */
const MANAGE_ROUTE_BASE = '/teacher/courses';

const buildManageRoute = (assignment) =>
  `${MANAGE_ROUTE_BASE}/assignment/${assignment?._id}`;

const normalizeAssignments = (payload) =>
  Array.isArray(payload) ? payload.filter((item) => item && item._id) : [];

const isCancelError = (err) =>
  err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError';

// Real Ge'ez numerals (1-99) — used as the course ordinal on each card,
// matching the system used on the teacher dashboard.
const GEEZ_ONES = ['', '፩', '፪', '፫', '፬', '፭', '፮', '፯', '፰', '፱'];
const GEEZ_TENS = ['', '፲', '፳', '፴', '፵', '፶', '፷', '፸', '፹', '፺'];
const toGeez = (n) => {
  if (!Number.isInteger(n) || n <= 0) return String(n);
  if (n > 99) return String(n);
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return `${GEEZ_TENS[tens]}${GEEZ_ONES[ones]}`;
};

/* --------------------------------------------------------------------------
   Data hook: fetch + cancel + retry
   -------------------------------------------------------------------------- */
const useTeacherAssignments = (teacherId) => {
  const [assignments, setAssignments] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const reload = useCallback(async () => {
    if (!teacherId) {
      setAssignments([]);
      setStatus('success');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setError(null);

    try {
      const response = await api.get(
        `/api/v1/assignments/teacher/${teacherId}`,
        { signal: controller.signal }
      );

      setAssignments(normalizeAssignments(response?.data?.data));
      setStatus('success');
    } catch (requestError) {
      if (isCancelError(requestError)) return;

      console.error('Failed to load teacher courses:', requestError);
      setError('We could not load your courses. Please try again.');
      setStatus('error');
    }
  }, [teacherId]);

  useEffect(() => {
    reload();
    return () => abortRef.current?.abort();
  }, [reload]);

  return { assignments, status, error, reload };
};

/* --------------------------------------------------------------------------
   Corner ornament — same manuscript-page flourish used on the dashboard,
   framing the content so the two screens read as one system.
   -------------------------------------------------------------------------- */
const CornerOrnament = ({ className = '' }) => (
  <svg
    className={`mc-corner-svg ${className}`}
    viewBox="0 0 60 60"
    fill="none"
    aria-hidden="true"
  >
    <path d="M2 22 V2 H22" stroke="currentColor" strokeWidth="1.4" />
    <path d="M2 30 V10" stroke="currentColor" strokeWidth="1" opacity="0.45" />
    <path d="M30 2 H10" stroke="currentColor" strokeWidth="1" opacity="0.45" />
    <g transform="translate(2,2)">
      <path d="M0 -5 V5 M-5 0 H5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="0" cy="0" r="1.6" fill="currentColor" />
    </g>
  </svg>
);

/* --------------------------------------------------------------------------
   Presentational sub-components
   -------------------------------------------------------------------------- */
const SkeletonCard = () => (
  <div className="mc-skeleton-card" aria-hidden="true">
    <div className="mc-sk-head">
      <span className="mc-sk-icon" />
      <span className="mc-sk-chip" />
    </div>
    <span className="mc-sk-title" />
    <span className="mc-sk-line" />
    <div className="mc-sk-foot">
      <span className="mc-sk-hint" />
      <span className="mc-sk-btn" />
    </div>
  </div>
);

const StatePanel = ({ variant, icon, title, message, actionLabel, onAction }) => (
  <div
    className={`mc-state ${variant === 'error' ? 'mc-state--error' : ''}`}
    role={variant === 'error' ? 'alert' : 'status'}
  >
    <span className="mc-state-icon" aria-hidden="true">
      {icon}
    </span>
    {title && <h3>{title}</h3>}
    {message && <p>{message}</p>}
    {actionLabel && onAction && (
      <button type="button" className="mc-state-btn" onClick={onAction}>
        {actionLabel}
      </button>
    )}
  </div>
);

const CourseCard = ({ assignment, ordinal, onManage }) => {
  const courseName = assignment?.course?.name || 'Unnamed Course';
  const className = assignment?.class?.name || 'General Class';
  const courseCode = assignment?.course?.code;

  return (
    <article className="mc-card">
      <span className="mc-card-ordinal" aria-hidden="true">
        {toGeez(ordinal)}
      </span>

      <div className="mc-card-head">
        <span className="mc-card-icon" aria-hidden="true">
          <FiBook size={20} />
        </span>
        <span className="mc-card-chip" title={className}>
          <FiUsers size={13} aria-hidden="true" />
          {className}
        </span>
      </div>

      <h2 className="mc-card-title" title={courseName}>{courseName}</h2>
      {courseCode && <p className="mc-card-meta">Code · {courseCode}</p>}

      <div className="mc-card-footer">
        <span className="mc-card-hint">Tap to manage</span>
        <button
          type="button"
          className="mc-card-btn"
          onClick={() => onManage(assignment)}
          aria-label={`Manage ${courseName} (${className})`}
        >
          Manage <FiArrowRight size={15} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
};

/* --------------------------------------------------------------------------
   Page
   -------------------------------------------------------------------------- */
const MyCourses = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const teacherId = user?._id;

  const { assignments, status, error, reload } = useTeacherAssignments(teacherId);
  const [query, setQuery] = useState('');

  const isLoading = status === 'loading';
  const hasAssignments = assignments.length > 0;

  const uniqueClassCount = useMemo(
    () => new Set(assignments.map((a) => a.class?._id).filter(Boolean)).size,
    [assignments]
  );

  const filteredAssignments = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assignments;
    return assignments.filter((a) =>
      [a.course?.name, a.class?.name].some((v) => v?.toLowerCase().includes(q))
    );
  }, [assignments, query]);

  const handleManage = useCallback(
    (assignment) => navigate(buildManageRoute(assignment)),
    [navigate]
  );

  const showSkeletons = isLoading && !hasAssignments;

  return (
    <section className="mc-page">
      {/* Background photo (imported from src/assets/L.png) */}
      <div
        className="mc-bg"
        style={{ backgroundImage: `url(${bgImage})` }}
        aria-hidden="true"
      />
      <div className="mc-pattern" aria-hidden="true" />
      <div className="mc-overlay" aria-hidden="true" />

      <div className="mc-content">
        <CornerOrnament className="mc-corner--tl" />
        <CornerOrnament className="mc-corner--tr" />
        <CornerOrnament className="mc-corner--bl" />
        <CornerOrnament className="mc-corner--br" />

        <header className="mc-header">
          <div className="mc-header-copy">
            <span className="mc-eyebrow">Teaching</span>
            <h1 className="mc-title">
              <span className="mc-title-initial" aria-hidden="true">M</span>
              y Courses
            </h1>
            <div className="mc-title-divider" aria-hidden="true">
              <span className="mc-title-divider-line" />
              <span className="mc-title-divider-mark">✦</span>
              <span className="mc-title-divider-line" />
            </div>
            <p className="mc-subtitle">
              Courses and classes assigned to you for this term.
            </p>
          </div>

          {status === 'success' && hasAssignments && (
            <div className="mc-header-badges">
              <span className="mc-count-badge">
                <FiBookOpen size={16} aria-hidden="true" />
                {assignments.length} {assignments.length === 1 ? 'Course' : 'Courses'}
              </span>
              <span className="mc-count-badge mc-count-badge--gold">
                <FiGrid size={16} aria-hidden="true" />
                {uniqueClassCount} {uniqueClassCount === 1 ? 'Class' : 'Classes'}
              </span>
            </div>
          )}
        </header>

        {showSkeletons ? (
          <div className="mc-grid" aria-busy="true" aria-label="Loading courses">
            {Array.from({ length: 6 }, (_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : status === 'error' && !hasAssignments ? (
          <StatePanel
            variant="error"
            icon={<FiAlertTriangle size={26} aria-hidden="true" />}
            title="Something went wrong"
            message={error}
            actionLabel="Try again"
            onAction={reload}
          />
        ) : !hasAssignments ? (
          <StatePanel
            icon={<FiInbox size={28} aria-hidden="true" />}
            title="No courses assigned yet"
            message="You have no teaching assignments at the moment."
          />
        ) : (
          <>
            {status === 'error' && (
              <div className="mc-banner" role="alert">
                <FiAlertTriangle size={16} aria-hidden="true" />
                Refresh failed — showing the last loaded data.
              </div>
            )}

            <div className="mc-toolbar">
              <div className="mc-search">
                <FiSearch className="mc-search-icon" size={16} aria-hidden="true" />
                <input
                  type="search"
                  className="mc-search-input"
                  placeholder="Search by course or class…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search courses"
                />
                {query && (
                  <button
                    type="button"
                    className="mc-search-clear"
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>

              {query.trim() && (
                <span className="mc-result-note">
                  Showing {filteredAssignments.length} of {assignments.length}
                </span>
              )}

              <button
                type="button"
                className={`mc-icon-btn ${isLoading ? 'is-spinning' : ''}`}
                onClick={reload}
                disabled={isLoading}
                aria-label="Refresh courses"
                title="Refresh"
              >
                <FiRefreshCw size={17} />
              </button>
            </div>

            {filteredAssignments.length === 0 ? (
              <StatePanel
                icon={<FiSearch size={26} aria-hidden="true" />}
                title="No matches found"
                message={`No courses match “${query}”.`}
                actionLabel="Clear search"
                onAction={() => setQuery('')}
              />
            ) : (
              <div className="mc-grid">
                {filteredAssignments.map((assignment, idx) => (
                  <CourseCard
                    key={assignment._id}
                    assignment={assignment}
                    ordinal={idx + 1}
                    onManage={handleManage}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default MyCourses;