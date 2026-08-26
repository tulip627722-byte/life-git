PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  github_id TEXT NOT NULL UNIQUE,
  github_login TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS github_installations (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  account_login TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  source_type TEXT NOT NULL CHECK (source_type IN ('github','upload')),
  github_url TEXT,
  repo_full_name TEXT,
  repository_id TEXT,
  installation_id TEXT,
  default_branch TEXT NOT NULL DEFAULT 'main',
  head_sha TEXT,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public','private')),
  sync_status TEXT NOT NULL DEFAULT 'local' CHECK (sync_status IN ('local','syncing','synced','failed')),
  technologies TEXT NOT NULL DEFAULT '[]',
  last_synced_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (installation_id) REFERENCES github_installations(id)
);
CREATE INDEX IF NOT EXISTS projects_visibility_idx ON projects(visibility, updated_at DESC);
CREATE INDEX IF NOT EXISTS projects_repository_idx ON projects(repository_id);

CREATE TABLE IF NOT EXISTS project_files (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  path TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('code','markdown','image','binary','blocked')),
  language TEXT,
  size INTEGER NOT NULL DEFAULT 0,
  sha TEXT NOT NULL,
  storage_key TEXT,
  remote_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public','private')),
  blocked_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(project_id, path),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS project_files_project_path_idx ON project_files(project_id, path);
CREATE INDEX IF NOT EXISTS project_files_visibility_idx ON project_files(project_id, visibility);

CREATE TABLE IF NOT EXISTS file_summaries (
  id TEXT PRIMARY KEY,
  project_file_id TEXT NOT NULL,
  sha TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_refs TEXT NOT NULL DEFAULT '[]',
  model TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(project_file_id, sha),
  FOREIGN KEY (project_file_id) REFERENCES project_files(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS life_commits (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  raw_content TEXT NOT NULL,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  enrichment TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS life_commits_date_idx ON life_commits(date DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS profile_readme_versions (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('draft','published','superseded')),
  markdown TEXT NOT NULL,
  source_refs TEXT NOT NULL DEFAULT '[]',
  source_fingerprint TEXT,
  generation_mode TEXT NOT NULL,
  model TEXT,
  created_at TEXT NOT NULL,
  published_at TEXT
);
CREATE INDEX IF NOT EXISTS profile_readme_status_idx ON profile_readme_versions(status, published_at DESC);
CREATE INDEX IF NOT EXISTS profile_readme_fingerprint_idx ON profile_readme_versions(source_fingerprint);

CREATE TABLE IF NOT EXISTS sync_jobs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued','running','completed','failed')),
  trigger TEXT NOT NULL,
  result_json TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_jobs (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued','running','completed','failed')),
  input_fingerprint TEXT,
  output_id TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id TEXT PRIMARY KEY,
  event TEXT NOT NULL,
  received_at TEXT NOT NULL
);
