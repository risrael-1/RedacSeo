const CriteriaActionsBar = ({
  isDefault,
  showAddForm,
  onToggleAddForm,
  onInitialize,
  onReset
}) => {
  return (
    <div className="criteria-actions-bar">
      {isDefault ? (
        <button onClick={onInitialize} className="action-btn primary">
          <span className="btn-icon">✨</span>
          Personnaliser les critères
        </button>
      ) : (
        <>
          <button onClick={onToggleAddForm} className="action-btn primary">
            <span className="btn-icon">{showAddForm ? '✕' : '+'}</span>
            {showAddForm ? 'Annuler' : 'Ajouter un critère'}
          </button>
          <button onClick={onReset} className="action-btn secondary">
            <span className="btn-icon">↺</span>
            Réinitialiser
          </button>
        </>
      )}
    </div>
  );
};

export default CriteriaActionsBar;
