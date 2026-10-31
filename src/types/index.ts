export type PlatformRole = 
  | 'SUPREME_OWNER'
  | 'PLATFORM_ADMIN'
  | 'PLATFORM_MODERATOR'
  | 'SUPPORT'
  | 'PREMIUM_USER'
  | 'USER';

export type ServerRoleType = 
  | 'SERVER_OWNER'
  | 'SERVER_ADMIN'
  | 'SERVER_MODERATOR'
  | 'MEMBER';

export type GroupRoleType = 
  | 'GROUP_OWNER'
  | 'GROUP_ADMIN'
  | 'GROUP_MODERATOR'
  | 'MEMBER';

export type AccountState = 
  | 'active'
  | 'restricted'
  | 'suspended'
  | 'banned'
  | 'deleted';

export type PresenceStatus = 
  | 'online'
  | 'idle'
  | 'dnd'
  | 'offline';

export type PremiumTierId = 
  | 'free'
  | 'pro'
  | 'supreme_dev';

export type PremiumRequestStatus = 
  | 'pending'
  | 'contacted'
  | 'awaiting_verification'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  links: string[];
  custom_status?: string;
  platform_role: PlatformRole;
  account_state: AccountState;
  is_verified: boolean;
  is_private: boolean;
  premium_tier?: PremiumTierId;
  premium_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  user_id: string;
  theme: 'dark' | 'light' | 'system' | 'cyber' | 'obsidian';
  chat_density: 'compact' | 'cozy';
  direct_message_privacy: 'everyone' | 'friends' | 'verified';
  friend_request_privacy: 'everyone' | 'friends_of_friends' | 'none';
  sound_enabled: boolean;
  email_notifications: boolean;
}

export interface UserPresence {
  user_id: string;
  status: PresenceStatus;
  last_seen_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface FollowRequest {
  id: string;
  requester_id: string;
  target_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface Friendship {
  user_a_id: string;
  user_b_id: string;
  created_at: string;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
}

export interface BlockRecord {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  icon_url?: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message?: Message;
  members?: ConversationMember[];
}

export interface ConversationMember {
  conversation_id: string;
  user_id: string;
  group_role: GroupRoleType;
  joined_at: string;
  last_read_message_id?: string;
  profile?: UserProfile;
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  file_url: string;
  created_at: string;
}

export interface MessageReaction {
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  username?: string;
}

export interface Message {
  id: string;
  conversation_id?: string;
  channel_id?: string;
  sender_id: string;
  sender?: UserProfile;
  content: string;
  reply_to_id?: string;
  reply_to_message?: Message;
  is_pinned: boolean;
  is_edited: boolean;
  is_deleted: boolean;
  reactions?: MessageReaction[];
  attachments?: MessageAttachment[];
  created_at: string;
  updated_at: string;
}

export interface CommunityServer {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  banner_url?: string;
  owner_id: string;
  is_public: boolean;
  verification_level: 'none' | 'verified_email' | 'reputation';
  member_count?: number;
  categories?: ServerCategory[];
  channels?: ServerChannel[];
  created_at: string;
  updated_at: string;
}

export interface ServerCategory {
  id: string;
  server_id: string;
  name: string;
  position: number;
  created_at: string;
}

export interface ServerChannel {
  id: string;
  server_id: string;
  category_id?: string;
  name: string;
  type: 'text' | 'announcement' | 'ai-help' | 'project';
  topic?: string;
  position: number;
  is_private: boolean;
  slow_mode_seconds: number;
  created_at: string;
}

export interface ServerMember {
  server_id: string;
  user_id: string;
  nickname?: string;
  server_role: ServerRoleType;
  joined_at: string;
  profile?: UserProfile;
  roles?: ServerCustomRole[];
}

export interface ServerCustomRole {
  id: string;
  server_id: string;
  name: string;
  color: string;
  position: number;
  permissions: string[];
}

export interface ServerInvite {
  id: string;
  code: string;
  server_id: string;
  server_name?: string;
  created_by: string;
  max_uses: number;
  uses: number;
  expires_at?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  actor_id?: string;
  actor?: UserProfile;
  type: 
    | 'friend_request'
    | 'friend_accepted'
    | 'follow'
    | 'follow_request'
    | 'mention'
    | 'reply'
    | 'dm'
    | 'server_invite'
    | 'role_change'
    | 'premium_update'
    | 'system_notice';
  title: string;
  content: string;
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface PremiumRequest {
  id: string;
  user_id: string;
  user?: UserProfile;
  tier_id: PremiumTierId;
  status: PremiumRequestStatus;
  contact_message: string;
  payment_reference?: string;
  reviewed_by?: string;
  reviewer?: UserProfile;
  internal_note?: string;
  created_at: string;
  updated_at: string;
}

export interface ModerationReport {
  id: string;
  reporter_id: string;
  reporter?: UserProfile;
  target_type: 'user' | 'message' | 'server' | 'group';
  target_id: string;
  reason_category: 'harassment' | 'spam' | 'inappropriate' | 'impersonation' | 'hate_speech' | 'other';
  explanation: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  assigned_to?: string;
  resolution_note?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string;
  actor_name?: string;
  action: string;
  target_id?: string;
  target_name?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  ip_hash?: string;
  created_at: string;
}

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  updated_by?: string;
  updated_at: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used?: number;
  created_at: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  username: string;
  platformRole: PlatformRole;
  isSupreme: boolean;
  recentAuthTime: number; // epoch ms
}
