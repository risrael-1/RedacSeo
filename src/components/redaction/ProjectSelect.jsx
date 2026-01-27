const ProjectSelect = ({
  projects,
  projectId,
  onProjectChange,
  projectSearchQuery,
  onProjectSearchChange,
  showProjectDropdown,
  onShowDropdownChange,
  required = false,
  error = ''
}) => {
  // Si required et aucun projet disponible, afficher un message
  if (projects.length === 0) {
    if (required) {
      return (
        <div className="form-group project-select-container">
          <label htmlFor="projectSearch">
            Projet associé <span className="required-field">*</span>
          </label>
          <div className="project-required-notice">
            Vous devez être affecté à un projet pour créer des articles.
            Contactez un administrateur de votre organisation.
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="form-group project-select-container">
      <label htmlFor="projectSearch">
        Projet associé {required && <span className="required-field">*</span>}
      </label>
      <div className="project-search-wrapper">
        <input
          type="text"
          id="projectSearch"
          placeholder={required ? "Sélectionner un projet (obligatoire)..." : "Rechercher un projet..."}
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
          className={`project-search-input ${error ? 'input-error' : ''}`}
          autoComplete="off"
        />
        {projectId && !required && (
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
            {!required && (
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
            )}
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
      {error && <span className="field-error">{error}</span>}
    </div>
  );
};

export default ProjectSelect;
