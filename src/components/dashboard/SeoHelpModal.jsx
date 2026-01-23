const SeoHelpModal = ({ criteria, totalMaxPoints, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content seo-help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Comment améliorer votre score SEO ?</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="seo-help-content">
          <p className="seo-help-intro">
            Le score SEO est calculé sur <strong>{totalMaxPoints} points</strong> (normalisé sur 100) en fonction de {criteria.filter(c => c.enabled).length} critères actifs. Voici vos critères:
          </p>

          <div className="seo-criteria-grid">
            {criteria.filter(c => c.enabled).map(criterion => (
              <div key={criterion.criterion_id} className="seo-criterion">
                <div className="criterion-header">
                  <span className="criterion-icon">{criterion.icon}</span>
                  <h4>{criterion.label}</h4>
                  <span className="criterion-points">{criterion.max_points} pts</span>
                </div>
                <p className="criterion-description">{criterion.description}</p>
                <div className="criterion-params-display">
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
              </div>
            ))}
          </div>

          <div className="seo-help-tips">
            <h3>💡 Conseils rapides pour un score élevé:</h3>
            <div className="tips-grid">
              <div className="tip-item">✓ Écrivez au moins 300 mots (idéal: 500-800)</div>
              <div className="tip-item">✓ Commencez le titre par votre mot-clé</div>
              <div className="tip-item">✓ Utilisez 1 seul H1 contenant le mot-clé</div>
              <div className="tip-item">✓ Structurez avec 2-3 H2 et quelques H3</div>
              <div className="tip-item">✓ Meta description: 120-160 caractères</div>
              <div className="tip-item">✓ Mentionnez le mot-clé dès le début</div>
            </div>
          </div>

          <div className="seo-score-legend">
            <h3>Échelle de notation:</h3>
            <div className="score-legend-items">
              <div className="score-legend-item">
                <span className="score-dot" style={{ backgroundColor: '#28a745' }}></span>
                <span>80-100: Excellent</span>
              </div>
              <div className="score-legend-item">
                <span className="score-dot" style={{ backgroundColor: '#5cb85c' }}></span>
                <span>70-79: Bon</span>
              </div>
              <div className="score-legend-item">
                <span className="score-dot" style={{ backgroundColor: '#ffc107' }}></span>
                <span>50-69: Moyen</span>
              </div>
              <div className="score-legend-item">
                <span className="score-dot" style={{ backgroundColor: '#ff9800' }}></span>
                <span>30-49: Faible</span>
              </div>
              <div className="score-legend-item">
                <span className="score-dot" style={{ backgroundColor: '#f44336' }}></span>
                <span>0-29: Très faible</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeoHelpModal;
