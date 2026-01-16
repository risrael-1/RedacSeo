import { useState } from 'react';
import Navbar from '../components/Navbar';
import './Dashboard.css';

const Dashboard = () => {
  const [articles, setArticles] = useState([
    {
      id: 1,
      title: 'Article exemple 1',
      status: 'En cours',
      keywords: 'SEO, React, JavaScript',
      wordCount: 1200,
      date: '2026-01-15'
    },
    {
      id: 2,
      title: 'Article exemple 2',
      status: 'Terminé',
      keywords: 'Marketing digital, Stratégie',
      wordCount: 850,
      date: '2026-01-14'
    }
  ]);

  const addNewArticle = () => {
    const newArticle = {
      id: articles.length + 1,
      title: `Nouvel article ${articles.length + 1}`,
      status: 'Brouillon',
      keywords: '',
      wordCount: 0,
      date: new Date().toISOString().split('T')[0]
    };
    setArticles([...articles, newArticle]);
  };

  return (
    <div className="dashboard-container">
      <Navbar />

      <main className="dashboard-main">
        <div className="dashboard-actions">
          <h2>Gestion des Articles SEO</h2>
          <button onClick={addNewArticle} className="add-button">
            + Nouvel article
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Articles</h3>
            <p className="stat-number">{articles.length}</p>
          </div>
          <div className="stat-card">
            <h3>En cours</h3>
            <p className="stat-number">
              {articles.filter(a => a.status === 'En cours').length}
            </p>
          </div>
          <div className="stat-card">
            <h3>Terminés</h3>
            <p className="stat-number">
              {articles.filter(a => a.status === 'Terminé').length}
            </p>
          </div>
          <div className="stat-card">
            <h3>Mots totaux</h3>
            <p className="stat-number">
              {articles.reduce((sum, a) => sum + a.wordCount, 0)}
            </p>
          </div>
        </div>

        <div className="articles-section">
          <h3>Vos articles</h3>
          <div className="articles-list">
            {articles.map(article => (
              <div key={article.id} className="article-card">
                <div className="article-header">
                  <h4>{article.title}</h4>
                  <span className={`status-badge status-${article.status.toLowerCase()}`}>
                    {article.status}
                  </span>
                </div>
                <div className="article-details">
                  <p><strong>Mots-clés:</strong> {article.keywords || 'Non défini'}</p>
                  <p><strong>Nombre de mots:</strong> {article.wordCount}</p>
                  <p><strong>Date:</strong> {article.date}</p>
                </div>
                <div className="article-actions">
                  <button className="edit-button">Éditer</button>
                  <button className="delete-button">Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
