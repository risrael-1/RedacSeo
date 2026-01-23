const SeoScorePanel = ({ seoAnalysis }) => {
  return (
    <div className="seo-realtime-panel">
      <div className="seo-score-header">
        <h3>Score SEO</h3>
        <div className="seo-score-display" style={{ backgroundColor: seoAnalysis.level.color }}>
          {seoAnalysis.score}/100
        </div>
      </div>
      <div className="seo-score-level" style={{ color: seoAnalysis.level.color }}>
        {seoAnalysis.level.level}
      </div>
      <div className="seo-criteria-progress">
        <span>{seoAnalysis.validCount}/{seoAnalysis.totalCount} critères respectés</span>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${(seoAnalysis.validCount / seoAnalysis.totalCount) * 100}%`,
              backgroundColor: seoAnalysis.level.color
            }}
          ></div>
        </div>
      </div>
      <div className="seo-criteria-list-realtime">
        {seoAnalysis.criteria.map(criterion => (
          <div
            key={criterion.criterion_id}
            className={`seo-criterion-item ${criterion.isValid ? 'valid' : 'invalid'}`}
          >
            <span className="criterion-status">
              {criterion.isValid ? '✓' : '✗'}
            </span>
            <span className="criterion-icon">{criterion.icon}</span>
            <div className="criterion-info">
              <span className="criterion-label">{criterion.label}</span>
              <span className="criterion-detail">{criterion.detail}</span>
            </div>
            <span className="criterion-points">{criterion.points}/{criterion.max_points}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeoScorePanel;
