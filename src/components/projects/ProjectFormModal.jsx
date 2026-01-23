const ProjectFormModal = ({
  isOpen,
  onClose,
  editingProject,
  formData,
  onFormChange,
  onSubmit,
  error,
  success
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingProject ? 'Modifier le projet' : 'Nouveau projet'}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={onSubmit} className="project-form">
          <div className="form-group">
            <label htmlFor="name">Nom du projet *</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
              placeholder="Ex: Hôtel des Bains"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
              placeholder="Description optionnelle du projet"
              rows="3"
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="color">Couleur</label>
            <div className="color-picker-wrapper">
              <input
                type="color"
                id="color"
                value={formData.color}
                onChange={(e) => onFormChange({ ...formData, color: e.target.value })}
              />
              <input
                type="text"
                className="color-input"
                value={formData.color}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || value === '#' || /^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                    onFormChange({ ...formData, color: value || '#' });
                  }
                }}
                onBlur={(e) => {
                  let value = e.target.value.trim();
                  if (!value || value === '#') {
                    onFormChange({ ...formData, color: '#667eea' });
                  } else if (!value.startsWith('#')) {
                    onFormChange({ ...formData, color: '#' + value });
                  } else if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
                    onFormChange({ ...formData, color: '#667eea' });
                  }
                }}
                placeholder="#667eea"
                maxLength={7}
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-submit">
              {editingProject ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectFormModal;
