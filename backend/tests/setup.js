import dotenv from 'dotenv';
dotenv.config();

// Test configuration
export const TEST_USER = {
  email: `test_${Date.now()}@example.com`,
  password: 'TestPassword123!'
};

// Clean up function to delete test user after tests
export const cleanupTestUser = async (supabase, email) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (user) {
      // Delete user's articles
      await supabase.from('articles').delete().eq('user_id', user.id);
      // Delete user's project memberships
      await supabase.from('project_members').delete().eq('user_id', user.id);
      // Delete user's projects
      await supabase.from('projects').delete().eq('owner_id', user.id);
      // Delete the user
      await supabase.from('users').delete().eq('id', user.id);
    }
  } catch (error) {
    console.log('Cleanup error (can be ignored if user does not exist):', error.message);
  }
};
