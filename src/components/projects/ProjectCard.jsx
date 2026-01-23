const ProjectCard = ({
  project,
  isSelected,
  onSelect,
  canManageMembers,
  canEdit,
  canDelete,
  onOpenMembers,
  onEdit,
  onDelete
}) => {
  return (
    <div
      className={`project-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div
        className="project-color-bar"
        style={{ backgroundColor: project.color }}
      ></div>
      <div className="project-card-content">
        <div className="project-card-header">
          <h3 className="project-name">{project.name}</h3>
          {project.my_role && (
            <span className={`project-role-badge ${project.my_role}`}>
              {project.my_role === 'owner' ? 'Propriétaire' :
               project.my_role === 'admin' ? 'Admin' :
               project.my_role === 'super_admin' ? 'Super Admin' : 'Membre'}
            </span>
          )}
        </div>
        {project.description && (
          <p className="project-description">{project.description}</p>
        )}
        <div className="project-stats">
          <span className="project-stat">
            {project.article_count || 0} article(s)
          </span>
          {project.member_count > 1 && (
            <span className="project-stat project-stat-members">
              {project.member_count} membre(s)
            </span>
          )}
        </div>
        <div className="project-actions">
          {canManageMembers && (
            <button
              className="btn-members"
              onClick={(e) => { e.stopPropagation(); onOpenMembers(); }}
            >
              Membres
            </button>
          )}
          {canEdit && (
            <button
              className="btn-edit"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
            >
              Modifier
            </button>
          )}
          {canDelete && (
            <button
              className="btn-delete"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
