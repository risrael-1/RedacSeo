import { useState } from 'react';
import { useRules } from '../context/RulesContext';
import Navbar from '../components/Navbar';
import './Regles.css';

const Regles = () => {
  const { rules, toggleRule, deleteRule, addRule, updateRule } = useRules();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSeoCriteria, setShowSeoCriteria] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
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

        {/* SEO Score Criteria Info Section */}
        <div className="seo-score-info">
          <div className="seo-score-header" onClick={() => setShowSeoCriteria(!showSeoCriteria)}>
            <div className="seo-score-header-content">
              <h3>📊 Critères de Score SEO Automatique (100 points)</h3>
              <p className="info-subtitle-inline">
                Chaque article reçoit un score SEO calculé automatiquement lors de la sauvegarde
              </p>
            </div>
            <button className="toggle-criteria-btn">
              {showSeoCriteria ? '▲' : '▼'}
            </button>
          </div>

          {showSeoCriteria && (
            <>
              <div className="score-criteria-grid">
            <div className="score-criterion-card">
              <div className="criterion-icon">📝</div>
              <h4>Longueur du contenu</h4>
              <span className="criterion-points">15 pts</span>
              <ul className="criterion-details">
                <li>≥800 mots = 15 points</li>
                <li>≥500 mots = 13 points</li>
                <li>≥300 mots = 11 points</li>
              </ul>
            </div>

            <div className="score-criterion-card">
              <div className="criterion-icon">🎯</div>
              <h4>Mot-clé dans le titre</h4>
              <span className="criterion-points">12 pts</span>
              <ul className="criterion-details">
                <li>Au début = 12 points</li>
                <li>Dans les 10 premiers car. = 10 pts</li>
                <li>Ailleurs = 8 points</li>
              </ul>
            </div>

            <div className="score-criterion-card">
              <div className="criterion-icon">💎</div>
              <h4>Densité du mot-clé</h4>
              <span className="criterion-points">12 pts</span>
              <ul className="criterion-details">
                <li>1-2.5% = 12 points</li>
                <li>0.5-1% = 10 points</li>
              </ul>
            </div>

            <div className="score-criterion-card">
              <div className="criterion-icon">🏷️</div>
              <h4>Structure H1</h4>
              <span className="criterion-points">13 pts</span>
              <ul className="criterion-details">
                <li>1 seul H1 = 10 points</li>
                <li>H1 avec mot-clé = +3 bonus</li>
              </ul>
            </div>

            <div className="score-criterion-card">
              <div className="criterion-icon">📋</div>
              <h4>Structure H2/H3</h4>
              <span className="criterion-points">10 pts</span>
              <ul className="criterion-details">
                <li>≥3 H2 = 6 points</li>
                <li>≥2 H3 = 4 points</li>
              </ul>
            </div>

            <div className="score-criterion-card">
              <div className="criterion-icon">📄</div>
              <h4>Meta description</h4>
              <span className="criterion-points">16 pts</span>
              <ul className="criterion-details">
                <li>120-160 caractères = 8 pts</li>
                <li>Contient le mot-clé = 8 pts</li>
              </ul>
            </div>

            <div className="score-criterion-card">
              <div className="criterion-icon">📌</div>
              <h4>Titre SEO</h4>
              <span className="criterion-points">5 pts</span>
              <ul className="criterion-details">
                <li>30-60 caractères = 5 points</li>
              </ul>
            </div>

            <div className="score-criterion-card">
              <div className="criterion-icon">⚡</div>
              <h4>Mot-clé au début</h4>
              <span className="criterion-points">5 pts</span>
              <ul className="criterion-details">
                <li>Dans les 100 premiers mots</li>
              </ul>
            </div>

            <div className="score-criterion-card">
              <div className="criterion-icon">💪</div>
              <h4>Contenu en gras</h4>
              <span className="criterion-points">5 pts</span>
              <ul className="criterion-details">
                <li>≥5 balises strong = 5 pts</li>
                <li>≥3 balises strong = 4 pts</li>
              </ul>
            </div>

            <div className="score-criterion-card">
              <div className="criterion-icon">✅</div>
              <h4>Bonus</h4>
              <span className="criterion-points">7 pts</span>
              <ul className="criterion-details">
                <li>Titre présent = 5 points</li>
                <li>Meta présente = 2 points</li>
              </ul>
            </div>
          </div>

              <div className="score-info-footer">
                <div className="score-tip">
                  <strong>💡 Conseil:</strong> Ces critères sont automatiques. Les règles personnalisées ci-dessous sont des vérifications supplémentaires pour vous aider pendant la rédaction.
                </div>
              </div>
            </>
          )}
        </div>

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

        <div className="rules-list">
          <h3>Règles actives</h3>
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
