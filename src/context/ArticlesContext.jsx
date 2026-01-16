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

      setCurrentArticle(savedArticle);
      return savedArticle;
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

      setArticles(prev =>
        prev.map(a => (a.id === articleId ? response.article : a))
      );

      if (currentArticle?.id === articleId) {
        setCurrentArticle(response.article);
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
