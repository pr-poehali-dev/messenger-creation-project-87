import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCurrentUser,
  updateProfile,
  logout,
  deleteAccount,
  getAdminLogs,
  type User,
  type ActivityLog,
} from "@/lib/store";

const DEV_PROMO = "dev01Hell";

export default function SettingsPage() {
  const nav = useNavigate();
  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState(false);

  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [showDevConsole, setShowDevConsole] = useState(false);
  const [devLogs, setDevLogs] = useState<ActivityLog[]>([]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  if (!user) { nav("/"); return null; }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setSaveError("");
    setSaveOk(false);
    if (!name.trim()) { setSaveError("Введите имя"); return; }
    if (!username.trim()) { setSaveError("Введите username"); return; }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setSaveError("Username: 3-20 символов, латиница, цифры и _");
      return;
    }
    setSaving(true);
    const result = updateProfile(user.id, {
      name: name.trim(),
      username: username.trim(),
      bio: bio.trim(),
      avatar_url: avatarPreview,
    });
    setSaving(false);
    if (result.error) {
      setSaveError(result.error);
    } else if (result.user) {
      setUser(result.user);
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2000);
    }
  };

  const handlePromo = () => {
    setPromoError("");
    if (promoCode.trim() === DEV_PROMO) {
      const logs = getAdminLogs();
      setDevLogs(logs);
      setShowDevConsole(true);
      setPromoCode("");
    } else {
      setPromoError("Неверный промокод");
    }
  };

  const refreshDevLogs = () => {
    setDevLogs(getAdminLogs());
    setTimeout(() => consoleRef.current?.scrollTo(0, 0), 50);
  };

  const handleLogout = () => {
    logout(user.id);
    nav("/");
  };

  const handleDelete = () => {
    deleteAccount(user.id);
    nav("/");
  };

  const getActionColor = (action: string) => {
    if (action.includes("login") || action.includes("register")) return "text-green-400";
    if (action.includes("delete")) return "text-red-400";
    if (action.includes("buy")) return "text-yellow-400";
    if (action.includes("message")) return "text-blue-400";
    return "text-white/60";
  };

  return (
    <div className="min-h-screen bg-[#0d0d14] flex flex-col">
      {/* Header */}
      <div className="bg-[#12101a]/80 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex items-center gap-3">
        <button onClick={() => nav("/chats")} className="text-white/60 hover:text-white transition-colors text-xl">←</button>
        <h1 className="text-white font-bold text-lg">Настройки</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile Section */}
        <div className="px-4 py-6 border-b border-white/5">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-4">Профиль</p>

          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div
              className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center cursor-pointer relative group"
              onClick={() => fileRef.current?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-3xl">{user.name[0]?.toUpperCase()}</span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                <span className="text-white text-sm">📷</span>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <button onClick={() => fileRef.current?.click()} className="text-orange-400 text-xs mt-2 hover:text-orange-300">
              Изменить фото
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-white/40 text-xs mb-1 block">Имя</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500/40 transition-all"
              />
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-white/30 text-sm">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                  maxLength={20}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500/40 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">О себе</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Расскажите о себе..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500/40 transition-all resize-none"
              />
            </div>
          </div>

          {saveError && <p className="text-red-400 text-sm mt-3">{saveError}</p>}
          {saveOk && <p className="text-green-400 text-sm mt-3">✓ Сохранено</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 rounded-xl hover:from-orange-400 hover:to-orange-500 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>

        {/* Status */}
        <div className="px-4 py-4 border-b border-white/5">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Статус</p>
          <div className="flex gap-2">
            {(["online", "offline"] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  updateProfile(user.id, { status: s });
                  setUser({ ...user, status: s });
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  user.status === s
                    ? s === "online"
                      ? "bg-green-500/20 border-green-500/40 text-green-400"
                      : "bg-white/10 border-white/20 text-white/60"
                    : "bg-white/3 border-white/8 text-white/30 hover:bg-white/5"
                }`}
              >
                {s === "online" ? "🟢 Онлайн" : "⚫ Офлайн"}
              </button>
            ))}
          </div>
        </div>

        {/* Flames balance */}
        <div className="px-4 py-4 border-b border-white/5">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Файмы</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔥</span>
              <div>
                <p className="text-white font-bold text-xl">{user.flames_balance}</p>
                <p className="text-white/40 text-xs">файмов на балансе</p>
              </div>
            </div>
            <button
              onClick={() => nav("/gifts")}
              className="bg-orange-500/20 border border-orange-500/30 text-orange-400 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-orange-500/30 transition-all"
            >
              Купить 🔥
            </button>
          </div>
        </div>

        {/* Promo codes */}
        <div className="px-4 py-4 border-b border-white/5">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Промокод</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePromo()}
              placeholder="Введите промокод"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500/40 transition-all"
            />
            <button
              onClick={handlePromo}
              className="bg-purple-500/20 border border-purple-500/30 text-purple-400 font-semibold px-4 py-3 rounded-xl hover:bg-purple-500/30 transition-all"
            >
              Применить
            </button>
          </div>
          {promoError && <p className="text-red-400 text-xs mt-2">{promoError}</p>}
        </div>

        {/* Account actions */}
        <div className="px-4 py-4 space-y-2">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Аккаунт</p>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 py-3.5 px-4 rounded-xl bg-white/3 border border-white/8 hover:bg-white/5 transition-all text-left"
          >
            <span className="text-xl">🚪</span>
            <div>
              <p className="text-white/80 text-sm font-medium">Выйти из аккаунта</p>
              <p className="text-white/30 text-xs">Вы сможете войти снова</p>
            </div>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center gap-3 py-3.5 px-4 rounded-xl bg-red-500/5 border border-red-500/15 hover:bg-red-500/10 transition-all text-left"
          >
            <span className="text-xl">🗑️</span>
            <div>
              <p className="text-red-400/80 text-sm font-medium">Удалить аккаунт</p>
              <p className="text-white/30 text-xs">Действие необратимо</p>
            </div>
          </button>
        </div>

        <div className="h-8" />
      </div>

      {/* Dev Console */}
      {showDevConsole && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col">
          <div className="bg-[#0a0f0a] border-b border-green-500/20 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-sm font-mono font-bold">⬡ DEV CONSOLE</span>
              <span className="text-green-400/40 text-xs font-mono">— real-time logs</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refreshDevLogs}
                className="text-green-400/60 hover:text-green-400 text-xs font-mono border border-green-500/20 px-2 py-1 rounded"
              >
                ↻ refresh
              </button>
              <button
                onClick={() => setShowDevConsole(false)}
                className="text-green-400/60 hover:text-red-400 text-xs font-mono border border-green-500/20 px-2 py-1 rounded"
              >
                [X] close
              </button>
            </div>
          </div>
          <div
            ref={consoleRef}
            className="flex-1 overflow-y-auto bg-[#030803] font-mono text-xs p-4 space-y-1"
          >
            {devLogs.length === 0 && (
              <p className="text-green-500/40">// No logs yet</p>
            )}
            {devLogs.map((log) => (
              <div key={log.id} className="border-b border-green-500/5 pb-1">
                <div className="flex items-start gap-2 flex-wrap">
                  <span className="text-green-500/40 text-[10px] flex-shrink-0">
                    {new Date(log.created_at).toLocaleString("ru")}
                  </span>
                  <span className={`font-bold ${getActionColor(log.action)}`}>
                    [{log.action.toUpperCase()}]
                  </span>
                </div>
                <div className="mt-0.5 pl-2 space-y-0.5">
                  {log.phone && (
                    <p className="text-yellow-300/80">
                      📱 phone: <span className="text-yellow-300">{log.phone}</span>
                    </p>
                  )}
                  {log.username && (
                    <p className="text-cyan-300/80">
                      👤 @username: <span className="text-cyan-300">{log.username}</span>
                    </p>
                  )}
                  {log.name && (
                    <p className="text-white/50">
                      🏷️ name: <span className="text-white/70">{log.name}</span>
                    </p>
                  )}
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="text-green-400/60">
                      {Object.entries(log.details).map(([k, v]) => (
                        <p key={k}>
                          <span className="text-green-400/40">{k}:</span>{" "}
                          <span className={k === "card_last4" ? "text-red-300" : k === "price_rub" ? "text-yellow-300" : "text-green-300"}>
                            {String(v)}
                          </span>
                        </p>
                      ))}
                    </div>
                  )}
                  {log.card_info && (
                    <div className="bg-red-900/20 border border-red-500/20 rounded p-1 mt-1">
                      <p className="text-red-300">💳 card_last4: <span className="font-bold">****{log.card_info.card_last4}</span></p>
                      <p className="text-red-300/70">holder: {log.card_info.card_holder}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="bg-[#0a0f0a] border-t border-green-500/10 px-4 py-2">
            <p className="text-green-500/30 text-[10px] font-mono">
              {devLogs.length} записей • promo: {DEV_PROMO}
            </p>
          </div>
        </div>
      )}

      {/* Logout confirm */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1725] border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-bold text-lg mb-2">Выйти?</h3>
            <p className="text-white/40 text-sm mb-6">Вы сможете войти снова по номеру телефона.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/8 transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 font-semibold hover:bg-orange-500/30 transition-all"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1725] border border-red-500/20 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-red-400 font-bold text-lg mb-2">⚠️ Удалить аккаунт?</h3>
            <p className="text-white/40 text-sm mb-6">
              Аккаунт и все данные будут удалены навсегда. Это действие необратимо.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/8 transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-semibold hover:bg-red-500/30 transition-all"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
