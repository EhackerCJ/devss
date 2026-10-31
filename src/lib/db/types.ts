import type {
  UserProfile,
  UserSettings,
  UserPresence,
  Follow,
  FollowRequest,
  Friendship,
  FriendRequest,
  BlockRecord,
  Conversation,
  ConversationMember,
  Message,
  MessageReaction,
  CommunityServer,
  ServerCategory,
  ServerChannel,
  ServerMember,
  ServerInvite,
  NotificationItem,
  PremiumRequest,
  ModerationReport,
  AuditLogEntry,
  FeatureFlag,
  AIConversation,
  AIMessage,
} from "@/types";

export interface DatabaseState {
  profiles: UserProfile[];
  user_settings: UserSettings[];
  user_presence: UserPresence[];
  follows: Follow[];
  follow_requests: FollowRequest[];
  friendships: Friendship[];
  friend_requests: FriendRequest[];
  blocks: BlockRecord[];
  mutes: { user_id: string; muted_user_id: string; created_at: string }[];
  conversations: Conversation[];
  conversation_members: ConversationMember[];
  messages: Message[];
  message_reactions: MessageReaction[];
  servers: CommunityServer[];
  server_categories: ServerCategory[];
  server_channels: ServerChannel[];
  server_members: ServerMember[];
  invites: ServerInvite[];
  notifications: NotificationItem[];
  premium_requests: PremiumRequest[];
  reports: ModerationReport[];
  audit_logs: AuditLogEntry[];
  feature_flags: FeatureFlag[];
  ai_conversations: AIConversation[];
  ai_messages: AIMessage[];
  ai_usage: { user_id: string; date: string; tokens: number; requests: number }[];
}
