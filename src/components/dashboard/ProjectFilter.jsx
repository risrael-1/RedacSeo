const ProjectFilter = ({ selectedProjectId, onProjectChange, projects, lowSeoCount }) => {
  return (
    <div className="project-filter">
      <label htmlFor="project-select">Filtrer par:</label>
      <select
        id="project-select"
        value={selectedProjectId}
        onChange={(e) => onProjectChange(e.target.value)}
        className="project-select"
      >
        <option value="all">Tous les articles</option>
        <option value="none">Sans projet</option>
        <option value="low-seo" className="filter-warning">Score SEO &lt; 70 ({lowSeoCount})</option>
        {projects.length > 0 && (
          <optgroup label="Projets">
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
};

export default ProjectFilter;
