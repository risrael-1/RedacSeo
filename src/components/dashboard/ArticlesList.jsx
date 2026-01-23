import { useState, useMemo, useEffect } from 'react';
import ArticleCard from './ArticleCard';
import Pagination from './Pagination';

const ARTICLES_PER_PAGE = 5;

const ArticlesList = ({
  articles,
  selectedProjectId,
  expandedArticleId,
  onToggleExpand,
  onEdit,
  onComplete,
  onDelete,
  getUnmetCriteria
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Réinitialiser à la page 1 quand le filtre change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProjectId]);

  // Calculer la pagination
  const totalPages = Math.ceil(articles.length / ARTICLES_PER_PAGE);

  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
    const endIndex = startIndex + ARTICLES_PER_PAGE;
    return articles.slice(startIndex, endIndex);
  }, [articles, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll vers le haut de la section articles
    document.querySelector('.articles-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="articles-section">
      <div className="articles-section-header">
        <h3>Vos articles</h3>
        {articles.length > 0 && (
          <span className="articles-count">
            {articles.length} article{articles.length > 1 ? 's' : ''}
            {totalPages > 1 && ` • Page ${currentPage}/${totalPages}`}
          </span>
        )}
      </div>
      {articles.length === 0 ? (
        <p className="no-articles">
          {selectedProjectId === 'all'
            ? 'Aucun article créé. Commencez par créer votre premier article !'
            : 'Aucun article dans ce filtre.'}
        </p>
      ) : (
        <>
          <div className="articles-list">
            {paginatedArticles.map(article => {
              const seoScore = article.calculated_seo_score || 0;
              const seoFieldsEnabled = article.seo_fields_enabled !== false;
              const unmetCriteria = getUnmetCriteria(
                article.content || '',
                article.title || '',
                article.meta_description || article.metaDescription || '',
                article.keyword || '',
                seoFieldsEnabled
              );
              const isExpanded = expandedArticleId === article.id;

              return (
                <ArticleCard
                  key={article.id}
                  article={article}
                  seoScore={seoScore}
                  unmetCriteria={unmetCriteria}
                  isExpanded={isExpanded}
                  onToggleExpand={() => onToggleExpand(isExpanded ? null : article.id)}
                  onEdit={() => onEdit(article.id)}
                  onComplete={() => onComplete(article.id)}
                  onDelete={() => onDelete(article.id)}
                />
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default ArticlesList;
