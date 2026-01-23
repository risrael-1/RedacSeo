const ArticlesSidebar = ({ articles, currentArticle, onLoadArticle, onDeleteArticle }) => {
  return (
    <div className="saved-articles">
      <h3>Articles sauvegardés récemment</h3>
      {articles.length === 0 ? (
        <p className="no-articles">Aucun article sauvegardé</p>
      ) : (
        <div className="articles-list-sidebar">
          {articles.map((article) => (
            <div
              key={article.id}
              className={`article-item ${currentArticle?.id === article.id ? 'active' : ''}`}
            >
              <div onClick={() => onLoadArticle(article.id)} className="article-info">
                <h4>{article.article_name || article.articleName || 'Sans nom'}</h4>
                <p>{article.word_count || article.wordCount || 0} mots</p>
                <span className="article-date">
                  {article.updated_at || article.lastModified
                    ? new Date(article.updated_at || article.lastModified).toLocaleDateString()
                    : 'Date inconnue'}
                </span>
              </div>
              <button
                onClick={() => onDeleteArticle(article.id)}
                className="delete-article-btn"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArticlesSidebar;
