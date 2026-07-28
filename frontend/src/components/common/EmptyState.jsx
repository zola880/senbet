const EmptyState = ({ message }) => (
  <div className="empty-state">
    <p>{message || 'No data available.'}</p>
  </div>
);
export default EmptyState;