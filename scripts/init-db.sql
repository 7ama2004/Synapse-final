-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Block definitions
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  type VARCHAR(50) NOT NULL, -- 'system', 'community', 'private'
  author_id UUID REFERENCES users(id),
  version VARCHAR(20) NOT NULL,
  config_schema JSONB NOT NULL,
  inputs JSONB NOT NULL,
  outputs JSONB NOT NULL,
  icon VARCHAR(100),
  color VARCHAR(7),
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workflow metadata
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  author_id UUID REFERENCES users(id),
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT false,
  tags TEXT[],
  version INTEGER DEFAULT 1,
  fork_count INTEGER DEFAULT 0,
  star_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usage analytics
CREATE TABLE IF NOT EXISTS block_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID REFERENCES blocks(id),
  workflow_id UUID REFERENCES workflows(id),
  user_id UUID REFERENCES users(id),
  execution_time_ms INTEGER,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Community features
CREATE TABLE IF NOT EXISTS workflow_stars (
  user_id UUID REFERENCES users(id),
  workflow_id UUID REFERENCES workflows(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, workflow_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL, -- 'workflow', 'block'
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_blocks_category ON blocks(category);
CREATE INDEX idx_blocks_author ON blocks(author_id);
CREATE INDEX idx_blocks_published ON blocks(is_published);

CREATE INDEX idx_workflows_author ON workflows(author_id);
CREATE INDEX idx_workflows_public ON workflows(is_public);
CREATE INDEX idx_workflows_tags ON workflows USING GIN(tags);

CREATE INDEX idx_block_usage_block ON block_usage(block_id);
CREATE INDEX idx_block_usage_workflow ON block_usage(workflow_id);
CREATE INDEX idx_block_usage_user ON block_usage(user_id);

CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id);

-- Insert default system blocks
INSERT INTO blocks (name, description, category, type, version, config_schema, inputs, outputs, icon, color, is_published)
VALUES
  -- Input blocks
  ('Text Input', 'Input plain text or paste content', 'input', 'system', '1.0.0', 
   '{"type": "object", "properties": {"placeholder": {"type": "string"}}}',
   '[]',
   '[{"id": "text", "type": "output", "dataType": "string", "label": "Text"}]',
   'FileText', '#10B981', true),
  
  ('File Upload', 'Upload PDF, TXT, or DOC files', 'input', 'system', '1.0.0',
   '{"type": "object", "properties": {"acceptedFormats": {"type": "array", "items": {"type": "string"}}}}',
   '[]',
   '[{"id": "content", "type": "output", "dataType": "string", "label": "Content"}, {"id": "metadata", "type": "output", "dataType": "object", "label": "Metadata"}]',
   'Upload', '#10B981', true),
  
  -- AI Processing blocks
  ('Summarizer', 'Generate concise summaries using AI', 'ai', 'system', '1.0.0',
   '{"type": "object", "properties": {"style": {"type": "string", "enum": ["brief", "detailed", "bullet-points"]}, "maxLength": {"type": "number"}}}',
   '[{"id": "text", "type": "input", "dataType": "string", "label": "Text", "required": true}]',
   '[{"id": "summary", "type": "output", "dataType": "string", "label": "Summary"}]',
   'Brain', '#8B5CF6', true),
  
  ('Question Generator', 'Create quiz questions from text', 'ai', 'system', '1.0.0',
   '{"type": "object", "properties": {"questionType": {"type": "string", "enum": ["multiple-choice", "true-false", "open-ended"]}, "difficulty": {"type": "string", "enum": ["easy", "medium", "hard"]}, "count": {"type": "number"}}}',
   '[{"id": "text", "type": "input", "dataType": "string", "label": "Text", "required": true}]',
   '[{"id": "questions", "type": "output", "dataType": "array", "label": "Questions"}]',
   'Brain', '#8B5CF6', true),
  
  -- Display blocks
  ('Text Display', 'Display formatted text output', 'display', 'system', '1.0.0',
   '{"type": "object", "properties": {"fontSize": {"type": "string"}, "fontFamily": {"type": "string"}}}',
   '[{"id": "text", "type": "input", "dataType": "string", "label": "Text", "required": true}]',
   '[]',
   'Eye', '#3B82F6', true),
  
  ('Quiz Interface', 'Interactive quiz display with scoring', 'display', 'system', '1.0.0',
   '{"type": "object", "properties": {"showFeedback": {"type": "boolean"}, "timeLimit": {"type": "number"}}}',
   '[{"id": "questions", "type": "input", "dataType": "array", "label": "Questions", "required": true}]',
   '[{"id": "results", "type": "output", "dataType": "object", "label": "Results"}]',
   'Eye', '#3B82F6', true);