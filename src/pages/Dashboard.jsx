import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useArticles } from '../context/ArticlesContext';
import { useProjects } from '../context/ProjectsContext';
import { useSeoCriteria } from '../context/SeoCriteriaContext';
import Navbar from '../components/Navbar';
import { StatsGrid, ProjectFilter, ArticlesList, SeoHelpModal, DeleteArticleModal } from '../components/dashboard';
import './Dashboard.css';

const Dashboard = () => {
  const { articles, createNewArticle, deleteArticle, loadArticle, updateArticleStatus } = useArticles();
  const { projects } = useProjects();
  const { criteria, getUnmetCriteria, calculateScore } = useSeoCriteria();
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [showSeoHelp, setShowSeoHelp] = useState(false);
  const [expandedArticleId, setExpandedArticleId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState(null);

  // Calculer le total des points max des critères actifs
  const totalMaxPoints = useMemo(() => {
    return criteria.filter(c => c.enabled).reduce((sum, c) => sum + (c.max_points || 0), 0);
  }, [criteria]);

  // Recalculer les scores SEO de tous les articles avec les nouveaux critères
  const articlesWithRecalculatedScores = useMemo(() => {
    return articles.map(article => {
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

  const handleDeleteClick = (articleId) => {
    const article = articlesWithRecalculatedScores.find(a => a.id === articleId);
    setArticleToDelete(article);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (articleToDelete) {
      deleteArticle(articleToDelete.id);
      setShowDeleteModal(false);
      setArticleToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setArticleToDelete(null);
  };

  const handleMarkAsCompleted = async (articleId) => {
    await updateArticleStatus(articleId, 'Terminé');
  };

  // Filter articles by selected project
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

  // Calculate SEO statistics
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

  // Count articles with low SEO score
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

        <ProjectFilter
          selectedProjectId={selectedProjectId}
          onProjectChange={setSelectedProjectId}
          projects={projects}
          lowSeoCount={lowSeoCount}
        />

        <StatsGrid
          filteredArticles={filteredArticles}
          seoStats={seoStats}
          onShowSeoHelp={() => setShowSeoHelp(true)}
        />

        <ArticlesList
          articles={filteredArticles}
          selectedProjectId={selectedProjectId}
          expandedArticleId={expandedArticleId}
          onToggleExpand={setExpandedArticleId}
          onEdit={handleEditArticle}
          onComplete={handleMarkAsCompleted}
          onDelete={handleDeleteClick}
          getUnmetCriteria={getUnmetCriteria}
        />

        {showSeoHelp && (
          <SeoHelpModal
            criteria={criteria}
            totalMaxPoints={totalMaxPoints}
            onClose={() => setShowSeoHelp(false)}
          />
        )}

        <DeleteArticleModal
          isOpen={showDeleteModal}
          article={articleToDelete}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      </main>
    </div>
  );
};

export default Dashboard;
