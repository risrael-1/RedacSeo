const ProjectSelect = ({
  projects,
  projectId,
  onProjectChange,
  projectSearchQuery,
  onProjectSearchChange,
  showProjectDropdown,
  onShowDropdownChange
}) => {
  if (projects.length === 0) return null;

  return (
    <div className="form-group project-select-container">
      <label htmlFor="projectSearch">Projet associé</label>
      <div className="project-search-wrapper">
        <input
          type="text"
          id="projectSearch"
          placeholder="Rechercher un projet..."
          value={showProjectDropdown ? projectSearchQuery : (projects.find(p => p.id === projectId)?.name || '')}
          onChange={(e) => {
            onProjectSearchChange(e.target.value);
            onShowDropdownChange(true);
          }}
          onFocus={() => {
            onShowDropdownChange(true);
            onProjectSearchChange('');
          }}
          onBlur={() => {
            setTimeout(() => onShowDropdownChange(false), 200);
          }}
          className="project-search-input"
          autoComplete="off"
        />
        {projectId && (
          <button
            type="button"
            className="project-clear-btn"
            onClick={() => {
              onProjectChange(null);
              onProjectSearchChange('');
            }}
            title="Retirer le projet"
          >
            ×
          </button>
        )}
        {showProjectDropdown && (
          <div className="project-dropdown">
            <div
              className={`project-dropdown-item ${!projectId ? 'selected' : ''}`}
              onMouseDown={() => {
                onProjectChange(null);
                onProjectSearchChange('');
                onShowDropdownChange(false);
              }}
            >
              Aucun projet
            </div>
            {projects
              .filter(project =>
                project.name.toLowerCase().includes(projectSearchQuery.toLowerCase())
              )
              .map((project) => (
                <div
                  key={project.id}
                  className={`project-dropdown-item ${projectId === project.id ? 'selected' : ''}`}
                  onMouseDown={() => {
                    onProjectChange(project.id);
                    onProjectSearchChange('');
                    onShowDropdownChange(false);
                  }}
                >
                  {project.name}
                </div>
              ))}
            {projects.filter(project =>
              project.name.toLowerCase().includes(projectSearchQuery.toLowerCase())
            ).length === 0 && projectSearchQuery && (
              <div className="project-dropdown-item no-results">
                Aucun projet trouvé
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectSelect;
