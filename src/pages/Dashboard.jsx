import { useNavigate } from 'react-router-dom';
import { useArticles } from '../context/ArticlesContext';
import Navbar from '../components/Navbar';
import './Dashboard.css';

const Dashboard = () => {
  const { articles, createNewArticle, deleteArticle, loadArticle } = useArticles();
  const navigate = useNavigate();

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
              {articles.reduce((sum, a) => sum + (a.wordCount || 0), 0)}
            </p>
          </div>
        </div>

        <div className="articles-section">
          <h3>Vos articles</h3>
          {articles.length === 0 ? (
            <p className="no-articles">Aucun article créé. Commencez par créer votre premier article !</p>
          ) : (
            <div className="articles-list">
              {articles.map(article => (
                <div key={article.id} className="article-card">
                  <div className="article-header">
                    <h4>{article.articleName || article.title || 'Sans titre'}</h4>
                    <span className={`status-badge status-${(article.status || 'brouillon').toLowerCase().replace(' ', '-')}`}>
                      {article.status || 'Brouillon'}
                    </span>
                  </div>
                  <div className="article-details">
                    <p><strong>Mot-clé principal:</strong> {article.keyword || 'Non défini'}</p>
                    <p><strong>Nombre de mots:</strong> {article.wordCount || 0}</p>
                    <p><strong>Dernière modification:</strong> {new Date(article.lastModified || Date.now()).toLocaleDateString()}</p>
                  </div>
                  <div className="article-actions">
                    <button onClick={() => handleEditArticle(article.id)} className="edit-button">Éditer</button>
                    <button onClick={() => handleDeleteArticle(article.id)} className="delete-button">Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
