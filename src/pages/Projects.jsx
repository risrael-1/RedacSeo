import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectsContext';
import { useArticles } from '../context/ArticlesContext';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { ProjectCard, ProjectFormModal, DeleteProjectModal, MembersModal, ProjectArticlesList } from '../components/projects';
import './Projects.css';

const Projects = () => {
  const navigate = useNavigate();
  const { projects, loading, loadProjects, createProject, updateProject, deleteProject } = useProjects();
  const { articles, loadArticle } = useArticles();
  const { user, isSuperAdmin } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', color: '#667eea' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);

  // États pour la gestion des membres
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [membersProject, setMembersProject] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const projectArticles = selectedProject
    ? articles.filter(article => article.project_id === selectedProject.id)
    : [];

  const handleArticleClick = (articleId) => {
    loadArticle(articleId);
    navigate('/redaction');
  };

  // Permissions
  const canManageMembers = (project) => {
    if (isSuperAdmin()) return true;
    if (project.user_id === user?.id) return true;
    if (project.my_role === 'owner' || project.my_role === 'admin') return true;
    return false;
  };

  const canEditProject = (project) => {
    if (isSuperAdmin()) return true;
    if (project.user_id === user?.id) return true;
    if (project.my_role === 'owner' || project.my_role === 'admin') return true;
    return false;
  };

  const canDeleteProject = (project) => {
    if (isSuperAdmin()) return true;
    if (project.user_id === user?.id) return true;
    if (project.my_role === 'owner') return true;
    return false;
  };

  // Members management
  const handleOpenMembersModal = async (project) => {
    setMembersProject(project);
    setShowMembersModal(true);
    setInviteEmail('');
    setInviteRole('member');
    setInviteError('');
    setInviteSuccess('');
    await loadProjectMembers(project.id);
  };

  const loadProjectMembers = async (projectId) => {
    try {
      setLoadingMembers(true);
      const response = await usersAPI.getProjectMembers(projectId);
      setProjectMembers(response.members || []);
    } catch (err) {
      console.error('Error loading members:', err);
      setProjectMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      setInviteError('L\'email est requis');
      return;
    }

    try {
      setInviteError('');
      const response = await usersAPI.inviteToProject(membersProject.id, inviteEmail.trim(), inviteRole);
      setInviteSuccess(response.userExists
        ? 'Utilisateur ajouté au projet'
        : 'Invitation envoyée. L\'utilisateur sera ajouté lors de son inscription.');
      setInviteEmail('');
      setInviteRole('member');
      await loadProjectMembers(membersProject.id);
      await loadProjects();
    } catch (err) {
      setInviteError(err.message || 'Erreur lors de l\'invitation');
    }
  };

  const handleChangeMemberRole = async (memberId, newRole) => {
    try {
      await usersAPI.updateProjectMemberRole(membersProject.id, memberId, newRole);
      await loadProjectMembers(membersProject.id);
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const handleRemoveMember = async (memberId, memberEmail) => {
    if (!confirm(`Retirer ${memberEmail} du projet ?`)) return;

    try {
      await usersAPI.removeProjectMember(membersProject.id, memberId);
      await loadProjectMembers(membersProject.id);
      await loadProjects();
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Project form handlers
  const handleOpenModal = (project = null) => {
    if (project) {
      setEditingProject(project);
      setFormData({ name: project.name, description: project.description || '', color: project.color || '#667eea' });
    } else {
      setEditingProject(null);
      setFormData({ name: '', description: '', color: '#667eea' });
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
      setTimeout(() => handleCloseModal(), 1000);
    } else {
      setError(result.error || 'Une erreur est survenue');
    }
  };

  // Delete handlers
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
                <button className="projects-search-clear" onClick={() => setSearchQuery('')}>
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
            <p className="empty-state-subtitle">Créez votre premier projet pour organiser vos articles</p>
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
                  <ProjectCard
                    key={project.id}
                    project={project}
                    isSelected={selectedProject?.id === project.id}
                    onSelect={() => setSelectedProject(selectedProject?.id === project.id ? null : project)}
                    canManageMembers={canManageMembers(project)}
                    canEdit={canEditProject(project)}
                    canDelete={canDeleteProject(project)}
                    onOpenMembers={() => handleOpenMembersModal(project)}
                    onEdit={() => handleOpenModal(project)}
                    onDelete={() => handleDeleteClick(project)}
                  />
                ))}
              </div>
            )}

            {selectedProject && (
              <ProjectArticlesList
                project={selectedProject}
                articles={projectArticles}
                onClose={() => setSelectedProject(null)}
                onArticleClick={handleArticleClick}
                onCreateArticle={() => navigate('/redaction')}
              />
            )}
          </>
        )}

        <ProjectFormModal
          isOpen={showModal}
          onClose={handleCloseModal}
          editingProject={editingProject}
          formData={formData}
          onFormChange={setFormData}
          onSubmit={handleSubmit}
          error={error}
          success={success}
        />

        <DeleteProjectModal
          isOpen={showDeleteModal}
          project={projectToDelete}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />

        <MembersModal
          isOpen={showMembersModal}
          project={membersProject}
          members={projectMembers}
          loading={loadingMembers}
          onClose={() => setShowMembersModal(false)}
          inviteEmail={inviteEmail}
          onInviteEmailChange={setInviteEmail}
          inviteRole={inviteRole}
          onInviteRoleChange={setInviteRole}
          onInvite={handleInvite}
          inviteError={inviteError}
          inviteSuccess={inviteSuccess}
          onChangeMemberRole={handleChangeMemberRole}
          onRemoveMember={handleRemoveMember}
        />
      </div>
    </div>
  );
};

export default Projects;
