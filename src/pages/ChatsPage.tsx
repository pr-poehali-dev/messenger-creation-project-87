import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, getMyChats, searchUsers, getOrCreateChat, type Chat, type User, getUnreadCount } from "@/lib/store";

export default function ChatsPage() {
  const nav = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);

  const loadChats = useCallback(() => {
    const u = getCurrentUser();
    if (!u) { nav("/"); return; }
    setCurrentUser(u);
    setChats(getMyChats(u.id));
  }, [nav]);

  useEffect(() => {
    loadChats();
    const interval = setInterval(loadChats, 1500);
    return () => clearInterval(interval);
  }, [loadChats]);

  useEffect(() => {
    const u = getCurrentUser();
    if (!searchQuery.trim() || !u) {
      setSearchResults([]);
      return;
    }
    const results = searchUsers(searchQuery, u.id);
    setSearchResults(results);
  }, [searchQuery]);

  const openChat = (peerId: string) => {
    if (!currentUser) return;
    const chat = getOrCreateChat(currentUser.id, peerId);
    setSearchQuery("");
    nav(`/chat/${chat.id}`);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("ru", { day: "2-digit", month: "2-digit" });
  };

  const getLastMessagePreview = (chat: Chat) => {
    const last = chat.messages[chat.messages.length - 1];
    if (!last) return "Нет сообщений";
    if (last.type === "voice") return "🎤 Голосовое сообщение";
    if (last.type === "gift") return `🔥 ${last.gift_count} файмов`;
    return last.content.length > 30 ? last.content.slice(0, 30) + "…" : last.content;
  };

  return (
    <div className="min-h-screen bg-[#0d0d14] flex flex-col">
      {/* Header */}
      <div className="bg-[#12101a]/80 backdrop-blur-xl border-b border-white/5 px-4 pt-safe-top">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <img
                src="https://cdn.poehali.dev/projects/e6503a55-64a7-4d56-b4f1-632f331398a8/files/2e9695c1-90b4-40f0-8088-6821e6193157.jpg"
                alt="FG"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-white font-bold text-lg">FrameGram</span>
          </div>
          <button
            onClick={() => nav("/settings")}
            className="w-9 h-9 rounded-full overflow-hidden bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
          >
            {currentUser?.avatar_url ? (
              <img src={currentUser.avatar_url} alt="me" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white/60 text-lg">⚙️</span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative pb-4">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <span className="text-white/30 text-sm">🔍</span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по @username..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-500/40 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-3 flex items-center text-white/40 hover:text-white/60"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="flex-1 overflow-y-auto">
          {searchResults.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-white/40 text-sm">Пользователь @{searchQuery} не найден</p>
              <p className="text-white/20 text-xs mt-1">Убедитесь, что второй аккаунт зарегистрирован</p>
            </div>
          )}
          {searchResults.map((user) => (
            <button
              key={user.id}
              onClick={() => openChat(user.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-lg">{user.name[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0d0d14] ${user.status === "online" ? "bg-green-400" : "bg-white/20"}`} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-medium text-sm">{user.name}</p>
                <p className="text-white/40 text-xs">@{user.username}</p>
              </div>
              <span className="text-white/20 text-xs">Написать →</span>
            </button>
          ))}
        </div>
      )}

      {/* Chats List */}
      {!searchQuery && (
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="text-center py-20 px-8">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-white font-semibold text-lg mb-2">Нет чатов</h3>
              <p className="text-white/40 text-sm">
                Найдите кого-нибудь по @username и начните общение
              </p>
            </div>
          ) : (
            chats.map((chat) => {
              const unread = currentUser ? getUnreadCount(chat.id, currentUser.id) : 0;
              const lastMsg = chat.messages[chat.messages.length - 1];
              return (
                <button
                  key={chat.id}
                  onClick={() => nav(`/chat/${chat.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/3"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center">
                      {chat.peer.avatar_url ? (
                        <img src={chat.peer.avatar_url} alt={chat.peer.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-lg">{chat.peer.name[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#0d0d14] ${chat.peer.status === "online" ? "bg-green-400" : "bg-white/20"}`} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-white font-medium text-sm truncate">{chat.peer.name}</p>
                      {lastMsg && (
                        <span className="text-white/30 text-xs flex-shrink-0 ml-2">{formatTime(lastMsg.created_at)}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-white/40 text-xs truncate">{getLastMessagePreview(chat)}</p>
                      {unread > 0 && (
                        <span className="ml-2 flex-shrink-0 bg-orange-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}