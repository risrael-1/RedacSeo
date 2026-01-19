import { useState } from 'react';
import { useSeoCriteria } from '../context/SeoCriteriaContext';
import Navbar from '../components/Navbar';
import './Regles.css';

const Regles = () => {
  const {
    criteria,
    loading: criteriaLoading,
    isDefault,
    toggleCriterion,
    deleteCriterion,
    addCriterion,
    updateCriterion,
    resetToDefault,
    initializeCriteria
  } = useSeoCriteria();

  const [showAddCriterionForm, setShowAddCriterionForm] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState(null);

  const [criterionFormData, setCriterionFormData] = useState({
    criterion_id: '',
    label: '',
    description: '',
    icon: '📝',
    max_points: 10,
    check_type: 'word_count',
    min_value: '',
    max_value: '',
    target_value: ''
  });

  const checkTypes = [
    { value: 'word_count', label: 'Nombre de mots', description: 'Vérifie le nombre de mots dans le contenu' },
    { value: 'keyword_in_title', label: 'Mot-clé dans le titre', description: 'Vérifie si le mot-clé est dans le titre' },
    { value: 'keyword_in_meta', label: 'Mot-clé dans meta', description: 'Vérifie si le mot-clé est dans la meta description' },
    { value: 'meta_length', label: 'Longueur meta description', description: 'Vérifie la longueur de la meta description' },
    { value: 'keyword_density', label: 'Densité du mot-clé', description: 'Vérifie le pourcentage du mot-clé dans le contenu' },
    { value: 'h1_count', label: 'Nombre de H1', description: 'Vérifie le nombre de balises H1' },
    { value: 'keyword_in_h1', label: 'Mot-clé dans H1', description: 'Vérifie si le mot-clé est dans le H1' },
    { value: 'h2_count', label: 'Nombre de H2', description: 'Vérifie le nombre de balises H2' },
    { value: 'h3_count', label: 'Nombre de H3', description: 'Vérifie le nombre de balises H3' },
    { value: 'title_length', label: 'Longueur du titre', description: 'Vérifie la longueur du titre SEO' },
    { value: 'keyword_in_intro', label: 'Mot-clé au début', description: 'Vérifie si le mot-clé est dans les X premiers mots' },
    { value: 'strong_count', label: 'Balises strong', description: 'Vérifie le nombre de balises strong' },
    { value: 'title_present', label: 'Titre présent', description: 'Vérifie si un titre est défini' },
    { value: 'meta_present', label: 'Meta présente', description: 'Vérifie si une meta description est définie' }
  ];

  const icons = ['📝', '🎯', '📄', '💎', '🏷️', '📋', '📌', '⚡', '💪', '✅', '🔍', '📊', '🏆', '⭐'];

  // SEO Criterion handlers
  const handleAddCriterion = async () => {
    if (!criterionFormData.label || !criterionFormData.check_type) {
      alert('Veuillez remplir le label et le type de vérification');
      return;
    }

    const criterionId = criterionFormData.criterion_id ||
      criterionFormData.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const criterionData = {
      criterion_id: criterionId,
      label: criterionFormData.label,
      description: criterionFormData.description,
      icon: criterionFormData.icon,
      max_points: parseInt(criterionFormData.max_points) || 10,
      check_type: criterionFormData.check_type,
      min_value: criterionFormData.min_value ? parseFloat(criterionFormData.min_value) : null,
      max_value: criterionFormData.max_value ? parseFloat(criterionFormData.max_value) : null,
      target_value: criterionFormData.target_value ? parseFloat(criterionFormData.target_value) : null,
      enabled: true
    };

    try {
      if (editingCriterion) {
        await updateCriterion(editingCriterion.criterion_id, criterionData);
        setEditingCriterion(null);
      } else {
        await addCriterion(criterionData);
      }
      resetCriterionForm();
    } catch (error) {
      alert('Erreur lors de la sauvegarde du critère');
    }
  };

  const handleEditCriterion = (criterion) => {
    setEditingCriterion(criterion);
    setCriterionFormData({
      criterion_id: criterion.criterion_id,
      label: criterion.label,
      description: criterion.description || '',
      icon: criterion.icon || '📝',
      max_points: criterion.max_points || 10,
      check_type: criterion.check_type,
      min_value: criterion.min_value ?? '',
      max_value: criterion.max_value ?? '',
      target_value: criterion.target_value ?? ''
    });
    setShowAddCriterionForm(true);
  };

  const handleDeleteCriterion = async (criterionId) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce critère ?')) {
      try {
        await deleteCriterion(criterionId);
      } catch (error) {
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleResetToDefault = async () => {
    if (window.confirm('Voulez-vous vraiment réinitialiser tous les critères par défaut ? Vos personnalisations seront perdues.')) {
      await resetToDefault();
    }
  };

  const handleInitializeCriteria = async () => {
    if (isDefault) {
      await initializeCriteria();
    }
  };

  const resetCriterionForm = () => {
    setCriterionFormData({
      criterion_id: '',
      label: '',
      description: '',
      icon: '📝',
      max_points: 10,
      check_type: 'word_count',
      min_value: '',
      max_value: '',
      target_value: ''
    });
    setShowAddCriterionForm(false);
    setEditingCriterion(null);
  };

  // Calculate total points
  const totalPoints = criteria
    .filter(c => c.enabled)
    .reduce((sum, c) => sum + (c.max_points || 0), 0);

  return (
    <div className="regles-container">
      <Navbar />
      <main className="regles-main">
        {/* Header avec stats */}
        <div className="regles-page-header">
          <div className="header-content">
            <h2>Critères SEO</h2>
            <p className="header-subtitle">
              Configurez les critères d'évaluation de vos articles
            </p>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <span className="stat-value">{criteria.length}</span>
              <span className="stat-label">Critères</span>
            </div>
            <div className="stat-card highlight">
              <span className="stat-value">{totalPoints}</span>
              <span className="stat-label">Points max</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{criteria.filter(c => c.enabled).length}</span>
              <span className="stat-label">Actifs</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="criteria-actions-bar">
          {isDefault ? (
            <button onClick={handleInitializeCriteria} className="action-btn primary">
              <span className="btn-icon">✨</span>
              Personnaliser les critères
            </button>
          ) : (
            <>
              <button onClick={() => setShowAddCriterionForm(!showAddCriterionForm)} className="action-btn primary">
                <span className="btn-icon">{showAddCriterionForm ? '✕' : '+'}</span>
                {showAddCriterionForm ? 'Annuler' : 'Ajouter un critère'}
              </button>
              <button onClick={handleResetToDefault} className="action-btn secondary">
                <span className="btn-icon">↺</span>
                Réinitialiser
              </button>
            </>
          )}
        </div>

        {/* Add/Edit Criterion Form */}
        {showAddCriterionForm && (
          <div className="criterion-form-card">
            <h4>{editingCriterion ? 'Modifier le critère' : 'Nouveau critère SEO'}</h4>
            <div className="criterion-form-grid">
              <div className="form-group">
                <label>Label du critère *</label>
                <input
                  type="text"
                  value={criterionFormData.label}
                  onChange={(e) => setCriterionFormData({ ...criterionFormData, label: e.target.value })}
                  placeholder="Ex: Longueur du contenu"
                />
              </div>

              <div className="form-group">
                <label>Type de vérification *</label>
                <select
                  value={criterionFormData.check_type}
                  onChange={(e) => setCriterionFormData({ ...criterionFormData, check_type: e.target.value })}
                >
                  {checkTypes.map(ct => (
                    <option key={ct.value} value={ct.value}>{ct.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  value={criterionFormData.description}
                  onChange={(e) => setCriterionFormData({ ...criterionFormData, description: e.target.value })}
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
                      className={`icon-btn ${criterionFormData.icon === icon ? 'selected' : ''}`}
                      onClick={() => setCriterionFormData({ ...criterionFormData, icon })}
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
                  value={criterionFormData.max_points}
                  onChange={(e) => setCriterionFormData({ ...criterionFormData, max_points: e.target.value })}
                  min="1"
                  max="20"
                />
              </div>

              <div className="form-group">
                <label>Valeur minimum</label>
                <input
                  type="number"
                  step="0.1"
                  value={criterionFormData.min_value}
                  onChange={(e) => setCriterionFormData({ ...criterionFormData, min_value: e.target.value })}
                  placeholder="Ex: 300"
                />
              </div>

              <div className="form-group">
                <label>Valeur maximum</label>
                <input
                  type="number"
                  step="0.1"
                  value={criterionFormData.max_value}
                  onChange={(e) => setCriterionFormData({ ...criterionFormData, max_value: e.target.value })}
                  placeholder="Ex: 160"
                />
              </div>

              <div className="form-group">
                <label>Valeur cible (bonus)</label>
                <input
                  type="number"
                  step="0.1"
                  value={criterionFormData.target_value}
                  onChange={(e) => setCriterionFormData({ ...criterionFormData, target_value: e.target.value })}
                  placeholder="Ex: 800"
                />
              </div>
            </div>

            <div className="form-actions">
              <button onClick={handleAddCriterion} className="save-button">
                {editingCriterion ? 'Mettre à jour' : 'Ajouter'}
              </button>
              <button onClick={resetCriterionForm} className="cancel-button">
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Criteria Grid */}
        {criteriaLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Chargement des critères...</p>
          </div>
        ) : (
          <div className="criteria-grid">
            {criteria.map((criterion) => (
              <div
                key={criterion.criterion_id}
                className={`criterion-card ${!criterion.enabled ? 'disabled' : ''}`}
              >
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
                        onChange={() => toggleCriterion(criterion.criterion_id)}
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-label">{criterion.enabled ? 'Actif' : 'Inactif'}</span>
                    </label>
                    <div className="criterion-buttons">
                      <button
                        onClick={() => handleEditCriterion(criterion)}
                        className="icon-button edit"
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteCriterion(criterion.criterion_id)}
                        className="icon-button delete"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer info */}
        <div className="info-footer">
          <div className="info-icon">💡</div>
          <div className="info-content">
            <strong>Conseil</strong>
            <p>
              Le score SEO est calculé automatiquement lors de chaque sauvegarde.
              {isDefault
                ? ' Personnalisez les critères pour adapter le calcul à vos besoins.'
                : ' Ajustez les points et paramètres pour refléter vos priorités SEO.'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Regles;
