import { supabase } from '../config/supabase.js';

// Get all articles for a user
export const getArticles = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Get articles error:', error);
      return res.status(500).json({ error: 'Failed to fetch articles' });
    }

    res.json({ articles: articles || [] });
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single article
export const getArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const { data: article, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json({ article });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new article
export const createArticle = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      project_id,
      article_name,
      title,
      meta_description,
      keyword,
      secondary_keywords,
      content,
      word_count,
      seo_score,
      seo_fields_enabled,
      status
    } = req.body;

    const { data: article, error} = await supabase
      .from('articles')
      .insert([
        {
          user_id: userId,
          project_id: project_id || null,
          article_name: article_name || 'Nouvel article',
          title: title || '',
          meta_description: meta_description || '',
          keyword: keyword || '',
          secondary_keywords: secondary_keywords || [],
          content: content || '',
          word_count: word_count || 0,
          seo_score: seo_score || 0,
          seo_fields_enabled: seo_fields_enabled !== false, // true par défaut
          status: status || 'Brouillon'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Create article error:', error);
      return res.status(500).json({ error: 'Failed to create article' });
    }

    res.status(201).json({
      message: 'Article created successfully',
      article
    });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update article
export const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const {
      project_id,
      article_name,
      title,
      meta_description,
      keyword,
      secondary_keywords,
      content,
      word_count,
      seo_score,
      seo_fields_enabled,
      status
    } = req.body;

    // Check if article belongs to user
    const { data: existingArticle } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existingArticle) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const { data: article, error } = await supabase
      .from('articles')
      .update({
        project_id,
        article_name,
        title,
        meta_description,
        keyword,
        secondary_keywords,
        content,
        word_count,
        seo_score,
        seo_fields_enabled,
        status,
        updated_at: new Date()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update article error:', error);
      return res.status(500).json({ error: 'Failed to update article' });
    }

    res.json({
      message: 'Article updated successfully',
      article
    });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete article
export const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if article belongs to user
    const { data: existingArticle } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existingArticle) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Delete article error:', error);
      return res.status(500).json({ error: 'Failed to delete article' });
    }

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
