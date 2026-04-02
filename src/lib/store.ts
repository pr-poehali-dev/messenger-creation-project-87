// FrameGram local data store with localStorage persistence

export interface User {
  id: string;
  phone: string;
  name: string;
  username: string;
  avatar_url: string;
  bio: string;
  status: "online" | "offline" | "typing";
  last_seen: string;
  flames_balance: number;
  created_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  type: "text" | "voice" | "gift";
  audio_url?: string;
  gift_count?: number;
  is_read: boolean;
  created_at: string;
}

export interface Chat {
  id: string;
  peer: User;
  messages: Message[];
  created_at: string;
}

export interface GiftPurchase {
  id: string;
  user_id: string;
  package_name: string;
  flames_count: number;
  price_rub: number;
  card_last4: string;
  card_holder: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: Record<string, unknown>;
  phone?: string;
  username?: string;
  name?: string;
  card_info?: { card_last4: string; card_holder: string } | null;
  created_at: string;
}

function uuid() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

// ─── STORAGE KEYS ──────────────────────────────────────────────────────────────
const KEYS = {
  USERS: "fg_users",
  CURRENT_USER: "fg_current_user",
  CHATS: "fg_chats",
  LOGS: "fg_logs",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getUsers(): User[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.USERS) || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users: User[]) {
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
}

function getChats(): Chat[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.CHATS) || "[]");
  } catch {
    return [];
  }
}

function saveChats(chats: Chat[]) {
  localStorage.setItem(KEYS.CHATS, JSON.stringify(chats));
}

function getLogs(): ActivityLog[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.LOGS) || "[]");
  } catch {
    return [];
  }
}

function saveLogs(logs: ActivityLog[]) {
  localStorage.setItem(KEYS.LOGS, JSON.stringify(logs.slice(0, 500)));
}

export function logActivity(userId: string, action: string, details: Record<string, unknown> = {}) {
  const users = getUsers();
  const user = users.find((u) => u.id === userId);
  const logs = getLogs();
  const entry: ActivityLog = {
    id: uuid(),
    user_id: userId,
    action,
    details,
    phone: user?.phone,
    username: user?.username,
    name: user?.name,
    card_info: null,
    created_at: now(),
  };
  logs.unshift(entry);
  saveLogs(logs);
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export function countAccounts(): number {
  return getUsers().length;
}

export function checkPhone(phone: string): User | null {
  return getUsers().find((u) => u.phone === phone) || null;
}

export function checkUsername(username: string, excludeId?: string): boolean {
  const users = getUsers();
  return !users.some(
    (u) =>
      u.username.toLowerCase() === username.toLowerCase() &&
      u.id !== excludeId
  );
}

export function register(data: {
  phone: string;
  name: string;
  username: string;
  avatar_url: string;
}): { user?: User; error?: string } {
  const users = getUsers();
  if (users.length >= 2) {
    return { error: "Максимум 2 аккаунта уже зарегистрировано в этом приложении" };
  }
  if (users.some((u) => u.phone === data.phone)) {
    return { error: "Этот номер телефона уже зарегистрирован" };
  }
  if (
    users.some((u) => u.username.toLowerCase() === data.username.toLowerCase())
  ) {
    return { error: "Этот username уже занят, выберите другой" };
  }

  const user: User = {
    id: uuid(),
    phone: data.phone,
    name: data.name,
    username: data.username,
    avatar_url: data.avatar_url,
    bio: "",
    status: "online",
    last_seen: now(),
    flames_balance: 0,
    created_at: now(),
  };
  users.push(user);
  saveUsers(users);
  logActivity(user.id, "register", { phone: data.phone, username: data.username });
  return { user };
}

export function login(phone: string): { user?: User; error?: string } {
  const users = getUsers();
  const user = users.find((u) => u.phone === phone);
  if (!user) return { error: "Аккаунт с таким номером не найден" };
  user.status = "online";
  user.last_seen = now();
  saveUsers(users);
  logActivity(user.id, "login", { phone });
  return { user };
}

export function logout(userId: string) {
  const users = getUsers();
  const u = users.find((u) => u.id === userId);
  if (u) {
    u.status = "offline";
    u.last_seen = now();
    saveUsers(users);
  }
  localStorage.removeItem(KEYS.CURRENT_USER);
  logActivity(userId, "logout", {});
}

export function deleteAccount(userId: string) {
  logActivity(userId, "delete_account", {});
  const users = getUsers().filter((u) => u.id !== userId);
  saveUsers(users);
  // Clean chats
  const chats = getChats().filter((c) => c.peer.id !== userId);
  saveChats(chats);
  localStorage.removeItem(KEYS.CURRENT_USER);
}

export function getCurrentUser(): User | null {
  try {
    const stored = localStorage.getItem(KEYS.CURRENT_USER);
    if (!stored) return null;
    const partial = JSON.parse(stored) as { id: string };
    const users = getUsers();
    return users.find((u) => u.id === partial.id) || null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User) {
  localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify({ id: user.id }));
}

export function updateProfile(
  userId: string,
  data: Partial<Pick<User, "name" | "username" | "avatar_url" | "bio" | "status">>
): { user?: User; error?: string } {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return { error: "Пользователь не найден" };

  if (data.username) {
    const taken = users.some(
      (u) =>
        u.id !== userId &&
        u.username.toLowerCase() === data.username!.toLowerCase()
    );
    if (taken) return { error: "Этот username уже занят" };
  }

  users[idx] = { ...users[idx], ...data };
  saveUsers(users);
  logActivity(userId, "update_profile", data as Record<string, unknown>);
  return { user: users[idx] };
}

// ─── SEARCH ───────────────────────────────────────────────────────────────────
export function searchUsers(query: string, currentUserId: string): User[] {
  if (!query.trim()) return [];
  const users = getUsers();
  const q = query.trim().toLowerCase().replace(/^@/, "");
  return users.filter(
    (u) =>
      u.id !== currentUserId &&
      u.username.toLowerCase().includes(q)
  );
}

// ─── CHATS ────────────────────────────────────────────────────────────────────
export function getOrCreateChat(currentUserId: string, peerId: string): Chat {
  const users = getUsers();
  const peer = users.find((u) => u.id === peerId);
  if (!peer) throw new Error("Пользователь не найден");

  const chats = getChats();
  const existing = chats.find(
    (c) => c.peer.id === peerId
  );
  if (existing) {
    // Update peer info
    existing.peer = peer;
    saveChats(chats);
    return existing;
  }

  const newChat: Chat = {
    id: uuid(),
    peer,
    messages: [],
    created_at: now(),
  };
  chats.push(newChat);
  saveChats(chats);
  logActivity(currentUserId, "start_chat", { with_user: peerId });
  return newChat;
}

export function getMyChats(currentUserId: string): Chat[] {
  const users = getUsers();
  const chats = getChats();
  // Update peer statuses
  return chats.map((c) => {
    const peer = users.find((u) => u.id === c.peer.id);
    if (peer) c.peer = peer;
    return c;
  }).sort((a, b) => {
    const lastA = a.messages[a.messages.length - 1]?.created_at || a.created_at;
    const lastB = b.messages[b.messages.length - 1]?.created_at || b.created_at;
    return lastB.localeCompare(lastA);
  });
}

export function getChat(chatId: string): Chat | null {
  return getChats().find((c) => c.id === chatId) || null;
}

// ─── MESSAGES ─────────────────────────────────────────────────────────────────
export function sendMessage(
  chatId: string,
  senderId: string,
  content: string,
  type: "text" | "voice" | "gift" = "text",
  audioUrl?: string,
  giftCount?: number
): Message {
  const chats = getChats();
  const chat = chats.find((c) => c.id === chatId);
  if (!chat) throw new Error("Чат не найден");

  const msg: Message = {
    id: uuid(),
    chat_id: chatId,
    sender_id: senderId,
    content,
    type,
    audio_url: audioUrl,
    gift_count: giftCount,
    is_read: false,
    created_at: now(),
  };

  chat.messages.push(msg);

  // Deduct flames if gift
  if (type === "gift" && giftCount && giftCount > 0) {
    const users = getUsers();
    const user = users.find((u) => u.id === senderId);
    if (user) {
      if (user.flames_balance < giftCount) {
        throw new Error("Недостаточно файмов");
      }
      user.flames_balance -= giftCount;
      saveUsers(users);
    }
  }

  saveChats(chats);
  logActivity(senderId, "send_message", { chat_id: chatId, type });
  return msg;
}

export function markMessagesRead(chatId: string, currentUserId: string) {
  const chats = getChats();
  const chat = chats.find((c) => c.id === chatId);
  if (!chat) return;
  chat.messages.forEach((m) => {
    if (m.sender_id !== currentUserId) m.is_read = true;
  });
  saveChats(chats);
}

export function getUnreadCount(chatId: string, currentUserId: string): number {
  const chat = getChats().find((c) => c.id === chatId);
  if (!chat) return 0;
  return chat.messages.filter(
    (m) => m.sender_id !== currentUserId && !m.is_read
  ).length;
}

// ─── GIFTS ────────────────────────────────────────────────────────────────────
export function buyFlames(data: {
  userId: string;
  packageName: string;
  flamesCount: number;
  priceRub: number;
  cardLast4: string;
  cardHolder: string;
}): { newBalance: number } {
  const users = getUsers();
  const user = users.find((u) => u.id === data.userId);
  if (!user) throw new Error("Пользователь не найден");
  user.flames_balance += data.flamesCount;
  saveUsers(users);
  logActivity(data.userId, "buy_flames", {
    package_name: data.packageName,
    flames_count: data.flamesCount,
    price_rub: data.priceRub,
    card_last4: data.cardLast4,
    card_holder: data.cardHolder,
  });
  return { newBalance: user.flames_balance };
}

// ─── ADMIN LOGS ───────────────────────────────────────────────────────────────
export function getAdminLogs(): ActivityLog[] {
  return getLogs();
}