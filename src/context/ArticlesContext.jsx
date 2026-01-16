import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ArticlesContext = createContext();

export const useArticles = () => {
  const context = useContext(ArticlesContext);
  if (!context) {
    throw new Error('useArticles must be used within an ArticlesProvider');
  }
  return context;
};

export const ArticlesProvider = ({ children }) => {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [currentArticle, setCurrentArticle] = useState(null);

  // Charger les articles de l'utilisateur depuis le localStorage
  useEffect(() => {
    if (user?.email) {
      const savedArticles = localStorage.getItem(`articles_${user.email}`);
      if (savedArticles) {
        const parsed = JSON.parse(savedArticles);
        setArticles(parsed);

        // Charger le dernier article en cours si il existe
        const lastArticle = parsed.find(a => a.status === 'En cours');
        if (lastArticle) {
          setCurrentArticle(lastArticle);
        }
      }
    }
  }, [user]);

  // Sauvegarder les articles dans le localStorage
  useEffect(() => {
    if (user?.email && articles.length > 0) {
      localStorage.setItem(`articles_${user.email}`, JSON.stringify(articles));
    }
  }, [articles, user]);

  const saveArticle = (articleData) => {
    if (!user?.email) return null;

    const article = {
      id: currentArticle?.id || Date.now(),
      ...articleData,
      userEmail: user.email,
      lastModified: new Date().toISOString(),
    };

    setArticles(prev => {
      const existing = prev.findIndex(a => a.id === article.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = article;
        return updated;
      }
      return [...prev, article];
    });

    setCurrentArticle(article);
    return article;
  };

  const loadArticle = (articleId) => {
    const article = articles.find(a => a.id === articleId);
    if (article) {
      setCurrentArticle(article);
    }
    return article;
  };

  const deleteArticle = (articleId) => {
    setArticles(prev => prev.filter(a => a.id !== articleId));
    if (currentArticle?.id === articleId) {
      setCurrentArticle(null);
    }
  };

  const createNewArticle = () => {
    setCurrentArticle({
      id: Date.now(),
      title: '',
      metaDescription: '',
      keyword: '',
      secondaryKeywords: [],
      content: '',
      status: 'Brouillon',
      userEmail: user?.email,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    });
  };

  const getUserArticles = () => {
    return articles.filter(a => a.userEmail === user?.email);
  };

  return (
    <ArticlesContext.Provider
      value={{
        articles: getUserArticles(),
        currentArticle,
        saveArticle,
        loadArticle,
        deleteArticle,
        createNewArticle,
        setCurrentArticle,
      }}
    >
      {children}
    </ArticlesContext.Provider>
  );
};
