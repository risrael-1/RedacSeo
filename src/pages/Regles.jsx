import { useState } from 'react';
import { useRules } from '../context/RulesContext';
import { useSeoCriteria } from '../context/SeoCriteriaContext';
import Navbar from '../components/Navbar';
import './Regles.css';

const Regles = () => {
  const { rules, toggleRule, deleteRule, addRule, updateRule } = useRules();
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

  const [showAddForm, setShowAddForm] = useState(false);
  const [showSeoCriteria, setShowSeoCriteria] = useState(true);
  const [showAddCriterionForm, setShowAddCriterionForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [editingCriterion, setEditingCriterion] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'custom',
    minLength: '',
    maxLength: '',
    minOccurrences: '',
    minWords: '',
    exactCount: ''
  });

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

  const handleAddRule = () => {
    if (!formData.name || !formData.description) {
      alert('Veuillez remplir le nom et la description');
      return;
    }

    const newRule = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      ...(formData.minLength && { minLength: parseInt(formData.minLength) }),
      ...(formData.maxLength && { maxLength: parseInt(formData.maxLength) }),
      ...(formData.minOccurrences && { minOccurrences: parseInt(formData.minOccurrences) }),
      ...(formData.minWords && { minWords: parseInt(formData.minWords) }),
      ...(formData.exactCount && { exactCount: parseInt(formData.exactCount) })
    };

    if (editingRule) {
      updateRule(editingRule.id, newRule);
      setEditingRule(null);
    } else {
      addRule(newRule);
    }

    resetForm();
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      type: rule.type,
      minLength: rule.minLength || '',
      maxLength: rule.maxLength || '',
      minOccurrences: rule.minOccurrences || '',
      minWords: rule.minWords || '',
      exactCount: rule.exactCount || ''
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'custom',
      minLength: '',
      maxLength: '',
      minOccurrences: '',
      minWords: '',
      exactCount: ''
    });
    setShowAddForm(false);
    setEditingRule(null);
  };

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
        <div className="regles-header">
          <h2>Configuration des Règles SEO</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="add-rule-button"
          >
            {showAddForm ? 'Annuler' : '+ Ajouter une règle'}
          </button>
        </div>

        {/* SEO Criteria Section */}
        <div className="seo-score-info">
          <div className="seo-score-header" onClick={() => setShowSeoCriteria(!showSeoCriteria)}>
            <div className="seo-score-header-content">
              <h3>📊 Critères de Score SEO ({totalPoints} points max)</h3>
              <p className="info-subtitle-inline">
                {isDefault
                  ? 'Critères par défaut - Cliquez sur "Personnaliser" pour les modifier'
                  : 'Critères personnalisés - Modifiez les points et paramètres selon vos besoins'}
              </p>
            </div>
            <button className="toggle-criteria-btn">
              {showSeoCriteria ? '▲' : '▼'}
            </button>
          </div>

          {showSeoCriteria && (
            <>
              <div className="criteria-actions">
                {isDefault ? (
                  <button onClick={handleInitializeCriteria} className="customize-btn">
                    Personnaliser les critères
                  </button>
                ) : (
                  <>
                    <button onClick={() => setShowAddCriterionForm(!showAddCriterionForm)} className="add-criterion-btn">
                      {showAddCriterionForm ? 'Annuler' : '+ Ajouter un critère'}
                    </button>
                    <button onClick={handleResetToDefault} className="reset-btn">
                      Réinitialiser par défaut
                    </button>
                  </>
                )}
              </div>

              {/* Add/Edit Criterion Form */}
              {showAddCriterionForm && (
                <div className="add-criterion-form">
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
              <div className="score-criteria-grid">
                {criteriaLoading ? (
                  <p className="loading-text">Chargement des critères...</p>
                ) : (
                  criteria.map((criterion) => (
                    <div
                      key={criterion.criterion_id}
                      className={`score-criterion-card ${!criterion.enabled ? 'disabled' : ''}`}
                    >
                      <div className="criterion-card-header">
                        <div className="criterion-icon">{criterion.icon}</div>
                        <span className="criterion-points">{criterion.max_points} pts</span>
                      </div>
                      <h4>{criterion.label}</h4>
                      {criterion.description && (
                        <p className="criterion-description">{criterion.description}</p>
                      )}
                      <div className="criterion-params">
                        {criterion.min_value !== null && criterion.min_value !== undefined && (
                          <span className="param-badge">Min: {criterion.min_value}</span>
                        )}
                        {criterion.max_value !== null && criterion.max_value !== undefined && (
                          <span className="param-badge">Max: {criterion.max_value}</span>
                        )}
                        {criterion.target_value !== null && criterion.target_value !== undefined && (
                          <span className="param-badge">Cible: {criterion.target_value}</span>
                        )}
                      </div>
                      {!isDefault && (
                        <div className="criterion-actions">
                          <label className="toggle-switch small">
                            <input
                              type="checkbox"
                              checked={criterion.enabled}
                              onChange={() => toggleCriterion(criterion.criterion_id)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                          <button
                            onClick={() => handleEditCriterion(criterion)}
                            className="edit-criterion-btn"
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteCriterion(criterion.criterion_id)}
                            className="delete-criterion-btn"
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="score-info-footer">
                <div className="score-tip">
                  <strong>💡 Conseil:</strong> Le score SEO est calculé automatiquement lors de chaque sauvegarde.
                  {isDefault
                    ? ' Personnalisez les critères pour adapter le calcul à vos besoins.'
                    : ' Ajustez les points et paramètres pour refléter vos priorités SEO.'}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Rules Form */}
        {showAddForm && (
          <div className="add-rule-form">
            <h3>{editingRule ? 'Modifier la règle' : 'Nouvelle règle'}</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="rule-name">Nom de la règle</label>
                <input
                  type="text"
                  id="rule-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Densité du mot-clé"
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="rule-description">Description</label>
                <textarea
                  id="rule-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Le mot-clé doit apparaître entre 1% et 3% du texte"
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label htmlFor="rule-type">Type de règle</label>
                <select
                  id="rule-type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="custom">Personnalisée</option>
                  <option value="title">Titre SEO</option>
                  <option value="metaDescription">Meta Description</option>
                  <option value="keywordBold">Mot-clé en gras</option>
                  <option value="wordCount">Nombre de mots</option>
                  <option value="h1Count">Balises H1</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="min-length">Longueur min (caractères)</label>
                <input
                  type="number"
                  id="min-length"
                  value={formData.minLength}
                  onChange={(e) => setFormData({ ...formData, minLength: e.target.value })}
                  placeholder="Ex: 150"
                />
              </div>

              <div className="form-group">
                <label htmlFor="max-length">Longueur max (caractères)</label>
                <input
                  type="number"
                  id="max-length"
                  value={formData.maxLength}
                  onChange={(e) => setFormData({ ...formData, maxLength: e.target.value })}
                  placeholder="Ex: 160"
                />
              </div>

              <div className="form-group">
                <label htmlFor="min-occurrences">Occurrences min</label>
                <input
                  type="number"
                  id="min-occurrences"
                  value={formData.minOccurrences}
                  onChange={(e) => setFormData({ ...formData, minOccurrences: e.target.value })}
                  placeholder="Ex: 2"
                />
              </div>

              <div className="form-group">
                <label htmlFor="min-words">Nombre de mots min</label>
                <input
                  type="number"
                  id="min-words"
                  value={formData.minWords}
                  onChange={(e) => setFormData({ ...formData, minWords: e.target.value })}
                  placeholder="Ex: 300"
                />
              </div>

              <div className="form-group">
                <label htmlFor="exact-count">Compte exact</label>
                <input
                  type="number"
                  id="exact-count"
                  value={formData.exactCount}
                  onChange={(e) => setFormData({ ...formData, exactCount: e.target.value })}
                  placeholder="Ex: 1"
                />
              </div>
            </div>

            <div className="form-actions">
              <button onClick={handleAddRule} className="save-button">
                {editingRule ? 'Mettre à jour' : 'Ajouter'}
              </button>
              <button onClick={resetForm} className="cancel-button">
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Rules List */}
        <div className="rules-list">
          <h3>Règles de vérification personnalisées</h3>
          {rules.length === 0 ? (
            <p className="no-rules">Aucune règle configurée</p>
          ) : (
            <div className="rules-grid">
              {rules.map((rule) => (
                <div key={rule.id} className={`rule-card ${!rule.enabled ? 'disabled' : ''}`}>
                  <div className="rule-header">
                    <h4>{rule.name}</h4>
                    <div className="rule-actions">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={() => toggleRule(rule.id)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                  <p className="rule-description">{rule.description}</p>
                  <div className="rule-details">
                    {rule.maxLength && <span className="detail-badge">Max: {rule.maxLength} car.</span>}
                    {rule.minLength && <span className="detail-badge">Min: {rule.minLength} car.</span>}
                    {rule.minOccurrences && <span className="detail-badge">Min: {rule.minOccurrences}x</span>}
                    {rule.minWords && <span className="detail-badge">Min: {rule.minWords} mots</span>}
                    {rule.exactCount && <span className="detail-badge">Exact: {rule.exactCount}</span>}
                  </div>
                  <div className="rule-buttons">
                    <button onClick={() => handleEdit(rule)} className="edit-btn">
                      Modifier
                    </button>
                    <button onClick={() => deleteRule(rule.id)} className="delete-btn">
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Regles;
