import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

const features = [
  {
    icon: "Zap",
    title: "Молниеносная скорость",
    desc: "Сайт с нуля за 30 секунд. ИИ понимает вас с полуслова и строит страницы в реальном времени.",
  },
  {
    icon: "Brush",
    title: "Уникальный дизайн",
    desc: "Каждый проект получает свой стиль. Никаких шаблонов — только живое, авторское оформление.",
  },
  {
    icon: "Code2",
    title: "Чистый код",
    desc: "Под капотом — React и TypeScript. Вы получаете полный доступ к коду и можете развивать его сами.",
  },
  {
    icon: "RefreshCw",
    title: "Бесконечные итерации",
    desc: "Нажмите кнопку — и правки готовы. Меняйте цвета, тексты, структуру в любой момент.",
  },
  {
    icon: "Globe",
    title: "Публикация в один клик",
    desc: "Ваш сайт мгновенно оказывается в сети на красивом домене. Хостинг включён.",
  },
  {
    icon: "ShieldCheck",
    title: "Без ограничений",
    desc: "Скачайте исходники когда угодно. Ваш код — ваша собственность навсегда.",
  },
];

const testimonials = [
  {
    name: "Арина К.",
    role: "Фотограф",
    text: "Запустила портфолио за 20 минут. Раньше это занимало недели и стоило огромных денег.",
    avatar: "🎨",
  },
  {
    name: "Дмитрий Л.",
    role: "Предприниматель",
    text: "Лендинг для нового продукта — один запрос, пять правок, и уже продаём. Невероятно.",
    avatar: "🚀",
  },
  {
    name: "Маша Г.",
    role: "Дизайнер",
    text: "Я скептически относилась к ИИ-инструментам, но дизайн получился лучше, чем я ожидала.",
    avatar: "✨",
  },
];

const steps = [
  { num: "01", title: "Опишите идею", desc: "Расскажите, что вам нужно — в свободной форме, как другу." },
  { num: "02", title: "ИИ строит сайт", desc: "Через секунды вы видите живую страницу, готовую к правкам." },
  { num: "03", title: "Доработайте детали", desc: "Уточняйте, дополняйте, меняйте — пока всё не будет идеально." },
  { num: "04", title: "Запустите проект", desc: "Публикуйте сайт в сеть одним нажатием. Всё готово." },
];

export default function Index() {
  const [visible, setVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Intersection observer for scroll reveals
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("animate-fade-in");
            e.target.classList.remove("opacity-0-init");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0c0a08] font-golos overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          <span className="font-golos font-bold text-xl text-white tracking-tight">поехали</span>
          <span className="text-[10px] font-golos font-semibold text-[#FB923C] bg-[#FB923C]/10 border border-[#FB923C]/20 px-2 py-0.5 rounded-full ml-1 uppercase tracking-widest">beta</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/50 font-golos">
          <a href="#how" className="hover:text-white/90 transition-colors">Как это работает</a>
          <a href="#features" className="hover:text-white/90 transition-colors">Возможности</a>
          <a href="#reviews" className="hover:text-white/90 transition-colors">Отзывы</a>
        </div>
        <button className="text-sm font-golos font-semibold bg-[#FB923C] text-[#0c0a08] px-5 py-2.5 rounded-full hover:bg-[#f97316] transition-all hover:scale-105 active:scale-95">
          Попробовать
        </button>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-32 md:pt-24 md:pb-40">
        {/* Ambient glow */}
        <div className="hero-glow top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 absolute" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#FB923C]/5 blur-[80px] pointer-events-none" />

        {/* Badge */}
        <div
          className={`inline-flex items-center gap-2 border border-[#FB923C]/25 bg-[#FB923C]/8 rounded-full px-4 py-2 text-sm text-[#FB923C] font-golos font-medium mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <span className="w-2 h-2 rounded-full bg-[#FB923C] animate-pulse" />
          Новое поколение веб-разработки
        </div>

        {/* Headline */}
        <h1
          className={`font-golos font-black text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight text-white max-w-4xl mb-6 transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          Ваш сайт —<br />
          <span className="text-shimmer">за минуту</span>
        </h1>

        {/* Sub */}
        <p
          className={`font-cormorant italic text-xl md:text-2xl text-white/50 max-w-xl mb-12 leading-relaxed transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          Просто опишите идею — ИИ построит красивый, живой сайт быстрее, чем вы допьёте кофе.
        </p>

        {/* CTA */}
        <div
          className={`flex flex-col sm:flex-row items-center gap-4 transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <button className="group relative overflow-hidden bg-[#FB923C] text-[#0c0a08] font-golos font-bold text-lg px-10 py-4 rounded-full animate-glow-pulse hover:bg-[#f97316] transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(251,146,60,0.35)]">
            <span className="relative z-10 flex items-center gap-2">
              Создать сайт бесплатно
              <Icon name="ArrowRight" size={20} />
            </span>
          </button>
          <button className="flex items-center gap-2 text-white/60 font-golos text-sm hover:text-white/90 transition-colors group">
            <span className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-colors">
              <Icon name="Play" size={16} className="ml-0.5" />
            </span>
            Смотреть демо
          </button>
        </div>

        {/* Stats */}
        <div
          className={`mt-20 flex flex-col sm:flex-row items-center gap-8 sm:gap-16 transition-all duration-700 delay-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          {[
            { val: "2 000+", label: "проектов запущено" },
            { val: "30 сек", label: "среднее время генерации" },
            { val: "98%", label: "довольных клиентов" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-golos font-black text-3xl text-white">{s.val}</div>
              <div className="text-white/40 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="divider-amber mx-6 md:mx-24" />

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="relative z-10 py-28 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="reveal opacity-0-init text-center mb-20">
          <span className="text-[#FB923C] font-golos text-sm font-semibold uppercase tracking-[0.2em]">Как это работает</span>
          <h2 className="font-golos font-black text-4xl md:text-5xl text-white mt-4 leading-tight">
            Четыре шага<br />
            <span className="font-cormorant italic font-normal text-white/60">от идеи до запуска</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className="reveal opacity-0-init card-glass rounded-2xl p-7 relative overflow-hidden"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="absolute -top-4 -right-4 font-golos font-black text-7xl text-white/[0.03] select-none">
                {step.num}
              </div>
              <div className="text-[#FB923C] font-golos font-black text-4xl mb-4">{step.num}</div>
              <h3 className="font-golos font-bold text-white text-lg mb-2">{step.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="divider-amber mx-6 md:mx-24" />

      {/* ── FEATURES ── */}
      <section id="features" className="relative z-10 py-28 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="reveal opacity-0-init text-center mb-20">
          <span className="text-[#FB923C] font-golos text-sm font-semibold uppercase tracking-[0.2em]">Возможности</span>
          <h2 className="font-golos font-black text-4xl md:text-5xl text-white mt-4 leading-tight">
            Всё, что нужно<br />
            <span className="font-cormorant italic font-normal text-white/60">для идеального сайта</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="reveal opacity-0-init card-glass rounded-2xl p-7 flex flex-col gap-4"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="w-11 h-11 rounded-xl bg-[#FB923C]/10 border border-[#FB923C]/20 flex items-center justify-center text-[#FB923C]">
                <Icon name={f.icon} fallback="Star" size={22} />
              </div>
              <div>
                <h3 className="font-golos font-bold text-white text-base mb-1.5">{f.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="divider-amber mx-6 md:mx-24" />

      {/* ── TESTIMONIALS ── */}
      <section id="reviews" className="relative z-10 py-28 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="reveal opacity-0-init text-center mb-20">
          <span className="text-[#FB923C] font-golos text-sm font-semibold uppercase tracking-[0.2em]">Отзывы</span>
          <h2 className="font-golos font-black text-4xl md:text-5xl text-white mt-4 leading-tight">
            Они уже запустились<br />
            <span className="font-cormorant italic font-normal text-white/60">и рады, что попробовали</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className="reveal opacity-0-init card-glass rounded-2xl p-7 flex flex-col gap-5"
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <span key={j} className="text-[#FB923C] text-base">★</span>
                ))}
              </div>
              <p className="font-cormorant italic text-lg text-white/80 leading-relaxed flex-1">
                «{t.text}»
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                <div className="w-10 h-10 rounded-full bg-[#FB923C]/10 border border-[#FB923C]/15 flex items-center justify-center text-xl">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-golos font-semibold text-white text-sm">{t.name}</div>
                  <div className="text-white/35 text-xs">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BOTTOM ── */}
      <section className="relative z-10 py-32 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[800px] h-[400px] rounded-full bg-[#FB923C]/8 blur-[100px]" />
        </div>

        <div className="reveal opacity-0-init relative z-10 max-w-3xl mx-auto">
          <h2 className="font-golos font-black text-5xl md:text-6xl lg:text-7xl text-white leading-[0.95] mb-6">
            Готовы запустить<br />
            <span className="text-shimmer">свой проект?</span>
          </h2>
          <p className="font-cormorant italic text-xl text-white/50 mb-12">
            Бесплатно. Без карты. Без ожидания.
          </p>
          <button className="group bg-[#FB923C] text-[#0c0a08] font-golos font-bold text-xl px-14 py-5 rounded-full hover:bg-[#f97316] transition-all hover:scale-105 active:scale-95 shadow-[0_0_60px_rgba(251,146,60,0.4)] inline-flex items-center gap-3">
            Начать прямо сейчас
            <Icon name="ArrowRight" size={22} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="mt-10 flex flex-wrap justify-center gap-6 text-white/30 text-sm font-golos">
            <span className="flex items-center gap-1.5"><Icon name="Check" size={14} className="text-[#FB923C]" /> Бесплатный тариф</span>
            <span className="flex items-center gap-1.5"><Icon name="Check" size={14} className="text-[#FB923C]" /> Публикация одним кликом</span>
            <span className="flex items-center gap-1.5"><Icon name="Check" size={14} className="text-[#FB923C]" /> Скачать исходный код</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/5 py-10 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚀</span>
            <span className="font-golos font-bold text-white/80">поехали</span>
          </div>
          <p className="text-white/25 text-sm font-golos text-center">
            © 2025 Поехали. Сделано с ☕ и ИИ.
          </p>
          <div className="flex items-center gap-6 text-white/30 text-sm">
            <a href="#" className="hover:text-white/60 transition-colors">Политика</a>
            <a href="#" className="hover:text-white/60 transition-colors">Условия</a>
            <a href="#" className="hover:text-white/60 transition-colors">Контакты</a>
          </div>
        </div>
      </footer>
    </div>
  );
}