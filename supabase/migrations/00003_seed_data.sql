-- =====================================================================
-- DevSphere Seed Fixture Migration 00003
-- =====================================================================

INSERT INTO profiles (id, email, password_hash, username, display_name, platform_role, account_state, is_verified, premium_tier, bio)
VALUES
('00000000-0000-0000-0000-000000000001', 'supreme@devsphere.io', '$2a$10$r8V8U.mO7jXgZ2jX6wO9OuD1lR4kP1yF0zN2Gz1eM.N0yQo4iP.G', 'supreme', 'Supreme Sovereign', 'SUPREME_OWNER', 'active', true, 'supreme_dev', 'Supreme Owner & Sovereign of DevSphere Platform.'),
('00000000-0000-0000-0000-000000000002', 'admin@devsphere.io', '$2a$10$r8V8U.mO7jXgZ2jX6wO9OuD1lR4kP1yF0zN2Gz1eM.N0yQo4iP.G', 'alex_admin', 'Alex Admin', 'PLATFORM_ADMIN', 'active', true, 'pro', 'Platform Administrator & Infrastructure Architect.'),
('00000000-0000-0000-0000-000000000003', 'mod@devsphere.io', '$2a$10$r8V8U.mO7jXgZ2jX6wO9OuD1lR4kP1yF0zN2Gz1eM.N0yQo4iP.G', 'mira_mod', 'Mira Moderator', 'PLATFORM_MODERATOR', 'active', true, 'free', 'Platform Moderator maintaining community trust & safety.'),
('00000000-0000-0000-0000-000000000004', 'support@devsphere.io', '$2a$10$r8V8U.mO7jXgZ2jX6wO9OuD1lR4kP1yF0zN2Gz1eM.N0yQo4iP.G', 'sam_support', 'Sam Support', 'SUPPORT', 'active', true, 'free', 'DevSphere user assistance & community support.'),
('00000000-0000-0000-0000-000000000005', 'pro@devsphere.io', '$2a$10$r8V8U.mO7jXgZ2jX6wO9OuD1lR4kP1yF0zN2Gz1eM.N0yQo4iP.G', 'dev_pro', 'Nova Developer', 'PREMIUM_USER', 'active', true, 'pro', 'Full stack engineer building high-performance AI tooling.'),
('00000000-0000-0000-0000-000000000006', 'member@devsphere.io', '$2a$10$r8V8U.mO7jXgZ2jX6wO9OuD1lR4kP1yF0zN2Gz1eM.N0yQo4iP.G', 'sarah_coder', 'Sarah Coder', 'USER', 'active', true, 'free', 'Open source enthusiast and TypeScript lover.'),
('00000000-0000-0000-0000-000000000007', 'jordan@devsphere.io', '$2a$10$r8V8U.mO7jXgZ2jX6wO9OuD1lR4kP1yF0zN2Gz1eM.N0yQo4iP.G', 'jordan_dev', 'Jordan Dev', 'USER', 'active', false, 'free', 'Systems programmer learning Rust and Next.js.')
ON CONFLICT (id) DO NOTHING;

-- Initial Server
INSERT INTO servers (id, name, description, owner_id, is_public)
VALUES
('10000000-0000-0000-0000-000000000001', 'DevSphere HQ', 'The official headquarters for developers, architects, and AI builders.', '00000000-0000-0000-0000-000000000001', true)
ON CONFLICT (id) DO NOTHING;

-- Server Categories
INSERT INTO server_categories (id, server_id, name, position)
VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Welcome & Rules', 0),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Community Chat', 1),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Engineering & AI', 2)
ON CONFLICT (id) DO NOTHING;

-- Server Channels
INSERT INTO server_channels (id, server_id, category_id, name, type, topic, position)
VALUES
('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'welcome-and-rules', 'announcement', 'Welcome to DevSphere! Read platform rules and get started.', 0),
('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'general-chat', 'text', 'Casual discussion for all engineers.', 1),
('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'ask-ai-coding', 'ai-help', 'Discuss coding questions, prompt the AI assistant, and share solutions.', 2),
('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'project-showcase', 'project', 'Show off what you are building.', 3)
ON CONFLICT (id) DO NOTHING;

-- Initial Feature Flags
INSERT INTO feature_flags (key, enabled, description)
VALUES
('registrations_open', true, 'Allow new user registrations on the platform'),
('maintenance_mode', false, 'Emergency read-only mode across platform'),
('ai_coding_assistant', true, 'Enable server-side Gemini AI coding integration'),
('premium_requests_open', true, 'Accept contact-to-purchase premium submissions'),
('file_uploads_enabled', true, 'Allow media and file attachments in channels/DMs')
ON CONFLICT (key) DO NOTHING;

-- Platform Announcement
INSERT INTO announcements (id, title, content, badge_type, is_active)
VALUES
('40000000-0000-0000-0000-000000000001', 'Welcome to DevSphere v1.0', 'The next-generation Supreme Social + Community + Messaging + AI Coding Platform is now live. Enjoy blazing-fast realtime DMs, servers, and AI collaboration!', 'announcement', true)
ON CONFLICT (id) DO NOTHING;
