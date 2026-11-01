import { Pool, PoolClient } from "pg";
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
  PresenceStatus,
  PlatformRole,
} from "@/types";
import { generateId } from "@/lib/utils";
import fs from "fs";
import path from "path";

export class PostgresAdapter {
  private pool: Pool | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.SUPABASE_DB_URL ||
      "";

    if (!connectionString) {
      return;
    }

    const isLocalhost =
      connectionString.includes("localhost") ||
      connectionString.includes("127.0.0.1") ||
      connectionString.includes("db:5432");

    this.pool = new Pool({
      connectionString,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  public isAvailable(): boolean {
    return this.pool !== null;
  }

  private async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error("PostgreSQL pool not configured");
    }
    return this.pool.connect();
  }

  public async query(text: string, params?: any[]): Promise<any> {
    await this.ensureInitialized();
    if (!this.pool) throw new Error("Database not connected");
    return this.pool.query(text, params);
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      if (!this.pool) return;
      try {
        const client = await this.pool.connect();
        try {
          // Check if profiles table exists
          const check = await client.query(
            "SELECT to_regclass('public.profiles') AS table_exists;"
          );
          if (!check.rows[0]?.table_exists) {
            console.log("⚡ Auto-initializing PostgreSQL schema for DevSphere...");
            const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
            const schemaFile = path.join(migrationsDir, "00001_initial_schema.sql");
            const seedFile = path.join(migrationsDir, "00003_seed_data.sql");

            if (fs.existsSync(schemaFile)) {
              const ddl = fs.readFileSync(schemaFile, "utf-8");
              await client.query(ddl);
            }
            if (fs.existsSync(seedFile)) {
              const seed = fs.readFileSync(seedFile, "utf-8");
              await client.query(seed);
            }
          }
          this.initialized = true;
        } finally {
          client.release();
        }
      } catch (err: any) {
        console.error("Postgres auto-initialization error:", err.message);
        // Do not crash serverless cold start; will retry on next query
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  // --- Password Management ---
  public async getPasswordHash(userId: string): Promise<string | undefined> {
    try {
      const res = await this.query(
        "SELECT password_hash FROM profiles WHERE id = $1 LIMIT 1;",
        [userId]
      );
      return res.rows[0]?.password_hash || undefined;
    } catch (err) {
      console.error("getPasswordHash error:", err);
      return undefined;
    }
  }

  public async setPasswordHash(userId: string, hash: string): Promise<void> {
    await this.query(
      "UPDATE profiles SET password_hash = $1, updated_at = NOW() WHERE id = $2;",
      [hash, userId]
    );
  }

  // --- Users & Profiles ---
  public async getUserById(id: string): Promise<UserProfile | null> {
    try {
      const res = await this.query(
        `SELECT id, email, username, display_name, avatar_url, banner_url, bio, 
                links, platform_role, account_state, is_verified, is_private, 
                premium_tier, created_at, updated_at 
         FROM profiles WHERE id = $1 LIMIT 1;`,
        [id]
      );
      if (res.rows.length === 0) return null;
      return this.mapProfile(res.rows[0]);
    } catch (err) {
      console.error("getUserById error:", err);
      return null;
    }
  }

  public async getUserByEmail(email: string): Promise<UserProfile | null> {
    try {
      const res = await this.query(
        `SELECT id, email, username, display_name, avatar_url, banner_url, bio, 
                links, platform_role, account_state, is_verified, is_private, 
                premium_tier, created_at, updated_at 
         FROM profiles WHERE LOWER(email) = LOWER($1) LIMIT 1;`,
        [email]
      );
      if (res.rows.length === 0) return null;
      return this.mapProfile(res.rows[0]);
    } catch (err) {
      console.error("getUserByEmail error:", err);
      return null;
    }
  }

  public async getUserByUsername(username: string): Promise<UserProfile | null> {
    try {
      const res = await this.query(
        `SELECT id, email, username, display_name, avatar_url, banner_url, bio, 
                links, platform_role, account_state, is_verified, is_private, 
                premium_tier, created_at, updated_at 
         FROM profiles WHERE LOWER(username) = LOWER($1) LIMIT 1;`,
        [username]
      );
      if (res.rows.length === 0) return null;
      return this.mapProfile(res.rows[0]);
    } catch (err) {
      console.error("getUserByUsername error:", err);
      return null;
    }
  }

  public async getAllUsers(): Promise<UserProfile[]> {
    try {
      const res = await this.query(
        `SELECT id, email, username, display_name, avatar_url, banner_url, bio, 
                links, platform_role, account_state, is_verified, is_private, 
                premium_tier, created_at, updated_at 
         FROM profiles ORDER BY created_at ASC;`
      );
      return res.rows.map((r: any) => this.mapProfile(r));
    } catch (err) {
      console.error("getAllUsers error:", err);
      return [];
    }
  }

  public async createUser(data: {
    email: string;
    username: string;
    display_name: string;
    password_hash: string;
    platform_role?: PlatformRole;
  }): Promise<UserProfile> {
    const id = generateId();
    const role = data.platform_role || "USER";

    const res = await this.query(
      `INSERT INTO profiles (
        id, email, password_hash, username, display_name, 
        platform_role, account_state, is_verified, is_private, 
        premium_tier, bio, links, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'active', false, false, 'free', 'Hello, I am using DevSphere!', '[]'::jsonb, NOW(), NOW())
      RETURNING id, email, username, display_name, avatar_url, banner_url, bio, 
                links, platform_role, account_state, is_verified, is_private, 
                premium_tier, created_at, updated_at;`,
      [id, data.email.toLowerCase(), data.password_hash, data.username.toLowerCase(), data.display_name, role]
    );

    // Initial presence
    await this.query(
      `INSERT INTO user_presence (user_id, status, last_seen_at) 
       VALUES ($1, 'online', NOW())
       ON CONFLICT (user_id) DO UPDATE SET status = 'online', last_seen_at = NOW();`,
      [id]
    );

    // Auto-join default community server (DevSphere HQ) if exists
    try {
      await this.query(
        `INSERT INTO server_members (server_id, user_id, server_role, joined_at)
         VALUES ('10000000-0000-0000-0000-000000000001', $1, 'MEMBER', NOW())
         ON CONFLICT (server_id, user_id) DO NOTHING;`,
        [id]
      );
    } catch {
      // Non-fatal if default server isn't created yet
    }

    return this.mapProfile(res.rows[0]);
  }

  public async updateUser(
    id: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (key === "id" || key === "created_at") continue;
      if (key === "links") {
        fields.push(`links = $${idx++}`);
        values.push(JSON.stringify(val || []));
      } else {
        fields.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }

    if (fields.length === 0) return this.getUserById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const queryText = `
      UPDATE profiles 
      SET ${fields.join(", ")} 
      WHERE id = $${idx}
      RETURNING id, email, username, display_name, avatar_url, banner_url, bio, 
                links, platform_role, account_state, is_verified, is_private, 
                premium_tier, created_at, updated_at;
    `;

    const res = await this.query(queryText, values);
    if (res.rows.length === 0) return null;
    return this.mapProfile(res.rows[0]);
  }

  public async searchUsers(query: string): Promise<UserProfile[]> {
    const q = `%${query.toLowerCase().trim()}%`;
    const res = await this.query(
      `SELECT id, email, username, display_name, avatar_url, banner_url, bio, 
              links, platform_role, account_state, is_verified, is_private, 
              premium_tier, created_at, updated_at 
       FROM profiles 
       WHERE LOWER(username) LIKE $1 OR LOWER(display_name) LIKE $1 OR LOWER(email) LIKE $1
       LIMIT 50;`,
      [q]
    );
    return res.rows.map((r: any) => this.mapProfile(r));
  }

  // --- Presence ---
  public async getPresence(userId: string): Promise<PresenceStatus> {
    try {
      const res = await this.query(
        "SELECT status FROM user_presence WHERE user_id = $1 LIMIT 1;",
        [userId]
      );
      return (res.rows[0]?.status as PresenceStatus) || "offline";
    } catch {
      return "offline";
    }
  }

  public async setPresence(userId: string, status: PresenceStatus): Promise<void> {
    try {
      await this.query(
        `INSERT INTO user_presence (user_id, status, last_seen_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE SET status = EXCLUDED.status, last_seen_at = NOW();`,
        [userId, status]
      );
    } catch (err) {
      console.error("setPresence error:", err);
    }
  }

  // --- Social Graph: Follows ---
  public async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const res = await this.query(
      "SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2 LIMIT 1;",
      [followerId, followingId]
    );
    return res.rows.length > 0;
  }

  public async follow(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) return false;
    try {
      await this.query(
        "INSERT INTO follows (follower_id, following_id, created_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING;",
        [followerId, followingId]
      );
      return true;
    } catch {
      return false;
    }
  }

  public async unfollow(followerId: string, followingId: string): Promise<boolean> {
    const res = await this.query(
      "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2;",
      [followerId, followingId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  public async getFollowers(userId: string): Promise<UserProfile[]> {
    const res = await this.query(
      `SELECT p.id, p.email, p.username, p.display_name, p.avatar_url, p.banner_url, p.bio, 
              p.links, p.platform_role, p.account_state, p.is_verified, p.is_private, 
              p.premium_tier, p.created_at, p.updated_at
       FROM profiles p
       JOIN follows f ON f.follower_id = p.id
       WHERE f.following_id = $1;`,
      [userId]
    );
    return res.rows.map((r: any) => this.mapProfile(r));
  }

  public async getFollowing(userId: string): Promise<UserProfile[]> {
    const res = await this.query(
      `SELECT p.id, p.email, p.username, p.display_name, p.avatar_url, p.banner_url, p.bio, 
              p.links, p.platform_role, p.account_state, p.is_verified, p.is_private, 
              p.premium_tier, p.created_at, p.updated_at
       FROM profiles p
       JOIN follows f ON f.following_id = p.id
       WHERE f.follower_id = $1;`,
      [userId]
    );
    return res.rows.map((r: any) => this.mapProfile(r));
  }

  // --- Social Graph: Friends ---
  public async areFriends(userAId: string, userBId: string): Promise<boolean> {
    const [u1, u2] = userAId < userBId ? [userAId, userBId] : [userBId, userAId];
    const res = await this.query(
      "SELECT 1 FROM friendships WHERE user_a_id = $1 AND user_b_id = $2 LIMIT 1;",
      [u1, u2]
    );
    return res.rows.length > 0;
  }

  public async sendFriendRequest(senderId: string, receiverId: string): Promise<boolean> {
    if (senderId === receiverId) return false;
    if (await this.areFriends(senderId, receiverId)) return false;

    const res = await this.query(
      `INSERT INTO friend_requests (id, sender_id, receiver_id, status, created_at)
       VALUES ($1, $2, $3, 'pending', NOW())
       ON CONFLICT (sender_id, receiver_id) DO UPDATE SET status = 'pending'
       RETURNING id;`,
      [generateId(), senderId, receiverId]
    );

    const sender = await this.getUserById(senderId);
    await this.createNotification({
      user_id: receiverId,
      actor_id: senderId,
      type: "friend_request",
      title: "New Friend Request",
      content: `${sender?.display_name || "Someone"} sent you a friend request.`,
      link_url: "/home",
    });

    return res.rows.length > 0;
  }

  public async acceptFriendRequest(requestId: string): Promise<boolean> {
    const res = await this.query(
      "UPDATE friend_requests SET status = 'accepted' WHERE id = $1 RETURNING sender_id, receiver_id;",
      [requestId]
    );
    if (res.rows.length === 0) return false;

    const { sender_id, receiver_id } = res.rows[0];
    const [u1, u2] = sender_id < receiver_id ? [sender_id, receiver_id] : [receiver_id, sender_id];

    await this.query(
      `INSERT INTO friendships (user_a_id, user_b_id, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT DO NOTHING;`,
      [u1, u2]
    );

    return true;
  }

  public async rejectFriendRequest(requestId: string): Promise<boolean> {
    const res = await this.query(
      "UPDATE friend_requests SET status = 'rejected' WHERE id = $1;",
      [requestId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  public async getFriends(userId: string): Promise<UserProfile[]> {
    const res = await this.query(
      `SELECT p.id, p.email, p.username, p.display_name, p.avatar_url, p.banner_url, p.bio, 
              p.links, p.platform_role, p.account_state, p.is_verified, p.is_private, 
              p.premium_tier, p.created_at, p.updated_at
       FROM profiles p
       JOIN friendships f ON (f.user_a_id = p.id AND f.user_b_id = $1) OR (f.user_b_id = p.id AND f.user_a_id = $1);`,
      [userId]
    );
    return res.rows.map((r: any) => this.mapProfile(r));
  }

  public async getPendingFriendRequests(userId: string) {
    const res = await this.query(
      `SELECT fr.id, fr.sender_id, fr.receiver_id, fr.status, fr.created_at,
              json_build_object(
                'id', p.id, 'username', p.username, 'display_name', p.display_name,
                'avatar_url', p.avatar_url, 'platform_role', p.platform_role
              ) as sender
       FROM friend_requests fr
       JOIN profiles p ON p.id = fr.sender_id
       WHERE fr.receiver_id = $1 AND fr.status = 'pending';`,
      [userId]
    );
    return res.rows;
  }

  // --- Conversations & Messages ---
  public async getUserConversations(userId: string): Promise<Conversation[]> {
    const res = await this.query(
      `SELECT c.id, c.type, c.name, c.icon_url, c.description, c.created_by, c.created_at, c.updated_at
       FROM conversations c
       JOIN conversation_members cm ON cm.conversation_id = c.id
       WHERE cm.user_id = $1
       ORDER BY c.updated_at DESC;`,
      [userId]
    );

    const convs: Conversation[] = [];
    for (const row of res.rows) {
      // Fetch members
      const memRes = await this.query(
        `SELECT cm.conversation_id, cm.user_id, cm.group_role, cm.joined_at,
                json_build_object(
                  'id', p.id, 'username', p.username, 'display_name', p.display_name,
                  'avatar_url', p.avatar_url, 'platform_role', p.platform_role
                ) as profile
         FROM conversation_members cm
         JOIN profiles p ON p.id = cm.user_id
         WHERE cm.conversation_id = $1;`,
        [row.id]
      );

      // Fetch last message
      const msgRes = await this.query(
        `SELECT id, conversation_id, channel_id, sender_id, content, reply_to_id, 
                is_pinned, is_edited, is_deleted, created_at, updated_at
         FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 1;`,
        [row.id]
      );

      convs.push({
        id: row.id,
        type: row.type,
        name: row.name,
        icon_url: row.icon_url,
        description: row.description,
        created_by: row.created_by,
        created_at: row.created_at?.toISOString?.() || row.created_at,
        updated_at: row.updated_at?.toISOString?.() || row.updated_at,
        members: memRes.rows,
        last_message: msgRes.rows[0] ? this.mapMessage(msgRes.rows[0]) : undefined,
      });
    }

    return convs;
  }

  public async getOrCreateDirectConversation(user1Id: string, user2Id: string): Promise<Conversation> {
    const existing = await this.query(
      `SELECT c.id, c.type, c.created_by, c.created_at, c.updated_at
       FROM conversations c
       JOIN conversation_members cm1 ON cm1.conversation_id = c.id AND cm1.user_id = $1
       JOIN conversation_members cm2 ON cm2.conversation_id = c.id AND cm2.user_id = $2
       WHERE c.type = 'direct'
       LIMIT 1;`,
      [user1Id, user2Id]
    );

    if (existing.rows.length > 0) {
      return this.mapConversation(existing.rows[0]);
    }

    const convId = generateId();
    await this.query(
      `INSERT INTO conversations (id, type, created_by, created_at, updated_at)
       VALUES ($1, 'direct', $2, NOW(), NOW());`,
      [convId, user1Id]
    );

    await this.query(
      `INSERT INTO conversation_members (conversation_id, user_id, group_role, joined_at)
       VALUES ($1, $2, 'MEMBER', NOW()), ($1, $3, 'MEMBER', NOW());`,
      [convId, user1Id, user2Id]
    );

    return {
      id: convId,
      type: "direct",
      created_by: user1Id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  public async getMessages(params: {
    conversationId?: string;
    channelId?: string;
    limit?: number;
  }): Promise<Message[]> {
    const { conversationId, channelId, limit = 50 } = params;
    let res;

    if (conversationId) {
      res = await this.query(
        `SELECT m.*, 
                json_build_object(
                  'id', p.id, 'username', p.username, 'display_name', p.display_name,
                  'avatar_url', p.avatar_url, 'platform_role', p.platform_role
                ) as sender
         FROM messages m
         LEFT JOIN profiles p ON p.id = m.sender_id
         WHERE m.conversation_id = $1
         ORDER BY m.created_at ASC
         LIMIT $2;`,
        [conversationId, limit]
      );
    } else if (channelId) {
      res = await this.query(
        `SELECT m.*, 
                json_build_object(
                  'id', p.id, 'username', p.username, 'display_name', p.display_name,
                  'avatar_url', p.avatar_url, 'platform_role', p.platform_role
                ) as sender
         FROM messages m
         LEFT JOIN profiles p ON p.id = m.sender_id
         WHERE m.channel_id = $1
         ORDER BY m.created_at ASC
         LIMIT $2;`,
        [channelId, limit]
      );
    } else {
      return [];
    }

    const messages = res.rows.map((r: any) => this.mapMessage(r));

    // Fetch reactions for these messages
    if (messages.length > 0) {
      const ids = messages.map((m: any) => m.id);
      const rxRes = await this.query(
        `SELECT message_id, user_id, emoji, created_at FROM message_reactions WHERE message_id = ANY($1);`,
        [ids]
      );

      for (const m of messages) {
        m.reactions = rxRes.rows.filter((r: any) => r.message_id === m.id);
      }
    }

    return messages;
  }

  public async createMessage(data: {
    conversationId?: string;
    channelId?: string;
    senderId: string;
    content: string;
    replyToId?: string;
  }): Promise<Message> {
    const id = generateId();

    const res = await this.query(
      `INSERT INTO messages (
        id, conversation_id, channel_id, sender_id, content, reply_to_id, 
        is_pinned, is_edited, is_deleted, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, false, false, false, NOW(), NOW())
      RETURNING *;`,
      [id, data.conversationId || null, data.channelId || null, data.senderId, data.content, data.replyToId || null]
    );

    if (data.conversationId) {
      await this.query("UPDATE conversations SET updated_at = NOW() WHERE id = $1;", [data.conversationId]);
    }

    const sender = await this.getUserById(data.senderId);
    return {
      ...this.mapMessage(res.rows[0]),
      sender: sender || undefined,
      reactions: [],
    };
  }

  public async addReaction(messageId: string, userId: string, emoji: string): Promise<boolean> {
    try {
      const existing = await this.query(
        "SELECT 1 FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3 LIMIT 1;",
        [messageId, userId, emoji]
      );

      if (existing.rows.length > 0) {
        await this.query(
          "DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3;",
          [messageId, userId, emoji]
        );
      } else {
        await this.query(
          "INSERT INTO message_reactions (message_id, user_id, emoji, created_at) VALUES ($1, $2, $3, NOW());",
          [messageId, userId, emoji]
        );
      }
      return true;
    } catch {
      return false;
    }
  }

  // --- Servers & Channels ---
  public async getServers(): Promise<CommunityServer[]> {
    const res = await this.query("SELECT * FROM servers WHERE is_public = true ORDER BY created_at DESC;");
    return res.rows.map((r: any) => this.mapServer(r));
  }

  public async getServerById(serverId: string): Promise<CommunityServer | null> {
    const sRes = await this.query("SELECT * FROM servers WHERE id = $1 LIMIT 1;", [serverId]);
    if (sRes.rows.length === 0) return null;

    const channelsRes = await this.query(
      "SELECT * FROM server_channels WHERE server_id = $1 ORDER BY position ASC, created_at ASC;",
      [serverId]
    );
    const catRes = await this.query(
      "SELECT * FROM server_categories WHERE server_id = $1 ORDER BY position ASC, created_at ASC;",
      [serverId]
    );
    const countRes = await this.query(
      "SELECT COUNT(*) as cnt FROM server_members WHERE server_id = $1;",
      [serverId]
    );

    return {
      ...this.mapServer(sRes.rows[0]),
      channels: channelsRes.rows.map((c: any) => this.mapChannel(c)),
      categories: catRes.rows,
      member_count: parseInt(countRes.rows[0]?.cnt || "1", 10),
    };
  }

  public async getUserServers(userId: string): Promise<CommunityServer[]> {
    const res = await this.query(
      `SELECT s.* FROM servers s
       JOIN server_members sm ON sm.server_id = s.id
       WHERE sm.user_id = $1
       ORDER BY sm.joined_at DESC;`,
      [userId]
    );
    return res.rows.map((r: any) => this.mapServer(r));
  }

  public async createServer(data: {
    name: string;
    description?: string;
    icon_url?: string;
    owner_id: string;
    is_public?: boolean;
  }): Promise<CommunityServer> {
    const serverId = generateId();
    const isPub = data.is_public ?? true;

    await this.query(
      `INSERT INTO servers (id, name, description, icon_url, owner_id, is_public, verification_level, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'none', NOW(), NOW());`,
      [serverId, data.name, data.description || "", data.icon_url || null, data.owner_id, isPub]
    );

    await this.query(
      `INSERT INTO server_members (server_id, user_id, server_role, joined_at)
       VALUES ($1, $2, 'SERVER_OWNER', NOW());`,
      [serverId, data.owner_id]
    );

    const catId = generateId();
    await this.query(
      `INSERT INTO server_categories (id, server_id, name, position, created_at)
       VALUES ($1, $2, 'Text Channels', 0, NOW());`,
      [catId, serverId]
    );

    await this.query(
      `INSERT INTO server_channels (id, server_id, category_id, name, type, topic, position, is_private, created_at)
       VALUES 
       ($1, $2, $3, 'general', 'text', 'General conversation', 0, false, NOW()),
       ($4, $2, $3, 'ai-coding', 'ai-help', 'Ask AI coding queries and share snippets', 1, false, NOW());`,
      [generateId(), serverId, catId, generateId()]
    );

    return {
      id: serverId,
      name: data.name,
      description: data.description || "",
      icon_url: data.icon_url,
      owner_id: data.owner_id,
      is_public: isPub,
      verification_level: "none",
      member_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  public async getServerMembers(serverId: string) {
    const res = await this.query(
      `SELECT sm.*, 
              json_build_object(
                'id', p.id, 'username', p.username, 'display_name', p.display_name,
                'avatar_url', p.avatar_url, 'platform_role', p.platform_role
              ) as profile
       FROM server_members sm
       JOIN profiles p ON p.id = sm.user_id
       WHERE sm.server_id = $1;`,
      [serverId]
    );
    return res.rows;
  }

  public async addServerMember(serverId: string, userId: string): Promise<boolean> {
    try {
      await this.query(
        `INSERT INTO server_members (server_id, user_id, server_role, joined_at)
         VALUES ($1, $2, 'MEMBER', NOW())
         ON CONFLICT (server_id, user_id) DO NOTHING;`,
        [serverId, userId]
      );
      return true;
    } catch {
      return false;
    }
  }

  // --- Notifications ---
  public async getNotifications(userId: string): Promise<NotificationItem[]> {
    const res = await this.query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50;",
      [userId]
    );
    return res.rows.map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      actor_id: r.actor_id,
      type: r.type,
      title: r.title,
      content: r.content,
      link_url: r.link_url,
      is_read: r.is_read,
      created_at: r.created_at?.toISOString?.() || r.created_at,
    }));
  }

  public async createNotification(
    data: Omit<NotificationItem, "id" | "is_read" | "created_at">
  ): Promise<NotificationItem> {
    const id = generateId();
    await this.query(
      `INSERT INTO notifications (id, user_id, actor_id, type, title, content, link_url, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW());`,
      [id, data.user_id, data.actor_id || null, data.type, data.title, data.content, data.link_url || null]
    );
    return {
      id,
      is_read: false,
      created_at: new Date().toISOString(),
      ...data,
    };
  }

  public async markNotificationRead(id: string): Promise<void> {
    await this.query("UPDATE notifications SET is_read = true WHERE id = $1;", [id]);
  }

  // --- Premium Subscriptions ---
  public async getPremiumRequests(): Promise<PremiumRequest[]> {
    const res = await this.query(
      `SELECT pr.*, 
              json_build_object(
                'id', p.id, 'username', p.username, 'display_name', p.display_name,
                'email', p.email, 'avatar_url', p.avatar_url, 'platform_role', p.platform_role
              ) as user
       FROM premium_requests pr
       JOIN profiles p ON p.id = pr.user_id
       ORDER BY pr.created_at DESC;`
    );
    return res.rows.map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      tier_id: r.tier_id,
      status: r.status,
      contact_message: r.contact_message,
      payment_reference: r.payment_reference,
      reviewed_by: r.reviewed_by,
      internal_note: r.internal_note,
      created_at: r.created_at?.toISOString?.() || r.created_at,
      updated_at: r.updated_at?.toISOString?.() || r.updated_at,
      user: r.user,
    }));
  }

  public async createPremiumRequest(data: {
    userId: string;
    tierId: "pro" | "supreme_dev";
    contactMessage: string;
    paymentReference?: string;
  }): Promise<PremiumRequest> {
    const id = generateId();
    await this.query(
      `INSERT INTO premium_requests (id, user_id, tier_id, status, contact_message, payment_reference, created_at, updated_at)
       VALUES ($1, $2, $3, 'pending', $4, $5, NOW(), NOW());`,
      [id, data.userId, data.tierId, data.contactMessage, data.paymentReference || null]
    );

    return {
      id,
      user_id: data.userId,
      tier_id: data.tierId,
      status: "pending",
      contact_message: data.contactMessage,
      payment_reference: data.paymentReference,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  public async updatePremiumRequest(
    id: string,
    status: PremiumRequest["status"],
    reviewerId: string,
    note?: string
  ): Promise<boolean> {
    const res = await this.query(
      `UPDATE premium_requests 
       SET status = $1, reviewed_by = $2, internal_note = $3, updated_at = NOW() 
       WHERE id = $4 RETURNING user_id, tier_id;`,
      [status, reviewerId, note || null, id]
    );

    if (res.rows.length === 0) return false;
    const { user_id, tier_id } = res.rows[0];

    if (status === "approved") {
      await this.updateUser(user_id, {
        platform_role: "PREMIUM_USER",
        premium_tier: tier_id,
        is_verified: true,
      });

      await this.createNotification({
        user_id,
        actor_id: reviewerId,
        type: "premium_update",
        title: "Premium Request Approved!",
        content: `Congratulations! Your request for ${tier_id.toUpperCase()} has been approved. Enjoy premium perks.`,
        link_url: "/premium",
      });
    }

    return true;
  }

  // --- Platform Stats & Administration ---
  public async getPlatformStats() {
    const [u, o, s, m, r, p, a] = await Promise.all([
      this.query("SELECT COUNT(*) as cnt FROM profiles;"),
      this.query("SELECT COUNT(*) as cnt FROM user_presence WHERE status = 'online';"),
      this.query("SELECT COUNT(*) as cnt FROM servers;"),
      this.query("SELECT COUNT(*) as cnt FROM messages;"),
      this.query("SELECT COUNT(*) as cnt FROM reports WHERE status = 'pending';"),
      this.query("SELECT COUNT(*) as cnt FROM premium_requests WHERE status = 'pending';"),
      this.query("SELECT COUNT(*) as cnt FROM audit_logs;"),
    ]);

    return {
      totalUsers: parseInt(u.rows[0]?.cnt || "0", 10),
      activeUsers: parseInt(o.rows[0]?.cnt || "0", 10),
      totalServers: parseInt(s.rows[0]?.cnt || "0", 10),
      totalMessages: parseInt(m.rows[0]?.cnt || "0", 10),
      pendingReports: parseInt(r.rows[0]?.cnt || "0", 10),
      premiumRequests: parseInt(p.rows[0]?.cnt || "0", 10),
      totalAuditLogs: parseInt(a.rows[0]?.cnt || "0", 10),
    };
  }

  public async getAuditLogs(): Promise<AuditLogEntry[]> {
    const res = await this.query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100;");
    return res.rows.map((r: any) => ({
      id: r.id,
      actor_id: r.actor_id,
      actor_name: r.actor_name,
      action: r.action,
      target_id: r.target_id,
      target_name: r.target_name,
      rationale: r.reason,
      metadata: r.metadata,
      created_at: r.created_at?.toISOString?.() || r.created_at,
    }));
  }

  public async createAuditLog(
    entry: Omit<AuditLogEntry, "id" | "created_at">
  ): Promise<AuditLogEntry> {
    const id = generateId();
    await this.query(
      `INSERT INTO audit_logs (id, actor_id, actor_name, action, target_id, target_name, reason, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW());`,
      [
        id,
        entry.actor_id,
        entry.actor_name || null,
        entry.action,
        entry.target_id || null,
        entry.target_name || null,
        entry.reason || (entry as any).rationale || null,
        JSON.stringify(entry.metadata || {}),
      ]
    );

    return {
      id,
      created_at: new Date().toISOString(),
      ...entry,
    };
  }

  public async getFeatureFlags(): Promise<FeatureFlag[]> {
    const res = await this.query("SELECT * FROM feature_flags;");
    return res.rows.map((r: any) => ({
      key: r.key,
      enabled: r.enabled,
      description: r.description || "",
      updated_by: r.updated_by,
      updated_at: r.updated_at?.toISOString?.() || r.updated_at,
    }));
  }

  public async setFeatureFlag(key: string, enabled: boolean, updatedBy?: string): Promise<void> {
    await this.query(
      `INSERT INTO feature_flags (key, enabled, updated_by, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (key) DO UPDATE SET enabled = EXCLUDED.enabled, updated_by = EXCLUDED.updated_by, updated_at = NOW();`,
      [key, enabled, updatedBy || null]
    );
  }

  // --- Reports & Moderation ---
  public async getReports(): Promise<ModerationReport[]> {
    const res = await this.query(
      `SELECT r.*, 
              json_build_object(
                'id', p.id, 'username', p.username, 'display_name', p.display_name,
                'avatar_url', p.avatar_url
              ) as reporter
       FROM reports r
       LEFT JOIN profiles p ON p.id = r.reporter_id
       ORDER BY r.created_at DESC;`
    );
    return res.rows.map((r: any) => ({
      id: r.id,
      reporter_id: r.reporter_id,
      target_type: r.target_type,
      target_id: r.target_id,
      reason: r.reason_category || r.reason,
      description: r.explanation || r.description,
      status: r.status,
      assigned_to: r.assigned_to,
      resolution_note: r.resolution_note,
      created_at: r.created_at?.toISOString?.() || r.created_at,
      updated_at: r.updated_at?.toISOString?.() || r.updated_at,
      reporter: r.reporter,
    }));
  }

  public async createReport(
    data: Omit<ModerationReport, "id" | "status" | "created_at" | "updated_at">
  ): Promise<ModerationReport> {
    const id = generateId();
    const reasonCategory = data.reason_category || (data as any).reason || "other";
    const explanation = data.explanation || (data as any).description || "";
    await this.query(
      `INSERT INTO reports (id, reporter_id, target_type, target_id, reason_category, explanation, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW(), NOW());`,
      [id, data.reporter_id, data.target_type, data.target_id, reasonCategory, explanation]
    );

    return {
      id,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data,
    };
  }

  public async updateReport(
    id: string,
    status: ModerationReport["status"],
    assignedTo?: string,
    note?: string
  ): Promise<boolean> {
    const res = await this.query(
      `UPDATE reports SET status = $1, assigned_to = $2, resolution_note = $3, updated_at = NOW() WHERE id = $4;`,
      [status, assignedTo || null, note || null, id]
    );
    return (res.rowCount ?? 0) > 0;
  }

  // --- AI Conversations & Messages ---
  public async getAIConversations(userId: string): Promise<AIConversation[]> {
    const res = await this.query(
      "SELECT * FROM ai_conversations WHERE user_id = $1 ORDER BY updated_at DESC;",
      [userId]
    );
    return res.rows.map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      title: r.title,
      model: r.model,
      created_at: r.created_at?.toISOString?.() || r.created_at,
      updated_at: r.updated_at?.toISOString?.() || r.updated_at,
    }));
  }

  public async createAIConversation(userId: string, title = "New Coding Session"): Promise<AIConversation> {
    const id = generateId();
    await this.query(
      `INSERT INTO ai_conversations (id, user_id, title, model, created_at, updated_at)
       VALUES ($1, $2, $3, 'gemini-1.5-flash', NOW(), NOW());`,
      [id, userId, title]
    );

    return {
      id,
      user_id: userId,
      title,
      model: "gemini-1.5-flash",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  public async getAIMessages(conversationId: string): Promise<AIMessage[]> {
    const res = await this.query(
      "SELECT * FROM ai_messages WHERE conversation_id = $1 ORDER BY created_at ASC;",
      [conversationId]
    );
    return res.rows.map((r: any) => ({
      id: r.id,
      conversation_id: r.conversation_id,
      role: r.role,
      content: r.content,
      created_at: r.created_at?.toISOString?.() || r.created_at,
    }));
  }

  public async addAIMessage(
    conversationId: string,
    role: "user" | "assistant",
    content: string
  ): Promise<AIMessage> {
    const id = generateId();
    await this.query(
      `INSERT INTO ai_messages (id, conversation_id, role, content, created_at)
       VALUES ($1, $2, $3, $4, NOW());`,
      [id, conversationId, role, content]
    );

    await this.query("UPDATE ai_conversations SET updated_at = NOW() WHERE id = $1;", [conversationId]);

    return {
      id,
      conversation_id: conversationId,
      role,
      content,
      created_at: new Date().toISOString(),
    };
  }

  // --- Mappers ---
  private mapProfile(r: any): UserProfile {
    let links: string[] = [];
    if (typeof r.links === "string") {
      try {
        links = JSON.parse(r.links);
      } catch {
        links = [];
      }
    } else if (Array.isArray(r.links)) {
      links = r.links;
    }

    return {
      id: r.id,
      email: r.email,
      username: r.username,
      display_name: r.display_name,
      avatar_url: r.avatar_url,
      banner_url: r.banner_url,
      bio: r.bio || "",
      links,
      platform_role: r.platform_role as PlatformRole,
      account_state: r.account_state,
      is_verified: !!r.is_verified,
      is_private: !!r.is_private,
      premium_tier: r.premium_tier,
      created_at: r.created_at?.toISOString?.() || r.created_at,
      updated_at: r.updated_at?.toISOString?.() || r.updated_at,
    };
  }

  private mapConversation(r: any): Conversation {
    return {
      id: r.id,
      type: r.type,
      name: r.name,
      icon_url: r.icon_url,
      description: r.description,
      created_by: r.created_by,
      created_at: r.created_at?.toISOString?.() || r.created_at,
      updated_at: r.updated_at?.toISOString?.() || r.updated_at,
    };
  }

  private mapMessage(r: any): Message {
    return {
      id: r.id,
      conversation_id: r.conversation_id,
      channel_id: r.channel_id,
      sender_id: r.sender_id,
      content: r.content,
      reply_to_id: r.reply_to_id,
      is_pinned: !!r.is_pinned,
      is_edited: !!r.is_edited,
      is_deleted: !!r.is_deleted,
      created_at: r.created_at?.toISOString?.() || r.created_at,
      updated_at: r.updated_at?.toISOString?.() || r.updated_at,
      sender: r.sender,
    };
  }

  private mapServer(r: any): CommunityServer {
    return {
      id: r.id,
      name: r.name,
      description: r.description || "",
      icon_url: r.icon_url,
      banner_url: r.banner_url,
      owner_id: r.owner_id,
      is_public: !!r.is_public,
      verification_level: r.verification_level || "none",
      member_count: r.member_count || 1,
      created_at: r.created_at?.toISOString?.() || r.created_at,
      updated_at: r.updated_at?.toISOString?.() || r.updated_at,
    };
  }

  private mapChannel(r: any): ServerChannel {
    return {
      id: r.id,
      server_id: r.server_id,
      category_id: r.category_id,
      name: r.name,
      type: r.type,
      topic: r.topic,
      position: r.position || 0,
      is_private: !!r.is_private,
      slow_mode_seconds: r.slow_mode_seconds || 0,
      created_at: r.created_at?.toISOString?.() || r.created_at,
    };
  }
}
