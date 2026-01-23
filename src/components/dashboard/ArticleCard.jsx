import { getSEOScoreLevel } from '../../utils/htmlUtils';

const ArticleCard = ({
  article,
  seoScore,
  unmetCriteria,
  isExpanded,
  onToggleExpand,
  onEdit,
  onComplete,
  onDelete
}) => {
  const seoLevel = getSEOScoreLevel(seoScore);

  return (
    <div className={`article-card ${seoScore < 70 ? 'article-card-low-seo' : ''}`}>
      <div className="article-header">
        <h4>{article.article_name || article.articleName || article.title || 'Sans titre'}</h4>
        <div className="article-badges">
          <span className={`status-badge status-${(article.status || 'brouillon').toLowerCase().replace(' ', '-')}`}>
            {article.status || 'Brouillon'}
          </span>
          <span
            className="seo-score-badge clickable"
            style={{ backgroundColor: seoLevel.color }}
            onClick={onToggleExpand}
            title="Cliquez pour voir les détails SEO"
          >
            SEO: {seoScore}/100 {unmetCriteria.length > 0 && !isExpanded ? '▼' : isExpanded ? '▲' : ''}
          </span>
        </div>
      </div>
      <div className="article-details">
        <p><strong>Mot-clé principal:</strong> {article.keyword || 'Non défini'}</p>
        <p><strong>Nombre de mots:</strong> {article.word_count || article.wordCount || 0}</p>
        <p><strong>Score SEO:</strong> <span style={{ color: seoLevel.color, fontWeight: 'bold' }}>{seoLevel.level}</span></p>
        <p><strong>Dernière modification:</strong> {new Date(article.updated_at || article.lastModified || Date.now()).toLocaleDateString()}</p>
      </div>

      {/* Critères SEO non respectés */}
      {isExpanded && unmetCriteria.length > 0 && (
        <div className="unmet-criteria-section">
          <h5>Critères à améliorer ({unmetCriteria.length})</h5>
          <div className="unmet-criteria-list">
            {unmetCriteria.map(criterion => (
              <span key={criterion.criterion_id} className="unmet-criterion-tag">
                {criterion.icon} {criterion.label}
                <span className="criterion-detail-small">{criterion.detail}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {isExpanded && unmetCriteria.length === 0 && (
        <div className="unmet-criteria-section success">
          <p>Tous les critères SEO sont respectés !</p>
        </div>
      )}

      <div className="article-actions">
        <button onClick={onEdit} className="edit-button">Éditer</button>
        {article.status !== 'Terminé' && (
          <button onClick={onComplete} className="complete-button">Terminer</button>
        )}
        <button onClick={onDelete} className="delete-button">Supprimer</button>
      </div>
    </div>
  );
};

export default ArticleCard;
