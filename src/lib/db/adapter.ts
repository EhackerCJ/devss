import fs from "fs";
import path from "path";
import type { DatabaseState } from "./types";
import { getInitialDatabaseState, INITIAL_ACCOUNT_HASHES } from "./initial-data";
import type {
  UserProfile,
  Message,
  CommunityServer,
  ServerChannel,
  Conversation,
  NotificationItem,
  PremiumRequest,
  ModerationReport,
  AuditLogEntry,
  FeatureFlag,
  AIConversation,
  AIMessage,
  ServerInvite,
  PresenceStatus,
  PlatformRole,
} from "@/types";
import { generateId } from "@/lib/utils";

const DATA_DIR =
  process.env.DATA_DIR ||
  (process.env.VERCEL ? path.join("/tmp", "devsphere-data") : path.join(process.cwd(), "data"));
const STORE_PATH = path.join(DATA_DIR, "devsphere-store.json");

class DatabaseAdapter {
  private state: DatabaseState;
  private isLoaded = false;
  private userPasswords: Map<string, string> = new Map();

  constructor() {
    this.state = getInitialDatabaseState();
    // Distinct secure password hash for each account
    for (const p of this.state.profiles) {
      const hash = INITIAL_ACCOUNT_HASHES[p.email] || INITIAL_ACCOUNT_HASHES["member@devsphere.io"];
      this.userPasswords.set(p.id, hash);
    }
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        this.state = { ...getInitialDatabaseState(), ...parsed };
      } else {
        this.saveToDisk();
      }
      this.isLoaded = true;
    } catch {
      // Memory fallback if disk writes are restricted
      this.isLoaded = true;
    }
  }

  private saveToDisk(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_PATH, JSON.stringify(this.state, null, 2), "utf-8");
    } catch {
      // In-memory operation remains active
    }
  }

  // --- Password Management (Separate from public profiles) ---
  public getPasswordHash(userId: string): string | undefined {
    const hash = this.userPasswords.get(userId);
    if (hash) return hash;
    const user = this.state.profiles.find((p) => p.id === userId);
    if (user && INITIAL_ACCOUNT_HASHES[user.email]) {
      return INITIAL_ACCOUNT_HASHES[user.email];
    }
    return INITIAL_ACCOUNT_HASHES["member@devsphere.io"];
  }

  public setPasswordHash(userId: string, hash: string): void {
    this.userPasswords.set(userId, hash);
  }

  // --- Users & Profiles ---
  public async getUserById(id: string): Promise<UserProfile | null> {
    return this.state.profiles.find((p) => p.id === id) || null;
  }

  public async getUserByEmail(email: string): Promise<UserProfile | null> {
    return (
      this.state.profiles.find(
        (p) => p.email.toLowerCase() === email.toLowerCase()
      ) || null
    );
  }

  public async getUserByUsername(username: string): Promise<UserProfile | null> {
    return (
      this.state.profiles.find(
        (p) => p.username.toLowerCase() === username.toLowerCase()
      ) || null
    );
  }

  public async getAllUsers(): Promise<UserProfile[]> {
    return [...this.state.profiles];
  }

  public async createUser(data: {
    email: string;
    username: string;
    display_name: string;
    password_hash: string;
    platform_role?: PlatformRole;
  }): Promise<UserProfile> {
    const id = generateId();
    const newUser: UserProfile = {
      id,
      email: data.email.toLowerCase(),
      username: data.username.toLowerCase(),
      display_name: data.display_name,
      bio: "Hello, I am using DevSphere!",
      links: [],
      platform_role: data.platform_role || "USER",
      account_state: "active",
      is_verified: false,
      is_private: false,
      premium_tier: "free",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.state.profiles.push(newUser);
    this.userPasswords.set(id, data.password_hash);

    // Initial presence
    this.state.user_presence.push({
      user_id: id,
      status: "online",
      last_seen_at: new Date().toISOString(),
    });

    // Auto-join default community server (DevSphere HQ)
    this.state.server_members.push({
      server_id: "10000000-0000-0000-0000-000000000001",
      user_id: id,
      server_role: "MEMBER",
      joined_at: new Date().toISOString(),
    });

    this.saveToDisk();
    return newUser;
  }

  public async updateUser(
    id: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile | null> {
    const idx = this.state.profiles.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    this.state.profiles[idx] = {
      ...this.state.profiles[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveToDisk();
    return this.state.profiles[idx];
  }

  public async searchUsers(query: string): Promise<UserProfile[]> {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return this.state.profiles.filter(
      (p) =>
        p.username.toLowerCase().includes(q) ||
        p.display_name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
    );
  }

  // --- Presence ---
  public async getPresence(userId: string): Promise<PresenceStatus> {
    const p = this.state.user_presence.find((up) => up.user_id === userId);
    return p ? p.status : "offline";
  }

  public async setPresence(userId: string, status: PresenceStatus): Promise<void> {
    const idx = this.state.user_presence.findIndex((up) => up.user_id === userId);
    if (idx >= 0) {
      this.state.user_presence[idx].status = status;
      this.state.user_presence[idx].last_seen_at = new Date().toISOString();
    } else {
      this.state.user_presence.push({
        user_id: userId,
        status,
        last_seen_at: new Date().toISOString(),
      });
    }
    this.saveToDisk();
  }

  // --- Social Graph: Follows ---
  public async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    return this.state.follows.some(
      (f) => f.follower_id === followerId && f.following_id === followingId
    );
  }

  public async follow(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) return false;
    if (await this.isFollowing(followerId, followingId)) return true;

    this.state.follows.push({
      follower_id: followerId,
      following_id: followingId,
      created_at: new Date().toISOString(),
    });
    this.saveToDisk();
    return true;
  }

  public async unfollow(followerId: string, followingId: string): Promise<boolean> {
    const lenBefore = this.state.follows.length;
    this.state.follows = this.state.follows.filter(
      (f) => !(f.follower_id === followerId && f.following_id === followingId)
    );
    this.saveToDisk();
    return this.state.follows.length < lenBefore;
  }

  public async getFollowers(userId: string): Promise<UserProfile[]> {
    const followerIds = this.state.follows
      .filter((f) => f.following_id === userId)
      .map((f) => f.follower_id);
    return this.state.profiles.filter((p) => followerIds.includes(p.id));
  }

  public async getFollowing(userId: string): Promise<UserProfile[]> {
    const followingIds = this.state.follows
      .filter((f) => f.follower_id === userId)
      .map((f) => f.following_id);
    return this.state.profiles.filter((p) => followingIds.includes(p.id));
  }

  // --- Social Graph: Friends ---
  public async areFriends(userAId: string, userBId: string): Promise<boolean> {
    const [u1, u2] = userAId < userBId ? [userAId, userBId] : [userBId, userAId];
    return this.state.friendships.some(
      (f) => f.user_a_id === u1 && f.user_b_id === u2
    );
  }

  public async sendFriendRequest(
    senderId: string,
    receiverId: string
  ): Promise<boolean> {
    if (senderId === receiverId) return false;
    if (await this.areFriends(senderId, receiverId)) return false;

    const exists = this.state.friend_requests.some(
      (fr) =>
        fr.sender_id === senderId &&
        fr.receiver_id === receiverId &&
        fr.status === "pending"
    );
    if (exists) return true;

    this.state.friend_requests.push({
      id: generateId(),
      sender_id: senderId,
      receiver_id: receiverId,
      status: "pending",
      created_at: new Date().toISOString(),
    });

    // Notify receiver
    const sender = await this.getUserById(senderId);
    this.createNotification({
      user_id: receiverId,
      actor_id: senderId,
      type: "friend_request",
      title: "New Friend Request",
      content: `${sender?.display_name || "Someone"} sent you a friend request.`,
      link_url: "/home",
    });

    this.saveToDisk();
    return true;
  }

  public async acceptFriendRequest(requestId: string): Promise<boolean> {
    const req = this.state.friend_requests.find((fr) => fr.id === requestId);
    if (!req || req.status !== "pending") return false;

    req.status = "accepted";
    const [u1, u2] =
      req.sender_id < req.receiver_id
        ? [req.sender_id, req.receiver_id]
        : [req.receiver_id, req.sender_id];

    if (!this.state.friendships.some((f) => f.user_a_id === u1 && f.user_b_id === u2)) {
      this.state.friendships.push({
        user_a_id: u1,
        user_b_id: u2,
        created_at: new Date().toISOString(),
      });
    }

    this.saveToDisk();
    return true;
  }

  public async rejectFriendRequest(requestId: string): Promise<boolean> {
    const req = this.state.friend_requests.find((fr) => fr.id === requestId);
    if (!req) return false;
    req.status = "rejected";
    this.saveToDisk();
    return true;
  }

  public async getFriends(userId: string): Promise<UserProfile[]> {
    const friendIds = this.state.friendships
      .filter((f) => f.user_a_id === userId || f.user_b_id === userId)
      .map((f) => (f.user_a_id === userId ? f.user_b_id : f.user_a_id));
    return this.state.profiles.filter((p) => friendIds.includes(p.id));
  }

  public async getPendingFriendRequests(userId: string) {
    const requests = this.state.friend_requests.filter(
      (fr) => fr.receiver_id === userId && fr.status === "pending"
    );
    const result = [];
    for (const r of requests) {
      const sender = await this.getUserById(r.sender_id);
      result.push({ ...r, sender });
    }
    return result;
  }

  // --- Conversations & Direct Messages ---
  public async getUserConversations(userId: string): Promise<Conversation[]> {
    const memberConvIds = this.state.conversation_members
      .filter((cm) => cm.user_id === userId)
      .map((cm) => cm.conversation_id);

    const convs = this.state.conversations.filter((c) =>
      memberConvIds.includes(c.id)
    );

    const enriched: Conversation[] = [];
    for (const c of convs) {
      const members = this.state.conversation_members.filter(
        (cm) => cm.conversation_id === c.id
      );
      const enrichedMembers = await Promise.all(
        members.map(async (m) => ({
          ...m,
          profile: (await this.getUserById(m.user_id)) || undefined,
        }))
      );
      const messages = this.state.messages.filter((m) => m.conversation_id === c.id);
      const lastMessage = messages[messages.length - 1];

      enriched.push({
        ...c,
        members: enrichedMembers,
        last_message: lastMessage,
      });
    }

    return enriched;
  }

  public async getOrCreateDirectConversation(
    user1Id: string,
    user2Id: string
  ): Promise<Conversation> {
    // Check existing
    const existing = this.state.conversations.find((c) => {
      if (c.type !== "direct") return false;
      const mems = this.state.conversation_members.filter(
        (cm) => cm.conversation_id === c.id
      );
      const ids = mems.map((m) => m.user_id);
      return ids.includes(user1Id) && ids.includes(user2Id);
    });

    if (existing) return existing;

    const convId = generateId();
    const newConv: Conversation = {
      id: convId,
      type: "direct",
      created_by: user1Id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.state.conversations.push(newConv);
    this.state.conversation_members.push(
      {
        conversation_id: convId,
        user_id: user1Id,
        group_role: "MEMBER",
        joined_at: new Date().toISOString(),
      },
      {
        conversation_id: convId,
        user_id: user2Id,
        group_role: "MEMBER",
        joined_at: new Date().toISOString(),
      }
    );

    this.saveToDisk();
    return newConv;
  }

  public async getMessages(params: {
    conversationId?: string;
    channelId?: string;
    limit?: number;
  }): Promise<Message[]> {
    const { conversationId, channelId, limit = 50 } = params;
    let msgs: Message[] = [];

    if (conversationId) {
      msgs = this.state.messages.filter((m) => m.conversation_id === conversationId);
    } else if (channelId) {
      msgs = this.state.messages.filter((m) => m.channel_id === channelId);
    }

    // Attach sender and reactions
    const enriched = await Promise.all(
      msgs.slice(-limit).map(async (m) => {
        const sender = await this.getUserById(m.sender_id);
        const reactions = this.state.message_reactions.filter(
          (r) => r.message_id === m.id
        );
        return {
          ...m,
          sender: sender || undefined,
          reactions,
        };
      })
    );

    return enriched;
  }

  public async createMessage(data: {
    conversationId?: string;
    channelId?: string;
    senderId: string;
    content: string;
    replyToId?: string;
  }): Promise<Message> {
    const id = generateId();
    const newMsg: Message = {
      id,
      conversation_id: data.conversationId,
      channel_id: data.channelId,
      sender_id: data.senderId,
      content: data.content,
      reply_to_id: data.replyToId,
      is_pinned: false,
      is_edited: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.state.messages.push(newMsg);
    this.saveToDisk();

    const sender = await this.getUserById(data.senderId);
    return { ...newMsg, sender: sender || undefined, reactions: [] };
  }

  public async addReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<boolean> {
    const existing = this.state.message_reactions.some(
      (r) => r.message_id === messageId && r.user_id === userId && r.emoji === emoji
    );
    if (existing) {
      // Toggle off
      this.state.message_reactions = this.state.message_reactions.filter(
        (r) => !(r.message_id === messageId && r.user_id === userId && r.emoji === emoji)
      );
    } else {
      this.state.message_reactions.push({
        message_id: messageId,
        user_id: userId,
        emoji,
        created_at: new Date().toISOString(),
      });
    }
    this.saveToDisk();
    return true;
  }

  // --- Servers & Channels ---
  public async getServers(): Promise<CommunityServer[]> {
    return [...this.state.servers];
  }

  public async getServerById(serverId: string): Promise<CommunityServer | null> {
    const s = this.state.servers.find((srv) => srv.id === serverId);
    if (!s) return null;

    const channels = this.state.server_channels.filter(
      (sc) => sc.server_id === serverId
    );
    const categories = this.state.server_categories.filter(
      (sc) => sc.server_id === serverId
    );
    const members = this.state.server_members.filter(
      (sm) => sm.server_id === serverId
    );

    return {
      ...s,
      channels,
      categories,
      member_count: members.length,
    };
  }

  public async getUserServers(userId: string): Promise<CommunityServer[]> {
    const joinedServerIds = this.state.server_members
      .filter((sm) => sm.user_id === userId)
      .map((sm) => sm.server_id);
    return this.state.servers.filter((s) => joinedServerIds.includes(s.id));
  }

  public async createServer(data: {
    name: string;
    description?: string;
    icon_url?: string;
    owner_id: string;
    is_public?: boolean;
  }): Promise<CommunityServer> {
    const serverId = generateId();
    const newServer: CommunityServer = {
      id: serverId,
      name: data.name,
      description: data.description || "",
      icon_url: data.icon_url,
      owner_id: data.owner_id,
      is_public: data.is_public ?? true,
      verification_level: "none",
      member_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.state.servers.push(newServer);

    // Add owner as SERVER_OWNER
    this.state.server_members.push({
      server_id: serverId,
      user_id: data.owner_id,
      server_role: "SERVER_OWNER",
      joined_at: new Date().toISOString(),
    });

    // Default channels
    const catId = generateId();
    this.state.server_categories.push({
      id: catId,
      server_id: serverId,
      name: "Text Channels",
      position: 0,
      created_at: new Date().toISOString(),
    });

    this.state.server_channels.push(
      {
        id: generateId(),
        server_id: serverId,
        category_id: catId,
        name: "general",
        type: "text",
        topic: "General conversation",
        position: 0,
        is_private: false,
        slow_mode_seconds: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: generateId(),
        server_id: serverId,
        category_id: catId,
        name: "ai-coding",
        type: "ai-help",
        topic: "Ask AI coding queries and share snippets",
        position: 1,
        is_private: false,
        slow_mode_seconds: 0,
        created_at: new Date().toISOString(),
      }
    );

    this.saveToDisk();
    return newServer;
  }

  public async getServerMembers(serverId: string) {
    const mems = this.state.server_members.filter((sm) => sm.server_id === serverId);
    return Promise.all(
      mems.map(async (m) => ({
        ...m,
        profile: (await this.getUserById(m.user_id)) || undefined,
      }))
    );
  }

  public async addServerMember(serverId: string, userId: string): Promise<boolean> {
    const exists = this.state.server_members.some(
      (sm) => sm.server_id === serverId && sm.user_id === userId
    );
    if (exists) return true;

    this.state.server_members.push({
      server_id: serverId,
      user_id: userId,
      server_role: "MEMBER",
      joined_at: new Date().toISOString(),
    });
    this.saveToDisk();
    return true;
  }

  // --- Notifications ---
  public async getNotifications(userId: string): Promise<NotificationItem[]> {
    return this.state.notifications
      .filter((n) => n.user_id === userId)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }

  public async createNotification(
    data: Omit<NotificationItem, "id" | "is_read" | "created_at">
  ): Promise<NotificationItem> {
    const item: NotificationItem = {
      id: generateId(),
      is_read: false,
      created_at: new Date().toISOString(),
      ...data,
    };
    this.state.notifications.unshift(item);
    this.saveToDisk();
    return item;
  }

  public async markNotificationRead(id: string): Promise<void> {
    const n = this.state.notifications.find((item) => item.id === id);
    if (n) {
      n.is_read = true;
      this.saveToDisk();
    }
  }

  // --- Premium Subscriptions & Contact Workflow ---
  public async getPremiumRequests(): Promise<PremiumRequest[]> {
    return Promise.all(
      this.state.premium_requests.map(async (pr) => ({
        ...pr,
        user: (await this.getUserById(pr.user_id)) || undefined,
      }))
    );
  }

  public async createPremiumRequest(data: {
    userId: string;
    tierId: "pro" | "supreme_dev";
    contactMessage: string;
    paymentReference?: string;
  }): Promise<PremiumRequest> {
    const newReq: PremiumRequest = {
      id: generateId(),
      user_id: data.userId,
      tier_id: data.tierId,
      status: "pending",
      contact_message: data.contactMessage,
      payment_reference: data.paymentReference,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.state.premium_requests.unshift(newReq);
    this.saveToDisk();
    return newReq;
  }

  public async updatePremiumRequest(
    id: string,
    status: PremiumRequest["status"],
    reviewerId: string,
    note?: string
  ): Promise<boolean> {
    const req = this.state.premium_requests.find((r) => r.id === id);
    if (!req) return false;

    req.status = status;
    req.reviewed_by = reviewerId;
    req.internal_note = note;
    req.updated_at = new Date().toISOString();

    if (status === "approved") {
      await this.updateUser(req.user_id, {
        platform_role: "PREMIUM_USER",
        premium_tier: req.tier_id,
        is_verified: true,
      });

      this.createNotification({
        user_id: req.user_id,
        actor_id: reviewerId,
        type: "premium_update",
        title: "Premium Request Approved!",
        content: `Congratulations! Your request for ${req.tier_id.toUpperCase()} has been approved. Enjoy premium perks.`,
        link_url: "/premium",
      });
    }

    this.saveToDisk();
    return true;
  }

  // --- Supreme & Platform Administration ---
  public async getPlatformStats() {
    return {
      totalUsers: this.state.profiles.length,
      activeUsers: this.state.user_presence.filter((p) => p.status === "online").length,
      totalServers: this.state.servers.length,
      totalMessages: this.state.messages.length,
      pendingReports: this.state.reports.filter((r) => r.status === "pending").length,
      premiumRequests: this.state.premium_requests.filter((r) => r.status === "pending").length,
      totalAuditLogs: this.state.audit_logs.length,
    };
  }

  public async getAuditLogs(): Promise<AuditLogEntry[]> {
    return [...this.state.audit_logs].reverse();
  }

  public async createAuditLog(
    entry: Omit<AuditLogEntry, "id" | "created_at">
  ): Promise<AuditLogEntry> {
    const item: AuditLogEntry = {
      id: generateId(),
      created_at: new Date().toISOString(),
      ...entry,
    };
    this.state.audit_logs.push(item);
    this.saveToDisk();
    return item;
  }

  public async getFeatureFlags(): Promise<FeatureFlag[]> {
    return [...this.state.feature_flags];
  }

  public async setFeatureFlag(
    key: string,
    enabled: boolean,
    updatedBy?: string
  ): Promise<void> {
    const flag = this.state.feature_flags.find((f) => f.key === key);
    if (flag) {
      flag.enabled = enabled;
      flag.updated_by = updatedBy;
      flag.updated_at = new Date().toISOString();
    } else {
      this.state.feature_flags.push({
        key,
        enabled,
        description: "",
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      });
    }
    this.saveToDisk();
  }

  // --- Reports & Moderation ---
  public async getReports(): Promise<ModerationReport[]> {
    return Promise.all(
      this.state.reports.map(async (r) => ({
        ...r,
        reporter: (await this.getUserById(r.reporter_id)) || undefined,
      }))
    );
  }

  public async createReport(
    data: Omit<ModerationReport, "id" | "status" | "created_at" | "updated_at">
  ): Promise<ModerationReport> {
    const item: ModerationReport = {
      id: generateId(),
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data,
    };
    this.state.reports.unshift(item);
    this.saveToDisk();
    return item;
  }

  public async updateReport(
    id: string,
    status: ModerationReport["status"],
    assignedTo?: string,
    note?: string
  ): Promise<boolean> {
    const r = this.state.reports.find((rep) => rep.id === id);
    if (!r) return false;
    r.status = status;
    r.assigned_to = assignedTo;
    r.resolution_note = note;
    r.updated_at = new Date().toISOString();
    this.saveToDisk();
    return true;
  }

  // --- AI Conversations & Quota ---
  public async getAIConversations(userId: string): Promise<AIConversation[]> {
    return this.state.ai_conversations.filter((c) => c.user_id === userId);
  }

  public async createAIConversation(
    userId: string,
    title = "New Coding Session"
  ): Promise<AIConversation> {
    const item: AIConversation = {
      id: generateId(),
      user_id: userId,
      title,
      model: "gemini-1.5-flash",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.state.ai_conversations.unshift(item);
    this.saveToDisk();
    return item;
  }

  public async getAIMessages(conversationId: string): Promise<AIMessage[]> {
    return this.state.ai_messages.filter(
      (m) => m.conversation_id === conversationId
    );
  }

  public async addAIMessage(
    conversationId: string,
    role: "user" | "assistant",
    content: string
  ): Promise<AIMessage> {
    const msg: AIMessage = {
      id: generateId(),
      conversation_id: conversationId,
      role,
      content,
      created_at: new Date().toISOString(),
    };
    this.state.ai_messages.push(msg);
    this.saveToDisk();
    return msg;
  }
}

// Global Singleton Database Instance
export const db = new DatabaseAdapter();
