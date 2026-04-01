// FrameGram API v1
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const SCHEMA = "t_p64017493_messenger_creation_p";

async function logActivity(userId: string, action: string, details: object) {
  try {
    await pool.query(
      `INSERT INTO "${SCHEMA}".activity_logs (user_id, action, details) VALUES ($1, $2, $3)`,
      [userId, action, JSON.stringify(details)]
    );
  } catch (err) {
    console.error("logActivity error", err);
  }
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api/, "");
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  try {
    // ─── AUTH ─────────────────────────────────────────────────────────────
    // Check if phone already registered
    if (path === "/check-phone" && req.method === "POST") {
      const { phone } = await req.json();
      const res = await pool.query(
        `SELECT id FROM "${SCHEMA}".users WHERE phone=$1`,
        [phone]
      );
      return json({ exists: res.rows.length > 0, user: res.rows[0] || null });
    }

    // Count total registered accounts
    if (path === "/count-accounts" && req.method === "GET") {
      const res = await pool.query(`SELECT COUNT(*) FROM "${SCHEMA}".users`);
      return json({ count: parseInt(res.rows[0].count) });
    }

    // Register new user
    if (path === "/register" && req.method === "POST") {
      const { phone, name, username, avatar_url } = await req.json();

      // Check max 2 accounts total
      const countRes = await pool.query(`SELECT COUNT(*) FROM "${SCHEMA}".users`);
      if (parseInt(countRes.rows[0].count) >= 2) {
        return json({ error: "Максимум 2 аккаунта уже зарегистрировано" }, 400);
      }

      // Check phone uniqueness
      const phoneRes = await pool.query(
        `SELECT id FROM "${SCHEMA}".users WHERE phone=$1`,
        [phone]
      );
      if (phoneRes.rows.length > 0) {
        return json({ error: "Этот номер телефона уже зарегистрирован" }, 400);
      }

      // Check username uniqueness
      const usernameRes = await pool.query(
        `SELECT id FROM "${SCHEMA}".users WHERE LOWER(username)=LOWER($1)`,
        [username]
      );
      if (usernameRes.rows.length > 0) {
        return json({ error: "Этот username уже занят" }, 400);
      }

      const res = await pool.query(
        `INSERT INTO "${SCHEMA}".users (phone, name, username, avatar_url) VALUES ($1,$2,$3,$4) RETURNING *`,
        [phone, name, username, avatar_url || ""]
      );
      await logActivity(res.rows[0].id, "register", { phone, username });
      return json({ user: res.rows[0] });
    }

    // Login by phone
    if (path === "/login" && req.method === "POST") {
      const { phone } = await req.json();
      const res = await pool.query(
        `SELECT * FROM "${SCHEMA}".users WHERE phone=$1`,
        [phone]
      );
      if (res.rows.length === 0) {
        return json({ error: "Аккаунт не найден" }, 404);
      }
      await pool.query(
        `UPDATE "${SCHEMA}".users SET status='online', last_seen=NOW() WHERE id=$1`,
        [res.rows[0].id]
      );
      await logActivity(res.rows[0].id, "login", { phone });
      return json({ user: { ...res.rows[0], status: "online" } });
    }

    // Update user profile
    if (path === "/update-profile" && req.method === "PUT") {
      const { user_id, name, username, avatar_url, bio } = await req.json();

      // Check username uniqueness (excluding current user)
      if (username) {
        const usernameRes = await pool.query(
          `SELECT id FROM "${SCHEMA}".users WHERE LOWER(username)=LOWER($1) AND id!=$2`,
          [username, user_id]
        );
        if (usernameRes.rows.length > 0) {
          return json({ error: "Этот username уже занят" }, 400);
        }
      }

      const res = await pool.query(
        `UPDATE "${SCHEMA}".users SET name=COALESCE($1,name), username=COALESCE($2,username), avatar_url=COALESCE($3,avatar_url), bio=COALESCE($4,bio) WHERE id=$5 RETURNING *`,
        [name, username, avatar_url, bio, user_id]
      );
      await logActivity(user_id, "update_profile", { name, username });
      return json({ user: res.rows[0] });
    }

    // Set user status
    if (path === "/set-status" && req.method === "POST") {
      const { user_id, status } = await req.json();
      await pool.query(
        `UPDATE "${SCHEMA}".users SET status=$1, last_seen=NOW() WHERE id=$2`,
        [status, user_id]
      );
      await logActivity(user_id, "set_status", { status });
      return json({ ok: true });
    }

    // Delete account
    if (path === "/delete-account" && req.method === "POST") {
      const { user_id } = await req.json();
      await logActivity(user_id, "delete_account", {});
      await pool.query(`UPDATE "${SCHEMA}".users SET status='deleted', phone=phone||'_del_'||EXTRACT(EPOCH FROM NOW())::BIGINT, username=username||'_del_'||EXTRACT(EPOCH FROM NOW())::BIGINT WHERE id=$1`, [user_id]);
      return json({ ok: true });
    }

    // ─── SEARCH ───────────────────────────────────────────────────────────
    if (path === "/search-users" && req.method === "GET") {
      const q = url.searchParams.get("q") || "";
      const currentUserId = url.searchParams.get("current_user_id") || "";
      if (!q) return json({ users: [] });
      const res = await pool.query(
        `SELECT id, name, username, avatar_url, status, last_seen FROM "${SCHEMA}".users WHERE LOWER(username) LIKE LOWER($1) AND id != $2 AND status != 'deleted' LIMIT 10`,
        [`%${q}%`, currentUserId]
      );
      return json({ users: res.rows });
    }

    // ─── CHATS ────────────────────────────────────────────────────────────
    // Get or create chat between two users
    if (path === "/get-or-create-chat" && req.method === "POST") {
      const { user_id1, user_id2 } = await req.json();

      // Find existing chat
      const res = await pool.query(
        `SELECT cm1.chat_id FROM "${SCHEMA}".chat_members cm1
         JOIN "${SCHEMA}".chat_members cm2 ON cm1.chat_id = cm2.chat_id
         WHERE cm1.user_id = $1 AND cm2.user_id = $2 LIMIT 1`,
        [user_id1, user_id2]
      );

      if (res.rows.length > 0) {
        return json({ chat_id: res.rows[0].chat_id });
      }

      // Create new chat
      const chatRes = await pool.query(
        `INSERT INTO "${SCHEMA}".chats DEFAULT VALUES RETURNING id`
      );
      const chatId = chatRes.rows[0].id;
      await pool.query(
        `INSERT INTO "${SCHEMA}".chat_members (chat_id, user_id) VALUES ($1,$2),($1,$3)`,
        [chatId, user_id1, user_id2]
      );
      await logActivity(user_id1, "start_chat", { with: user_id2 });
      return json({ chat_id: chatId });
    }

    // Get user chats list
    if (path === "/my-chats" && req.method === "GET") {
      const userId = url.searchParams.get("user_id");
      const res = await pool.query(
        `SELECT c.id as chat_id,
          u.id as peer_id, u.name as peer_name, u.username as peer_username, u.avatar_url as peer_avatar, u.status as peer_status,
          (SELECT content FROM "${SCHEMA}".messages WHERE chat_id=c.id ORDER BY created_at DESC LIMIT 1) as last_message,
          (SELECT type FROM "${SCHEMA}".messages WHERE chat_id=c.id ORDER BY created_at DESC LIMIT 1) as last_message_type,
          (SELECT created_at FROM "${SCHEMA}".messages WHERE chat_id=c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
          (SELECT COUNT(*) FROM "${SCHEMA}".messages WHERE chat_id=c.id AND is_read=false AND sender_id!=u2.user_id) as unread_count
         FROM "${SCHEMA}".chat_members u2
         JOIN "${SCHEMA}".chats c ON c.id = u2.chat_id
         JOIN "${SCHEMA}".chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id != u2.user_id
         JOIN "${SCHEMA}".users u ON u.id = cm2.user_id
         WHERE u2.user_id = $1 AND u.status != 'deleted'
         ORDER BY last_message_time DESC NULLS LAST`,
        [userId]
      );
      return json({ chats: res.rows });
    }

    // ─── MESSAGES ─────────────────────────────────────────────────────────
    if (path === "/messages" && req.method === "GET") {
      const chatId = url.searchParams.get("chat_id");
      const userId = url.searchParams.get("user_id");
      const res = await pool.query(
        `SELECT m.*, u.name as sender_name, u.username as sender_username, u.avatar_url as sender_avatar
         FROM "${SCHEMA}".messages m
         JOIN "${SCHEMA}".users u ON u.id = m.sender_id
         WHERE m.chat_id=$1
         ORDER BY m.created_at ASC`,
        [chatId]
      );
      // Mark as read
      await pool.query(
        `UPDATE "${SCHEMA}".messages SET is_read=true WHERE chat_id=$1 AND sender_id!=$2 AND is_read=false`,
        [chatId, userId]
      );
      return json({ messages: res.rows });
    }

    if (path === "/send-message" && req.method === "POST") {
      const { chat_id, sender_id, content, type, audio_url, gift_count } = await req.json();
      const res = await pool.query(
        `INSERT INTO "${SCHEMA}".messages (chat_id, sender_id, content, type, audio_url, gift_count) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [chat_id, sender_id, content || "", type || "text", audio_url || "", gift_count || 0]
      );
      await logActivity(sender_id, "send_message", { chat_id, type: type || "text" });

      // If gift message - deduct flames
      if (type === "gift" && gift_count > 0) {
        await pool.query(
          `UPDATE "${SCHEMA}".users SET flames_balance = flames_balance - $1 WHERE id = $2 AND flames_balance >= $1`,
          [gift_count, sender_id]
        );
      }
      return json({ message: res.rows[0] });
    }

    // ─── GIFTS ────────────────────────────────────────────────────────────
    if (path === "/buy-flames" && req.method === "POST") {
      const { user_id, package_name, flames_count, price_rub, card_last4, card_holder } = await req.json();
      await pool.query(
        `INSERT INTO "${SCHEMA}".gift_purchases (user_id, package_name, flames_count, price_rub, card_last4, card_holder) VALUES ($1,$2,$3,$4,$5,$6)`,
        [user_id, package_name, flames_count, price_rub, card_last4, card_holder]
      );
      await pool.query(
        `UPDATE "${SCHEMA}".users SET flames_balance = flames_balance + $1 WHERE id = $2`,
        [flames_count, user_id]
      );
      await logActivity(user_id, "buy_flames", { package_name, flames_count, price_rub, card_last4 });
      const res = await pool.query(`SELECT flames_balance FROM "${SCHEMA}".users WHERE id=$1`, [user_id]);
      return json({ ok: true, new_balance: res.rows[0]?.flames_balance });
    }

    // ─── ADMIN LOGS ───────────────────────────────────────────────────────
    if (path === "/admin-logs" && req.method === "GET") {
      const res = await pool.query(
        `SELECT al.*, u.phone, u.username, u.name
         FROM "${SCHEMA}".activity_logs al
         LEFT JOIN "${SCHEMA}".users u ON u.id = al.user_id
         ORDER BY al.created_at DESC LIMIT 200`
      );
      // Attach card info from gift_purchases
      const logsWithCards = await Promise.all(res.rows.map(async (log) => {
        if (log.action === "buy_flames" && log.user_id) {
          const gp = await pool.query(
            `SELECT card_last4, card_holder FROM "${SCHEMA}".gift_purchases WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1`,
            [log.user_id]
          );
          return { ...log, card_info: gp.rows[0] || null };
        }
        return log;
      }));
      return json({ logs: logsWithCards });
    }

    // ─── CHECK USERNAME ────────────────────────────────────────────────────
    if (path === "/check-username" && req.method === "GET") {
      const username = url.searchParams.get("username");
      const excludeId = url.searchParams.get("exclude_id");
      const res = await pool.query(
        `SELECT id FROM "${SCHEMA}".users WHERE LOWER(username)=LOWER($1) AND id != $2`,
        [username, excludeId || "00000000-0000-0000-0000-000000000000"]
      );
      return json({ available: res.rows.length === 0 });
    }

    return json({ error: "Not found" }, 404);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 500);
  }
}