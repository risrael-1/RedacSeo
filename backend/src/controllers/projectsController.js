import { supabase } from '../config/supabase.js';

// Get all projects for a user
export const getProjects = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get projects
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Get projects error:', error);
      return res.status(500).json({ error: 'Failed to fetch projects' });
    }

    // Get article count for each project
    const projectsWithCounts = await Promise.all(
      (projects || []).map(async (project) => {
        const { count } = await supabase
          .from('articles')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', project.id);

        return {
          ...project,
          article_count: count || 0
        };
      })
    );

    res.json({ projects: projectsWithCounts });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single project
export const getProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new project
export const createProject = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert([
        {
          user_id: userId,
          name,
          description: description || '',
          color: color || '#667eea'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Create project error:', error);
      return res.status(500).json({ error: 'Failed to create project' });
    }

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update project
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { name, description, color } = req.body;

    // Check if project belongs to user
    const { data: existingProject } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { data: project, error } = await supabase
      .from('projects')
      .update({
        name,
        description,
        color,
        updated_at: new Date()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update project error:', error);
      return res.status(500).json({ error: 'Failed to update project' });
    }

    res.json({
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete project
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if project belongs to user
    const { data: existingProject } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Delete project error:', error);
      return res.status(500).json({ error: 'Failed to delete project' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
