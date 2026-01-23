const CriterionForm = ({
  formData,
  onFormChange,
  onSubmit,
  onCancel,
  isEditing,
  checkTypes,
  icons
}) => {
  return (
    <div className="criterion-form-card">
      <h4>{isEditing ? 'Modifier le critère' : 'Nouveau critère SEO'}</h4>
      <div className="criterion-form-grid">
        <div className="form-group">
          <label>Label du critère *</label>
          <input
            type="text"
            value={formData.label}
            onChange={(e) => onFormChange({ ...formData, label: e.target.value })}
            placeholder="Ex: Longueur du contenu"
          />
        </div>

        <div className="form-group">
          <label>Type de vérification *</label>
          <select
            value={formData.check_type}
            onChange={(e) => onFormChange({ ...formData, check_type: e.target.value })}
          >
            {checkTypes.map(ct => (
              <option key={ct.value} value={ct.value}>{ct.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group full-width">
          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
            placeholder="Décrivez ce que ce critère vérifie"
            rows="2"
          />
        </div>

        <div className="form-group">
          <label>Icône</label>
          <div className="icon-selector">
            {icons.map(icon => (
              <button
                key={icon}
                type="button"
                className={`icon-btn ${formData.icon === icon ? 'selected' : ''}`}
                onClick={() => onFormChange({ ...formData, icon })}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Points maximum</label>
          <input
            type="number"
            value={formData.max_points}
            onChange={(e) => onFormChange({ ...formData, max_points: e.target.value })}
            min="1"
            max="20"
          />
        </div>

        <div className="form-group">
          <label>Valeur minimum</label>
          <input
            type="number"
            step="0.1"
            value={formData.min_value}
            onChange={(e) => onFormChange({ ...formData, min_value: e.target.value })}
            placeholder="Ex: 300"
          />
        </div>

        <div className="form-group">
          <label>Valeur maximum</label>
          <input
            type="number"
            step="0.1"
            value={formData.max_value}
            onChange={(e) => onFormChange({ ...formData, max_value: e.target.value })}
            placeholder="Ex: 160"
          />
        </div>

        <div className="form-group">
          <label>Valeur cible (bonus)</label>
          <input
            type="number"
            step="0.1"
            value={formData.target_value}
            onChange={(e) => onFormChange({ ...formData, target_value: e.target.value })}
            placeholder="Ex: 800"
          />
        </div>
      </div>

      <div className="form-actions">
        <button onClick={onSubmit} className="save-button">
          {isEditing ? 'Mettre à jour' : 'Ajouter'}
        </button>
        <button onClick={onCancel} className="cancel-button">
          Annuler
        </button>
      </div>
    </div>
  );
};

export default CriterionForm;
