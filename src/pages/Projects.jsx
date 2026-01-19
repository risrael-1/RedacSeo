import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectsContext';
import { useArticles } from '../context/ArticlesContext';
import Navbar from '../components/Navbar';
import './Projects.css';

const Projects = () => {
  const navigate = useNavigate();
  const { projects, loading, loadProjects, createProject, updateProject, deleteProject } = useProjects();
  const { articles, loadArticle } = useArticles();
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#667eea'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);

  // Filtrer les projets selon la recherche
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Obtenir les articles du projet sélectionné
  const projectArticles = selectedProject
    ? articles.filter(article => article.projectId === selectedProject.id)
    : [];

  // Naviguer vers un article
  const handleArticleClick = (articleId) => {
    loadArticle(articleId);
    navigate('/redaction');
  };

  // Recharger les projets quand on arrive sur la page
  useEffect(() => {
    loadProjects();
  }, []);

  const handleOpenModal = (project = null) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        description: project.description || '',
        color: project.color || '#667eea'
      });
    } else {
      setEditingProject(null);
      setFormData({
        name: '',
        description: '',
        color: '#667eea'
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProject(null);
    setFormData({ name: '', description: '', color: '#667eea' });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('Le nom du projet est requis');
      return;
    }

    const result = editingProject
      ? await updateProject(editingProject.id, formData)
      : await createProject(formData);

    if (result.success) {
      setSuccess(editingProject ? 'Projet modifié avec succès' : 'Projet créé avec succès');
      setTimeout(() => {
        handleCloseModal();
      }, 1000);
    } else {
      setError(result.error || 'Une erreur est survenue');
    }
  };

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setProjectToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    const result = await deleteProject(projectToDelete.id);
    if (result.success) {
      setShowDeleteModal(false);
      setProjectToDelete(null);
    } else {
      alert(result.error || 'Erreur lors de la suppression du projet');
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="projects-container">
          <div className="loading">Chargement des projets...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="projects-container">
        <div className="projects-header">
          <h1>Mes Projets</h1>
          <div className="projects-header-actions">
            <div className="projects-search-wrapper">
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="projects-search-input"
              />
              {searchQuery && (
                <button
                  className="projects-search-clear"
                  onClick={() => setSearchQuery('')}
                >
                  ×
                </button>
              )}
            </div>
            <button className="btn-primary" onClick={() => handleOpenModal()}>
              + Nouveau Projet
            </button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="empty-state">
            <p>Aucun projet pour le moment</p>
            <p className="empty-state-subtitle">
              Créez votre premier projet pour organiser vos articles
            </p>
          </div>
        ) : (
          <>
            {searchQuery && filteredProjects.length === 0 ? (
              <div className="empty-state">
                <p>Aucun projet trouvé pour "{searchQuery}"</p>
              </div>
            ) : (
              <div className="projects-grid">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className={`project-card ${selectedProject?.id === project.id ? 'selected' : ''}`}
                    onClick={() => setSelectedProject(selectedProject?.id === project.id ? null : project)}
                  >
                    <div
                      className="project-color-bar"
                      style={{ backgroundColor: project.color }}
                    ></div>
                    <div className="project-card-content">
                      <h3 className="project-name">{project.name}</h3>
                      {project.description && (
                        <p className="project-description">{project.description}</p>
                      )}
                      <div className="project-stats">
                        <span className="project-stat">
                          {project.article_count || 0} article(s)
                        </span>
                      </div>
                      <div className="project-actions">
                        <button
                          className="btn-edit"
                          onClick={(e) => { e.stopPropagation(); handleOpenModal(project); }}
                        >
                          Modifier
                        </button>
                        <button
                          className="btn-delete"
                          onClick={(e) => { e.stopPropagation(); handleDeleteClick(project); }}
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Section des articles du projet sélectionné */}
            {selectedProject && (
              <div className="project-articles-section">
                <div className="project-articles-header">
                  <h2>
                    <span
                      className="project-articles-color"
                      style={{ backgroundColor: selectedProject.color }}
                    ></span>
                    Articles de "{selectedProject.name}"
                  </h2>
                  <button
                    className="project-articles-close"
                    onClick={() => setSelectedProject(null)}
                  >
                    ×
                  </button>
                </div>
                {projectArticles.length === 0 ? (
                  <div className="project-articles-empty">
                    <p>Aucun article dans ce projet</p>
                    <button
                      className="btn-primary"
                      onClick={() => navigate('/redaction')}
                    >
                      Créer un article
                    </button>
                  </div>
                ) : (
                  <div className="project-articles-list">
                    {projectArticles.map((article) => (
                      <div
                        key={article.id}
                        className="project-article-item"
                        onClick={() => handleArticleClick(article.id)}
                      >
                        <div className="project-article-info">
                          <h4 className="project-article-name">{article.articleName}</h4>
                          {article.keyword && (
                            <span className="project-article-keyword">{article.keyword}</span>
                          )}
                        </div>
                        <div className="project-article-meta">
                          <span className="project-article-words">
                            {article.wordCount || 0} mots
                          </span>
                          <span className={`project-article-score ${article.seoScore >= 80 ? 'good' : article.seoScore >= 50 ? 'medium' : 'low'}`}>
                            {article.seoScore || 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingProject ? 'Modifier le projet' : 'Nouveau projet'}</h2>
                <button className="modal-close" onClick={handleCloseModal}>
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit} className="project-form">
                <div className="form-group">
                  <label htmlFor="name">Nom du projet *</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: Hôtel des Bains"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Description optionnelle du projet"
                    rows="3"
                  ></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="color">Couleur</label>
                  <div className="color-picker-wrapper">
                    <input
                      type="color"
                      id="color"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                    />
                    <span className="color-value">{formData.color}</span>
                  </div>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-submit">
                    {editingProject ? 'Modifier' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeleteModal && projectToDelete && (
          <div className="modal-overlay delete-modal-overlay" onClick={handleCancelDelete}>
            <div className="modal-content delete-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="delete-modal-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
                </svg>
              </div>
              <h2 className="delete-modal-title">Supprimer le projet ?</h2>
              <p className="delete-modal-description">
                Êtes-vous sûr de vouloir supprimer le projet <strong>"{projectToDelete.name}"</strong> ?
              </p>
              <p className="delete-modal-warning">
                Les articles associés ne seront pas supprimés, mais ils ne seront plus liés à ce projet.
              </p>
              <div className="delete-modal-actions">
                <button className="btn-cancel-delete" onClick={handleCancelDelete}>
                  Annuler
                </button>
                <button className="btn-confirm-delete" onClick={handleConfirmDelete}>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
