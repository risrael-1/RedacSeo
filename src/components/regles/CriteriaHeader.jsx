const CriteriaHeader = ({ criteriaCount, totalPoints, activeCount }) => {
  return (
    <div className="regles-page-header">
      <div className="header-content">
        <h2>Critères SEO</h2>
        <p className="header-subtitle">
          Configurez les critères d'évaluation de vos articles
        </p>
      </div>
      <div className="header-stats">
        <div className="stat-card">
          <span className="stat-value">{criteriaCount}</span>
          <span className="stat-label">Critères</span>
        </div>
        <div className="stat-card highlight">
          <span className="stat-value">{totalPoints}</span>
          <span className="stat-label">Points max</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{activeCount}</span>
          <span className="stat-label">Actifs</span>
        </div>
      </div>
    </div>
  );
};

export default CriteriaHeader;
