const ProjectArticlesList = ({ project, articles, onClose, onArticleClick, onCreateArticle }) => {
  if (!project) return null;

  return (
    <div className="project-articles-section">
      <div className="project-articles-header">
        <h2>
          <span
            className="project-articles-color"
            style={{ backgroundColor: project.color }}
          ></span>
          Articles de "{project.name}"
        </h2>
        <button
          className="project-articles-close"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      {articles.length === 0 ? (
        <div className="project-articles-empty">
          <p>Aucun article dans ce projet</p>
          <button
            className="btn-primary"
            onClick={onCreateArticle}
          >
            Créer un article
          </button>
        </div>
      ) : (
        <div className="project-articles-list">
          {articles.map((article) => (
            <div
              key={article.id}
              className="project-article-item"
              onClick={() => onArticleClick(article.id)}
            >
              <div className="project-article-info">
                <h4 className="project-article-name">{article.article_name}</h4>
                {article.keyword && (
                  <span className="project-article-keyword">{article.keyword}</span>
                )}
              </div>
              <div className="project-article-meta">
                <span className="project-article-words">
                  {article.word_count || 0} mots
                </span>
                <span className={`project-article-score ${(article.seo_score || 0) >= 80 ? 'good' : (article.seo_score || 0) >= 50 ? 'medium' : 'low'}`}>
                  {article.seo_score || 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectArticlesList;
