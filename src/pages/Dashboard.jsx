import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useArticles } from '../context/ArticlesContext';
import { useProjects } from '../context/ProjectsContext';
import { useSeoCriteria } from '../context/SeoCriteriaContext';
import Navbar from '../components/Navbar';
import './Dashboard.css';

// Helper pour déterminer le niveau SEO
const getSEOScoreLevel = (score) => {
  if (score >= 80) return { level: 'Excellent', color: '#22c55e' };
  if (score >= 60) return { level: 'Bon', color: '#84cc16' };
  if (score >= 40) return { level: 'Moyen', color: '#eab308' };
  if (score >= 20) return { level: 'Faible', color: '#f97316' };
  return { level: 'Critique', color: '#ef4444' };
};

const Dashboard = () => {
  const { articles, createNewArticle, deleteArticle, loadArticle, updateArticleStatus } = useArticles();
  const { projects } = useProjects();
  const { criteria, getUnmetCriteria, calculateScore } = useSeoCriteria();
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [showSeoHelp, setShowSeoHelp] = useState(false);
  const [expandedArticleId, setExpandedArticleId] = useState(null);

  // Calculer le total des points max des critères actifs
  const totalMaxPoints = useMemo(() => {
    return criteria.filter(c => c.enabled).reduce((sum, c) => sum + (c.max_points || 0), 0);
  }, [criteria]);

  // Recalculer les scores SEO de tous les articles avec les nouveaux critères
  const articlesWithRecalculatedScores = useMemo(() => {
    return articles.map(article => {
      // Récupérer seo_fields_enabled de l'article (true par défaut)
      const seoFieldsEnabled = article.seo_fields_enabled !== false;
      const result = calculateScore(
        article.content || '',
        article.title || '',
        article.meta_description || article.metaDescription || '',
        article.keyword || '',
        seoFieldsEnabled
      );
      return {
        ...article,
        calculated_seo_score: result.score,
        seo_fields_enabled: seoFieldsEnabled
      };
    });
  }, [articles, calculateScore]);

  const handleNewArticle = () => {
    createNewArticle();
    navigate('/redaction');
  };

  const handleEditArticle = (articleId) => {
    loadArticle(articleId);
    navigate('/redaction');
  };

  const handleDeleteArticle = (articleId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      deleteArticle(articleId);
    }
  };

  const handleMarkAsCompleted = async (articleId) => {
    await updateArticleStatus(articleId, 'Terminé');
  };

  // Filter articles by selected project (using recalculated scores)
  const filteredArticles = useMemo(() => {
    if (selectedProjectId === 'all') {
      return articlesWithRecalculatedScores;
    } else if (selectedProjectId === 'none') {
      return articlesWithRecalculatedScores.filter(article => !article.project_id);
    } else if (selectedProjectId === 'low-seo') {
      return articlesWithRecalculatedScores.filter(article => (article.calculated_seo_score || 0) < 70);
    } else {
      return articlesWithRecalculatedScores.filter(article => article.project_id === selectedProjectId);
    }
  }, [articlesWithRecalculatedScores, selectedProjectId]);

  // Calculate SEO statistics (using recalculated scores)
  const seoStats = useMemo(() => {
    const hasArticles = filteredArticles.length > 0;

    if (!hasArticles) {
      return { avgScore: null, goodScoreCount: null, hasArticles: false };
    }

    const totalScore = filteredArticles.reduce((sum, article) => {
      return sum + (article.calculated_seo_score || 0);
    }, 0);

    const avgScore = Math.round(totalScore / filteredArticles.length);
    const goodScoreCount = filteredArticles.filter(article => (article.calculated_seo_score || 0) >= 70).length;

    return { avgScore, goodScoreCount, hasArticles: true };
  }, [filteredArticles]);

  // Count articles with low SEO score (using recalculated scores)
  const lowSeoCount = useMemo(() => {
    return articlesWithRecalculatedScores.filter(article => (article.calculated_seo_score || 0) < 70).length;
  }, [articlesWithRecalculatedScores]);

  return (
    <div className="dashboard-container">
      <Navbar />

      <main className="dashboard-main">
        <div className="dashboard-actions">
          <h2>Gestion des Articles SEO</h2>
          <button onClick={handleNewArticle} className="add-button">
            + Nouvel article
          </button>
        </div>

        {/* Project Filter */}
        <div className="project-filter">
          <label htmlFor="project-select">Filtrer par:</label>
          <select
            id="project-select"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="project-select"
          >
            <option value="all">Tous les articles</option>
            <option value="none">Sans projet</option>
            <option value="low-seo" className="filter-warning">Score SEO &lt; 70 ({lowSeoCount})</option>
            {projects.length > 0 && (
              <optgroup label="Projets">
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

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
              <button className="help-icon-btn" onClick={() => setShowSeoHelp(true)} title="Comment améliorer mon score SEO ?">
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

        <div className="articles-section">
          <h3>Vos articles</h3>
          {filteredArticles.length === 0 ? (
            <p className="no-articles">
              {selectedProjectId === 'all'
                ? 'Aucun article créé. Commencez par créer votre premier article !'
                : 'Aucun article dans ce filtre.'}
            </p>
          ) : (
            <div className="articles-list">
              {filteredArticles.map(article => {
                const seoScore = article.calculated_seo_score || 0;
                const seoLevel = getSEOScoreLevel(seoScore);
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
                  <div key={article.id} className={`article-card ${seoScore < 70 ? 'article-card-low-seo' : ''}`}>
                    <div className="article-header">
                      <h4>{article.article_name || article.articleName || article.title || 'Sans titre'}</h4>
                      <div className="article-badges">
                        <span className={`status-badge status-${(article.status || 'brouillon').toLowerCase().replace(' ', '-')}`}>
                          {article.status || 'Brouillon'}
                        </span>
                        <span
                          className="seo-score-badge clickable"
                          style={{ backgroundColor: seoLevel.color }}
                          onClick={() => setExpandedArticleId(isExpanded ? null : article.id)}
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
                      <button onClick={() => handleEditArticle(article.id)} className="edit-button">Éditer</button>
                      {article.status !== 'Terminé' && (
                        <button onClick={() => handleMarkAsCompleted(article.id)} className="complete-button">Terminer</button>
                      )}
                      <button onClick={() => handleDeleteArticle(article.id)} className="delete-button">Supprimer</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SEO Help Modal */}
        {showSeoHelp && (
          <div className="modal-overlay" onClick={() => setShowSeoHelp(false)}>
            <div className="modal-content seo-help-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Comment améliorer votre score SEO ?</h2>
                <button className="modal-close" onClick={() => setShowSeoHelp(false)}>
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
        )}
      </main>
    </div>
  );
};

export default Dashboard;
