import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, buyFlames, updateProfile, type User } from "@/lib/store";

const PACKAGES = [
  { id: "p10", name: "Стартовый", flames: 10, price: 59, emoji: "🔥", popular: false },
  { id: "p20", name: "Популярный", flames: 20, price: 100, emoji: "🔥🔥", popular: true },
  { id: "p30", name: "Продвинутый", flames: 30, price: 200, emoji: "🔥🔥🔥", popular: false },
  { id: "p40", name: "Максимальный", flames: 40, price: 300, emoji: "🔥🔥🔥🔥", popular: false },
];

type PayStep = "select" | "card" | "success";

export default function GiftsPage() {
  const nav = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
  const [selectedPkg, setSelectedPkg] = useState<(typeof PACKAGES)[0] | null>(null);
  const [payStep, setPayStep] = useState<PayStep>("select");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  const handleBuy = () => {
    setError("");
    const cleanCard = cardNumber.replace(/\s/g, "");
    if (cleanCard.length !== 16) { setError("Введите корректный номер карты (16 цифр)"); return; }
    if (!cardHolder.trim()) { setError("Введите имя держателя карты"); return; }
    if (expiry.length !== 5) { setError("Введите корректный срок (ММ/ГГ)"); return; }
    if (cvv.length !== 3) { setError("Введите CVV (3 цифры)"); return; }
    if (!selectedPkg || !currentUser) return;

    setLoading(true);
    setTimeout(() => {
      try {
        const result = buyFlames({
          userId: currentUser.id,
          packageName: selectedPkg.name,
          flamesCount: selectedPkg.flames,
          priceRub: selectedPkg.price,
          cardLast4: cleanCard.slice(-4),
          cardHolder: cardHolder.trim().toUpperCase(),
        });
        // Update local user state
        const updated = updateProfile(currentUser.id, {});
        if (updated.user) setCurrentUser(updated.user);
        else {
          // manual update
          setCurrentUser({ ...currentUser, flames_balance: result.newBalance });
        }
        setPayStep("success");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка оплаты");
      }
      setLoading(false);
    }, 1500);
  };

  const handleBack = () => {
    if (payStep === "card") { setPayStep("select"); setError(""); }
    else nav(-1);
  };

  return (
    <div className="min-h-screen bg-[#0d0d14] flex flex-col">
      {/* Header */}
      <div className="bg-[#12101a]/80 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex items-center gap-3">
        <button onClick={handleBack} className="text-white/60 hover:text-white transition-colors text-xl">←</button>
        <div>
          <h1 className="text-white font-bold text-lg">Магазин файмов 🔥</h1>
          <p className="text-white/40 text-xs">Баланс: {currentUser?.flames_balance || 0} файмов</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">

        {/* ── SELECT PACKAGE ── */}
        {payStep === "select" && (
          <>
            <div className="text-center mb-8">
              <div className="text-5xl mb-2">🔥</div>
              <h2 className="text-white font-bold text-xl mb-1">Файмы — подарки для друзей</h2>
              <p className="text-white/40 text-sm">Покупайте и отправляйте файмы в чатах</p>
            </div>

            <div className="space-y-3">
              {PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => { setSelectedPkg(pkg); setPayStep("card"); }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    pkg.popular
                      ? "bg-gradient-to-r from-orange-500/20 to-red-500/10 border-orange-500/40 shadow-lg shadow-orange-500/10"
                      : "bg-white/5 border-white/10 hover:bg-white/8"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${pkg.popular ? "bg-orange-500/20" : "bg-white/5"}`}>
                      {pkg.emoji}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{pkg.name}</span>
                        {pkg.popular && (
                          <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold">ХИТ</span>
                        )}
                      </div>
                      <span className="text-white/60 text-sm">{pkg.flames} файмов 🔥</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-lg">{pkg.price} ₽</div>
                    <div className="text-white/30 text-xs">{(pkg.price / pkg.flames).toFixed(1)} ₽/шт</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 bg-white/3 border border-white/8 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span>🏦</span>
                <span className="text-white/60 text-sm font-semibold">Способы оплаты</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-[#1B3D96] text-white text-xs font-bold px-3 py-1.5 rounded-lg">МИР</div>
                <span className="text-white/30 text-xs">Карта Мир</span>
              </div>
            </div>
          </>
        )}

        {/* ── PAYMENT FORM ── */}
        {payStep === "card" && selectedPkg && (
          <>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 flex items-center justify-between">
              <div>
                <p className="text-white/50 text-xs mb-1">Выбранный пакет</p>
                <p className="text-white font-semibold">{selectedPkg.name} — {selectedPkg.flames} 🔥</p>
              </div>
              <div className="text-white font-bold text-xl">{selectedPkg.price} ₽</div>
            </div>

            {/* Mir Card Visual */}
            <div className="relative w-full aspect-[1.6] max-w-sm mx-auto mb-6 rounded-2xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1B3D96] via-[#2E5AC8] to-[#0D2B7A]" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMwLTkuOTQtOC4wNi0xOC0xOC0xOHYxOGgxOHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L2c+PC9zdmc+')] opacity-30" />
              <div className="relative p-5 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="bg-white text-[#1B3D96] font-black text-lg px-3 py-1 rounded-lg tracking-widest">МИР</div>
                  <div className="w-8 h-8 rounded-full bg-white/20" />
                </div>
                <div>
                  <p className="text-white/50 text-xs mb-1 font-mono tracking-widest">НОМЕР КАРТЫ</p>
                  <p className="text-white font-mono text-lg tracking-[0.3em]">
                    {cardNumber || "•••• •••• •••• ••••"}
                  </p>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-white/50 text-xs mb-0.5">ДЕРЖАТЕЛЬ</p>
                    <p className="text-white font-mono text-sm tracking-wider">{cardHolder.toUpperCase() || "IVAN IVANOV"}</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-xs mb-0.5">СРОК</p>
                    <p className="text-white font-mono text-sm">{expiry || "MM/YY"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Номер карты</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-blue-500/40 transition-all"
                />
              </div>
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Держатель карты</label>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value.toUpperCase().replace(/[^A-Z ]/g, ""))}
                  placeholder="IVAN IVANOV"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono uppercase placeholder:text-white/20 focus:outline-none focus:border-blue-500/40 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Срок</label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    placeholder="ММ/ГГ"
                    maxLength={5}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-blue-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">CVV</label>
                  <input
                    type="password"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    placeholder="•••"
                    maxLength={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-blue-500/40 transition-all"
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <button
              onClick={handleBuy}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#1B3D96] to-[#2E5AC8] text-white font-bold py-4 rounded-xl hover:from-[#2349B2] hover:to-[#3A6ADA] transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Обрабатываем...
                </>
              ) : (
                <>
                  <div className="bg-white text-[#1B3D96] font-black text-xs px-2 py-0.5 rounded">МИР</div>
                  Оплатить {selectedPkg.price} ₽
                </>
              )}
            </button>

            <p className="text-white/20 text-xs text-center mt-3">
              🔒 Платёж защищён. Данные карты не передаются третьим лицам.
            </p>
          </>
        )}

        {/* ── SUCCESS ── */}
        {payStep === "success" && selectedPkg && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-7xl mb-4">🎉</div>
            <h2 className="text-white font-bold text-2xl mb-2">Успешно оплачено!</h2>
            <p className="text-white/50 mb-4">
              +{selectedPkg.flames} файмов добавлено на ваш счёт
            </p>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl px-8 py-4 mb-8">
              <p className="text-orange-400 text-4xl font-bold">{currentUser?.flames_balance} 🔥</p>
              <p className="text-white/40 text-sm mt-1">текущий баланс</p>
            </div>
            <button
              onClick={() => nav("/chats")}
              className="w-full max-w-xs bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3.5 rounded-xl hover:from-orange-400 hover:to-orange-500 transition-all active:scale-95"
            >
              В чаты
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
