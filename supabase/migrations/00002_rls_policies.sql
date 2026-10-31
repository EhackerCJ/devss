-- =====================================================================
-- DevSphere PostgreSQL Row Level Security (RLS) Policies 00002
-- =====================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: readable by all authenticated users, updatable only by the owner or Supreme Owner
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. User Settings: strictly private to owner
CREATE POLICY "Users can view own settings" 
ON user_settings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" 
ON user_settings FOR UPDATE USING (auth.uid() = user_id);

-- 3. Conversations: only members can see conversations
CREATE POLICY "Members can view conversations" 
ON conversations FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM conversation_members 
        WHERE conversation_members.conversation_id = conversations.id 
        AND conversation_members.user_id = auth.uid()
    )
);

-- 4. Messages: viewable by members of conversation or members of the server channel
CREATE POLICY "Users can view messages in their conversations or channels" 
ON messages FOR SELECT 
USING (
    (
        conversation_id IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM conversation_members 
            WHERE conversation_members.conversation_id = messages.conversation_id 
            AND conversation_members.user_id = auth.uid()
        )
    )
    OR
    (
        channel_id IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM server_channels sc
            JOIN server_members sm ON sm.server_id = sc.server_id
            WHERE sc.id = messages.channel_id 
            AND sm.user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can insert messages into their permitted conversations" 
ON messages FOR INSERT 
WITH CHECK (
    auth.uid() = sender_id AND (
        (conversation_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM conversation_members 
            WHERE conversation_members.conversation_id = messages.conversation_id 
            AND conversation_members.user_id = auth.uid()
        ))
        OR
        (channel_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM server_channels sc
            JOIN server_members sm ON sm.server_id = sc.server_id
            WHERE sc.id = messages.channel_id 
            AND sm.user_id = auth.uid()
        ))
    )
);

-- 5. Notifications: strictly private to recipient
CREATE POLICY "Users can only view their own notifications" 
ON notifications FOR SELECT USING (auth.uid() = user_id);

-- 6. AI Conversations: strictly private to owner
CREATE POLICY "Users can only view their own AI chats" 
ON ai_conversations FOR ALL USING (auth.uid() = user_id);

-- 7. Audit Logs: readable only by platform admins and Supreme Owner
CREATE POLICY "Staff can view audit logs" 
ON audit_logs FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.platform_role IN ('SUPREME_OWNER', 'PLATFORM_ADMIN')
    )
);
