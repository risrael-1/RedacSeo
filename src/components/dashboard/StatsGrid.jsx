import { getSEOScoreLevel } from '../../utils/htmlUtils';

const StatsGrid = ({ filteredArticles, seoStats, onShowSeoHelp }) => {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <h3>Total Articles</h3>
        <p className="stat-number">{filteredArticles.length}</p>
      </div>
      <div className="stat-card">
        <h3>En cours</h3>
        <p className="stat-number">
          {filteredArticles.filter(a => a.status === 'En cours').length}
        </p>
      </div>
      <div className="stat-card">
        <h3>Terminés</h3>
        <p className="stat-number">
          {filteredArticles.filter(a => a.status === 'Terminé').length}
        </p>
      </div>
      <div className="stat-card seo-stat-card">
        <div className="stat-card-header">
          <h3>Score SEO Moyen</h3>
          <button className="help-icon-btn" onClick={onShowSeoHelp} title="Comment améliorer mon score SEO ?">
            ?
          </button>
        </div>
        {seoStats.hasArticles ? (
          <>
            <p className="stat-number" style={{ color: getSEOScoreLevel(seoStats.avgScore).color }}>
              {seoStats.avgScore}/100
            </p>
            <span className="seo-level">{getSEOScoreLevel(seoStats.avgScore).level}</span>
          </>
        ) : (
          <>
            <p className="stat-number stat-na">N/A</p>
            <span className="seo-level">Aucun article</span>
          </>
        )}
      </div>
      <div className="stat-card">
        <h3>Bon Score SEO (≥70)</h3>
        {seoStats.hasArticles ? (
          <p className="stat-number" style={{ color: '#28a745' }}>
            {seoStats.goodScoreCount}
          </p>
        ) : (
          <p className="stat-number stat-na">N/A</p>
        )}
      </div>
    </div>
  );
};

export default StatsGrid;
