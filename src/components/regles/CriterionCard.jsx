const CriterionCard = ({
  criterion,
  isDefault,
  onToggle,
  onEdit,
  onDelete
}) => {
  return (
    <div className={`criterion-card ${!criterion.enabled ? 'disabled' : ''}`}>
      <div className="criterion-header">
        <div className="criterion-icon-wrapper">
          <span className="criterion-icon">{criterion.icon}</span>
        </div>
        <div className="criterion-points-badge">
          {criterion.max_points} pts
        </div>
      </div>

      <div className="criterion-body">
        <h4 className="criterion-title">{criterion.label}</h4>
        {criterion.description && (
          <p className="criterion-description">{criterion.description}</p>
        )}

        <div className="criterion-params">
          {criterion.min_value !== null && criterion.min_value !== undefined && (
            <span className="param-tag">
              <span className="param-icon">↓</span> Min: {criterion.min_value}
            </span>
          )}
          {criterion.max_value !== null && criterion.max_value !== undefined && (
            <span className="param-tag">
              <span className="param-icon">↑</span> Max: {criterion.max_value}
            </span>
          )}
          {criterion.target_value !== null && criterion.target_value !== undefined && (
            <span className="param-tag target">
              <span className="param-icon">🎯</span> Cible: {criterion.target_value}
            </span>
          )}
        </div>
      </div>

      {!isDefault && (
        <div className="criterion-footer">
          <label className="toggle-switch small">
            <input
              type="checkbox"
              checked={criterion.enabled}
              onChange={() => onToggle(criterion.criterion_id)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">{criterion.enabled ? 'Actif' : 'Inactif'}</span>
          </label>
          <div className="criterion-buttons">
            <button
              onClick={() => onEdit(criterion)}
              className="icon-button edit"
              title="Modifier"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(criterion.criterion_id)}
              className="icon-button delete"
              title="Supprimer"
            >
              🗑️
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CriterionCard;
