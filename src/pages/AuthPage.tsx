import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  checkPhone,
  register,
  login,
  setCurrentUser,
  countAccounts,
} from "@/lib/store";

type Step = "phone" | "setup" | "login-confirm";

export default function AuthPage() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePhoneSubmit = () => {
    setError("");
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 10) {
      setError("Введите корректный номер телефона");
      return;
    }
    const existing = checkPhone(phone);
    if (existing) {
      // Login
      setStep("login-confirm");
    } else {
      // Check if we can register more
      const count = countAccounts();
      if (count >= 2) {
        setError("В этом приложении уже зарегистрировано максимум 2 аккаунта");
        return;
      }
      setStep("setup");
    }
  };

  const handleLoginConfirm = () => {
    setError("");
    setLoading(true);
    const result = login(phone);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.user) {
      setCurrentUser(result.user);
      nav("/chats");
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setAvatarUrl(dataUrl);
      setAvatarPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSetup = () => {
    setError("");
    if (!name.trim()) { setError("Введите имя"); return; }
    if (!username.trim()) { setError("Введите username"); return; }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setError("Username: 3-20 символов, только латиница, цифры и _");
      return;
    }
    setLoading(true);
    const result = register({ phone, name: name.trim(), username: username.trim(), avatar_url: avatarUrl });
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.user) {
      setCurrentUser(result.user);
      nav("/chats");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0d14] via-[#12101a] to-[#0a0a10] flex items-center justify-center px-4">
      {/* BG Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-purple-500/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl shadow-orange-500/20 mb-4">
            <img
              src="https://cdn.poehali.dev/projects/e6503a55-64a7-4d56-b4f1-632f331398a8/files/2e9695c1-90b4-40f0-8088-6821e6193157.jpg"
              alt="FrameGram"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-white font-bold text-3xl tracking-tight">FrameGram</h1>
          <p className="text-white/40 text-sm mt-1">Мессенджер нового поколения</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">

          {/* ── PHONE STEP ── */}
          {step === "phone" && (
            <>
              <h2 className="text-white font-semibold text-lg mb-1">Войти или зарегистрироваться</h2>
              <p className="text-white/40 text-sm mb-5">Введите номер телефона</p>
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <span className="text-white/40 text-sm">📱</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePhoneSubmit()}
                  placeholder="+7 999 123-45-67"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/60 focus:bg-white/8 transition-all"
                />
              </div>
              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
              <button
                onClick={handlePhoneSubmit}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 rounded-xl hover:from-orange-400 hover:to-orange-500 transition-all active:scale-95 shadow-lg shadow-orange-500/25"
              >
                Продолжить
              </button>
              <p className="text-white/20 text-xs text-center mt-4">
                Максимум 2 аккаунта в этом приложении
              </p>
            </>
          )}

          {/* ── LOGIN CONFIRM STEP ── */}
          {step === "login-confirm" && (
            <>
              <button
                onClick={() => { setStep("phone"); setError(""); }}
                className="text-white/40 text-sm mb-4 flex items-center gap-1 hover:text-white/70 transition-colors"
              >
                ← Назад
              </button>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center mx-auto mb-3 text-3xl">
                  👤
                </div>
                <h2 className="text-white font-semibold text-lg">Добро пожаловать!</h2>
                <p className="text-white/40 text-sm mt-1">Аккаунт с номером {phone} найден</p>
              </div>
              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
              <button
                onClick={handleLoginConfirm}
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 rounded-xl hover:from-orange-400 hover:to-orange-500 transition-all active:scale-95 shadow-lg shadow-orange-500/25 disabled:opacity-50"
              >
                {loading ? "Входим..." : "Войти"}
              </button>
            </>
          )}

          {/* ── SETUP STEP ── */}
          {step === "setup" && (
            <>
              <button
                onClick={() => { setStep("phone"); setError(""); }}
                className="text-white/40 text-sm mb-4 flex items-center gap-1 hover:text-white/70 transition-colors"
              >
                ← Назад
              </button>
              <h2 className="text-white font-semibold text-lg mb-1">Создать профиль</h2>
              <p className="text-white/40 text-sm mb-5">Заполните данные для регистрации</p>

              {/* Avatar */}
              <div className="flex flex-col items-center mb-5">
                <label className="cursor-pointer group">
                  <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-dashed border-white/20 group-hover:border-orange-500/50 flex items-center justify-center overflow-hidden transition-all relative">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <div className="text-2xl">📷</div>
                        <div className="text-white/30 text-xs mt-1">Фото</div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                      <span className="text-white text-xs">Изменить</span>
                    </div>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
                <span className="text-white/30 text-xs mt-2">Нажмите чтобы добавить фото</span>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Имя *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ваше имя"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/60 transition-all"
                  />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Username *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-white/30">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                      placeholder="username"
                      maxLength={20}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/60 transition-all"
                    />
                  </div>
                  <p className="text-white/20 text-xs mt-1">3-20 символов, латиница, цифры, _</p>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

              <button
                onClick={handleSetup}
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 rounded-xl hover:from-orange-400 hover:to-orange-500 transition-all active:scale-95 shadow-lg shadow-orange-500/25 disabled:opacity-50"
              >
                {loading ? "Создаём..." : "Создать аккаунт 🔥"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
