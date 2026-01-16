import { supabase } from '../config/supabase.js';

// Get all rules for a user
export const getRules = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: rules, error } = await supabase
      .from('rules')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Get rules error:', error);
      return res.status(500).json({ error: 'Failed to fetch rules' });
    }

    res.json({ rules: rules || [] });
  } catch (error) {
    console.error('Get rules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update or create rule
export const upsertRule = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { rule_id, rule_name, enabled, min_value, max_value } = req.body;

    if (!rule_id || !rule_name) {
      return res.status(400).json({ error: 'rule_id and rule_name are required' });
    }

    // Check if rule exists
    const { data: existingRule } = await supabase
      .from('rules')
      .select('*')
      .eq('user_id', userId)
      .eq('rule_id', rule_id)
      .single();

    let result;

    if (existingRule) {
      // Update existing rule
      const { data, error } = await supabase
        .from('rules')
        .update({
          rule_name,
          enabled,
          min_value,
          max_value,
          updated_at: new Date()
        })
        .eq('user_id', userId)
        .eq('rule_id', rule_id)
        .select()
        .single();

      if (error) {
        console.error('Update rule error:', error);
        return res.status(500).json({ error: 'Failed to update rule' });
      }
      result = data;
    } else {
      // Create new rule
      const { data, error } = await supabase
        .from('rules')
        .insert([
          {
            user_id: userId,
            rule_id,
            rule_name,
            enabled,
            min_value,
            max_value
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Create rule error:', error);
        return res.status(500).json({ error: 'Failed to create rule' });
      }
      result = data;
    }

    res.json({
      message: 'Rule saved successfully',
      rule: result
    });
  } catch (error) {
    console.error('Upsert rule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Batch update rules
export const batchUpdateRules = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { rules } = req.body;

    if (!Array.isArray(rules)) {
      return res.status(400).json({ error: 'rules must be an array' });
    }

    const updatedRules = [];

    for (const rule of rules) {
      const { rule_id, rule_name, enabled, min_value, max_value } = rule;

      // Check if rule exists
      const { data: existingRule } = await supabase
        .from('rules')
        .select('*')
        .eq('user_id', userId)
        .eq('rule_id', rule_id)
        .single();

      if (existingRule) {
        // Update
        const { data } = await supabase
          .from('rules')
          .update({
            rule_name,
            enabled,
            min_value,
            max_value,
            updated_at: new Date()
          })
          .eq('user_id', userId)
          .eq('rule_id', rule_id)
          .select()
          .single();

        if (data) updatedRules.push(data);
      } else {
        // Insert
        const { data } = await supabase
          .from('rules')
          .insert([
            {
              user_id: userId,
              rule_id,
              rule_name,
              enabled,
              min_value,
              max_value
            }
          ])
          .select()
          .single();

        if (data) updatedRules.push(data);
      }
    }

    res.json({
      message: 'Rules updated successfully',
      rules: updatedRules
    });
  } catch (error) {
    console.error('Batch update rules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
