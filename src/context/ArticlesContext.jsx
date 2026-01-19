import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { articlesAPI } from '../services/api';

const ArticlesContext = createContext();

export const useArticles = () => {
  const context = useContext(ArticlesContext);
  if (!context) {
    throw new Error('useArticles must be used within an ArticlesProvider');
  }
  return context;
};

export const ArticlesProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [articles, setArticles] = useState([]);
  const [currentArticle, setCurrentArticle] = useState(null);
  const [loading, setLoading] = useState(false);

  // Charger les articles depuis l'API
  useEffect(() => {
    if (isAuthenticated && user) {
      loadArticlesFromAPI();
    } else {
      setArticles([]);
      setCurrentArticle(null);
    }
  }, [user, isAuthenticated]);

  const loadArticlesFromAPI = async () => {
    try {
      setLoading(true);
      const response = await articlesAPI.getAll();
      setArticles(response.articles || []);
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveArticle = async (articleData) => {
    if (!user) return null;

    try {
      // Transform data to match API schema
      const apiData = {
        project_id: articleData.projectId || null,
        article_name: articleData.articleName,
        title: articleData.title,
        meta_description: articleData.metaDescription,
        keyword: articleData.keyword,
        secondary_keywords: articleData.secondaryKeywords,
        content: articleData.content,
        word_count: articleData.wordCount,
        seo_score: articleData.seoScore || 0,
        seo_fields_enabled: articleData.seoFieldsEnabled !== false,
        status: articleData.status,
      };

      let response;
      if (currentArticle?.id) {
        // Update existing article
        response = await articlesAPI.update(currentArticle.id, apiData);
      } else {
        // Create new article
        response = await articlesAPI.create(apiData);
      }

      const savedArticle = response.article;

      // Update local state
      setArticles(prev => {
        const existing = prev.findIndex(a => a.id === savedArticle.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = savedArticle;
          return updated;
        }
        return [savedArticle, ...prev];
      });

      // Transform API data to frontend format (same as loadArticle)
      const frontendArticle = {
        ...savedArticle,
        projectId: savedArticle.project_id,
        articleName: savedArticle.article_name,
        metaDescription: savedArticle.meta_description,
        secondaryKeywords: savedArticle.secondary_keywords || [],
        wordCount: savedArticle.word_count,
        seoScore: savedArticle.seo_score,
        seoFieldsEnabled: savedArticle.seo_fields_enabled !== false,
        lastModified: savedArticle.updated_at,
      };

      setCurrentArticle(frontendArticle);
      return frontendArticle;
    } catch (error) {
      console.error('Failed to save article:', error);
      return null;
    }
  };

  const loadArticle = (articleId) => {
    const article = articles.find(a => a.id === articleId);
    if (article) {
      // Transform API data to match frontend schema
      setCurrentArticle({
        ...article,
        projectId: article.project_id,
        articleName: article.article_name,
        metaDescription: article.meta_description,
        secondaryKeywords: article.secondary_keywords || [],
        wordCount: article.word_count,
        seoFieldsEnabled: article.seo_fields_enabled !== false,
        lastModified: article.updated_at,
      });
    }
    return article;
  };

  const deleteArticle = async (articleId) => {
    try {
      await articlesAPI.delete(articleId);
      setArticles(prev => prev.filter(a => a.id !== articleId));
      if (currentArticle?.id === articleId) {
        setCurrentArticle(null);
      }
    } catch (error) {
      console.error('Failed to delete article:', error);
    }
  };

  const createNewArticle = () => {
    setCurrentArticle({
      projectId: null,
      title: '',
      metaDescription: '',
      keyword: '',
      secondaryKeywords: [],
      content: '',
      status: 'Brouillon',
      articleName: '',
      wordCount: 0,
      seoFieldsEnabled: true,
    });
  };

  const updateArticleStatus = async (articleId, newStatus) => {
    try {
      const article = articles.find(a => a.id === articleId);
      if (!article) return;

      const response = await articlesAPI.update(articleId, {
        ...article,
        status: newStatus,
      });

      const savedArticle = response.article;

      setArticles(prev =>
        prev.map(a => (a.id === articleId ? savedArticle : a))
      );

      if (currentArticle?.id === articleId) {
        // Transform API data to frontend format
        const frontendArticle = {
          ...savedArticle,
          projectId: savedArticle.project_id,
          articleName: savedArticle.article_name,
          metaDescription: savedArticle.meta_description,
          secondaryKeywords: savedArticle.secondary_keywords || [],
          wordCount: savedArticle.word_count,
          seoScore: savedArticle.seo_score,
          seoFieldsEnabled: savedArticle.seo_fields_enabled !== false,
          lastModified: savedArticle.updated_at,
        };
        setCurrentArticle(frontendArticle);
      }
    } catch (error) {
      console.error('Failed to update article status:', error);
    }
  };

  return (
    <ArticlesContext.Provider
      value={{
        articles,
        currentArticle,
        saveArticle,
        loadArticle,
        deleteArticle,
        createNewArticle,
        setCurrentArticle,
        updateArticleStatus,
        loading,
      }}
    >
      {children}
    </ArticlesContext.Provider>
  );
};
