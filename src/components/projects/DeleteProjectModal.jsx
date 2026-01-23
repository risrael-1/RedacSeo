const DeleteProjectModal = ({ isOpen, project, onConfirm, onCancel }) => {
  if (!isOpen || !project) return null;

  return (
    <div className="modal-overlay delete-modal-overlay" onClick={onCancel}>
      <div className="modal-content delete-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="delete-modal-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
          </svg>
        </div>
        <h2 className="delete-modal-title">Supprimer le projet ?</h2>
        <p className="delete-modal-description">
          Êtes-vous sûr de vouloir supprimer le projet <strong>"{project.name}"</strong> ?
        </p>
        <p className="delete-modal-warning">
          Les articles associés ne seront pas supprimés, mais ils ne seront plus liés à ce projet.
        </p>
        <div className="delete-modal-actions">
          <button className="btn-cancel-delete" onClick={onCancel}>
            Annuler
          </button>
          <button className="btn-confirm-delete" onClick={onConfirm}>
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteProjectModal;
