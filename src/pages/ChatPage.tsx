import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getCurrentUser,
  getChat,
  sendMessage,
  markMessagesRead,
  type Message,
  type User,
  type Chat,
} from "@/lib/store";

export default function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const nav = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [text, setText] = useState("");
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftCount, setGiftCount] = useState(1);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadChat = useCallback(() => {
    const u = getCurrentUser();
    if (!u) { nav("/"); return; }
    setCurrentUser(u);
    if (chatId) {
      const c = getChat(chatId);
      if (!c) { nav("/chats"); return; }
      setChat({ ...c });
      markMessagesRead(chatId, u.id);
    }
  }, [chatId, nav]);

  useEffect(() => {
    loadChat();
    const interval = setInterval(loadChat, 1000);
    return () => clearInterval(interval);
  }, [loadChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages.length]);

  const handleSend = () => {
    if (!text.trim() || !currentUser || !chatId) return;
    setError("");
    try {
      sendMessage(chatId, currentUser.id, text.trim());
      setText("");
      inputRef.current?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    }
  };

  const handleSendGift = () => {
    if (!currentUser || !chatId) return;
    setError("");
    try {
      sendMessage(chatId, currentUser.id, `Отправил ${giftCount} 🔥 файмов`, "gift", undefined, giftCount);
      setShowGiftModal(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];

      mr.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          if (currentUser && chatId) {
            sendMessage(chatId, currentUser.id, "🎤 Голосовое сообщение", "voice", dataUrl);
          }
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mr.start();
      setRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch {
      setError("Нет доступа к микрофону");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    setRecordingTime(0);
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
  };

  const formatRecordingTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const peer = chat?.peer;

  return (
    <div className="min-h-screen bg-[#0d0d14] flex flex-col">
      {/* Header */}
      <div className="bg-[#12101a]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => nav("/chats")}
          className="text-white/60 hover:text-white transition-colors mr-1"
        >
          ←
        </button>
        {peer && (
          <>
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center">
                {peer.avatar_url ? (
                  <img src={peer.avatar_url} alt={peer.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold">{peer.name[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#12101a] ${peer.status === "online" ? "bg-green-400" : "bg-white/20"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{peer.name}</p>
              <p className="text-xs truncate">
                {peer.status === "online"
                  ? <span className="text-green-400">онлайн</span>
                  : <span className="text-white/30">был(а) {new Date(peer.last_seen).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}</span>
                }
              </p>
            </div>
            <button
              onClick={() => setShowGiftModal(true)}
              className="text-orange-400 hover:text-orange-300 text-xl transition-colors"
              title="Отправить файмы"
            >
              🔥
            </button>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {chat?.messages.length === 0 && (
          <div className="text-center py-10 text-white/30 text-sm">
            Начните переписку 👋
          </div>
        )}
        {chat?.messages.map((msg) => {
          const isMe = msg.sender_id === currentUser?.id;
          return <MessageBubble key={msg.id} msg={msg} isMe={isMe} formatTime={formatTime} />;
        })}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="px-4 pb-2">
          <p className="text-red-400 text-xs text-center">{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="bg-[#12101a]/90 backdrop-blur-xl border-t border-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          {recording ? (
            <div className="flex-1 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <span className="text-red-400 animate-pulse">●</span>
              <span className="text-white/60 text-sm">Запись {formatRecordingTime(recordingTime)}</span>
            </div>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Сообщение..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-500/40 transition-all"
            />
          )}

          {/* Voice record button */}
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${recording ? "bg-red-500 scale-110" : "bg-white/8 border border-white/10 hover:bg-white/12"}`}
            title="Удержите для записи голосового"
          >
            🎤
          </button>

          {/* Send button */}
          {text.trim() && !recording && (
            <button
              onClick={handleSend}
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25 hover:from-orange-400 hover:to-orange-500 transition-all active:scale-95"
            >
              <span className="text-white">↑</span>
            </button>
          )}
        </div>
      </div>

      {/* Gift Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end z-50" onClick={() => setShowGiftModal(false)}>
          <div
            className="w-full bg-[#1a1725] border border-white/10 rounded-t-3xl p-6 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
            <h3 className="text-white font-bold text-lg mb-1 text-center">Отправить файмы 🔥</h3>
            <p className="text-white/40 text-sm text-center mb-6">
              Баланс: <span className="text-orange-400 font-semibold">{currentUser?.flames_balance} 🔥</span>
            </p>

            <div className="flex items-center justify-center gap-6 mb-6">
              <button
                onClick={() => setGiftCount(Math.max(1, giftCount - 1))}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/10 text-white text-xl flex items-center justify-center hover:bg-white/15"
              >
                −
              </button>
              <div className="text-center">
                <div className="text-5xl font-bold text-white">{giftCount}</div>
                <div className="text-orange-400 text-sm mt-1">🔥 файмов</div>
              </div>
              <button
                onClick={() => setGiftCount(giftCount + 1)}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/10 text-white text-xl flex items-center justify-center hover:bg-white/15"
              >
                +
              </button>
            </div>

            {(currentUser?.flames_balance || 0) < giftCount && (
              <p className="text-red-400 text-sm text-center mb-4">Недостаточно файмов. <button onClick={() => { setShowGiftModal(false); nav("/gifts"); }} className="text-orange-400 underline">Купить</button></p>
            )}

            <div className="grid grid-cols-4 gap-2 mb-6">
              {[1, 5, 10, 25].map((n) => (
                <button
                  key={n}
                  onClick={() => setGiftCount(n)}
                  className={`py-2 rounded-xl text-sm font-semibold transition-all ${giftCount === n ? "bg-orange-500 text-white" : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"}`}
                >
                  {n} 🔥
                </button>
              ))}
            </div>

            <button
              onClick={handleSendGift}
              disabled={(currentUser?.flames_balance || 0) < giftCount}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3.5 rounded-xl hover:from-orange-400 hover:to-red-400 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25"
            >
              Отправить {giftCount} 🔥 файмов
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg, isMe, formatTime }: { msg: Message; isMe: boolean; formatTime: (s: string) => string }) {
  const [audioUrl] = useState(msg.audio_url);

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
          isMe
            ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-br-sm"
            : "bg-white/8 border border-white/10 text-white rounded-bl-sm"
        }`}
      >
        {msg.type === "voice" && audioUrl && (
          <div className="flex items-center gap-2">
            <span>🎤</span>
            <audio src={audioUrl} controls className="h-8 w-40 opacity-80" />
          </div>
        )}
        {msg.type === "gift" && (
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="font-semibold text-sm">{msg.gift_count} файмов</p>
              <p className="text-xs opacity-70">Подарок</p>
            </div>
          </div>
        )}
        {msg.type === "text" && (
          <p className="text-sm leading-relaxed">{msg.content}</p>
        )}
        <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
          <span className={`text-xs ${isMe ? "text-white/60" : "text-white/30"}`}>{formatTime(msg.created_at)}</span>
          {isMe && (
            <span className={`text-xs ${msg.is_read ? "text-blue-300" : "text-white/40"}`}>
              {msg.is_read ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
