import { supabase } from './supabase.js';

const createTables = async () => {
  console.log('🚀 Starting database migration...\n');

  try {
    // Create users table
    console.log('Creating users table...');
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      `
    });

    if (usersError) {
      console.log('Users table might already exist or using Supabase Auth');
    } else {
      console.log('✅ Users table created');
    }

    // Create articles table
    console.log('Creating articles table...');
    const { error: articlesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS articles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          article_name VARCHAR(500),
          title VARCHAR(255),
          meta_description TEXT,
          keyword VARCHAR(255),
          secondary_keywords JSONB DEFAULT '[]',
          content TEXT,
          word_count INTEGER DEFAULT 0,
          status VARCHAR(50) DEFAULT 'Brouillon',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
        CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
      `
    });

    if (articlesError) {
      console.log('Articles table might already exist');
    } else {
      console.log('✅ Articles table created');
    }

    // Create rules table
    console.log('Creating rules table...');
    const { error: rulesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS rules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          rule_id VARCHAR(100) NOT NULL,
          rule_name VARCHAR(255) NOT NULL,
          enabled BOOLEAN DEFAULT true,
          min_value INTEGER,
          max_value INTEGER,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(user_id, rule_id)
        );
        CREATE INDEX IF NOT EXISTS idx_rules_user_id ON rules(user_id);
      `
    });

    if (rulesError) {
      console.log('Rules table might already exist');
    } else {
      console.log('✅ Rules table created');
    }

    console.log('\n✨ Migration completed successfully!');
    console.log('\nNote: If using Supabase, you can also create tables directly in the Supabase Dashboard.');
    console.log('Go to: https://app.supabase.com > Your Project > Table Editor\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📝 Manual SQL to run in Supabase SQL Editor:');
    console.log(`
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_name VARCHAR(500),
  title VARCHAR(255),
  meta_description TEXT,
  keyword VARCHAR(255),
  secondary_keywords JSONB DEFAULT '[]',
  content TEXT,
  word_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Brouillon',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);

-- Create rules table
CREATE TABLE IF NOT EXISTS rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rule_id VARCHAR(100) NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  min_value INTEGER,
  max_value INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, rule_id)
);
CREATE INDEX IF NOT EXISTS idx_rules_user_id ON rules(user_id);
    `);
  }
};

createTables();
