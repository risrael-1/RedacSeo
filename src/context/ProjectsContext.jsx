import { createContext, useContext, useState, useEffect } from 'react';
import { projectsAPI } from '../services/api';
import { useAuth } from './AuthContext';

const ProjectsContext = createContext();

export const useProjects = () => {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
};

export const ProjectsProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Load projects on mount
  useEffect(() => {
    if (user) {
      loadProjects();
    } else {
      setProjects([]);
      setLoading(false);
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await projectsAPI.getAll();
      setProjects(response.projects || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError(err.message);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData) => {
    try {
      const response = await projectsAPI.create(projectData);
      setProjects((prev) => [response.project, ...prev]);
      return { success: true, project: response.project };
    } catch (err) {
      console.error('Failed to create project:', err);
      return { success: false, error: err.message };
    }
  };

  const updateProject = async (id, projectData) => {
    try {
      const response = await projectsAPI.update(id, projectData);
      setProjects((prev) =>
        prev.map((project) => (project.id === id ? response.project : project))
      );
      return { success: true, project: response.project };
    } catch (err) {
      console.error('Failed to update project:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteProject = async (id) => {
    try {
      await projectsAPI.delete(id);
      setProjects((prev) => prev.filter((project) => project.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Failed to delete project:', err);
      return { success: false, error: err.message };
    }
  };

  const getProjectById = (id) => {
    return projects.find((project) => project.id === id);
  };

  const value = {
    projects,
    loading,
    error,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    getProjectById,
  };

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
};
