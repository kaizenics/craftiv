ALTER TABLE users ADD COLUMN auto_save_drafts integer DEFAULT 1 NOT NULL;
ALTER TABLE users ADD COLUMN default_spell_check integer DEFAULT 1 NOT NULL;
ALTER TABLE users ADD COLUMN show_resume_score integer DEFAULT 1 NOT NULL;
ALTER TABLE users ADD COLUMN compact_editor integer DEFAULT 0 NOT NULL;
