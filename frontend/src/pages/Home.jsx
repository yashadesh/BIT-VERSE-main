import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, LOGO_URL } from "@/lib/api";
import TrendingChart from "@/components/TrendingChart";
import {
  BookOpen, FileText, ScrollText, Youtube, ArrowRight, Sparkles,
  BookMarked, GraduationCap, Zap, Rocket,
} from "lucide-react";

function AnimatedCounter({ target, suffix = "+", label, testid }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let start = 0;
    const dur = 1600;
    const t0 = performance.now();
    let raf;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.floor(start + (target - start) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return (
    <div className="card-glass p-6 md:p-8 text-center animate-fade-up" data-testid={testid}>
      <div className="font-display text-4xl md:text-5xl font-bold neon-text tabular-nums">
        {n.toLocaleString()}{suffix}
      </div>
      <div className="mt-2 text-xs md:text-sm tracking-[0.2em] uppercase font-mono text-white/60">
        {label}
      </div>
    </div>
  );
}

const quickCards = [
  { to: "/notes", title: "Notes", desc: "Semester-wise structured notes for every subject.", Icon: BookOpen, test: "quick-notes" },
  { to: "/pyqs", title: "PYQs", desc: "Previous year mid-sems, end-sems and solutions.", Icon: FileText, test: "quick-pyqs" },
  { to: "/syllabus", title: "Syllabus", desc: "Complete first-year curriculum & credit sheet.", Icon: ScrollText, test: "quick-syllabus" },
  { to: "/resources", title: "Books", desc: "Subject-wise reference books & study material.", Icon: BookMarked, test: "quick-resources" },
];

export default function Home() {
  const [stats, setStats] = useState({ files: 0, subjects: 20, modules: 100, semesters: 2 });
  useEffect(() => {
    api.get("/stats").then(({ data }) => {
      setStats((s) => ({
        ...s,
        files: data.notes + data.pyqs || 0,
        subjects: data.subjects || 20,
        modules: 100,
        semesters: 2,
      }));
    }).catch(() => {});
  }, []);

  return (
    <div className="page-enter">
      {/* HERO */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-6 pt-24 md:pt-32" data-testid="hero-section">
        <div className="chip mb-8 animate-fade-up">
          <Sparkles className="w-3 h-3" /> Exclusively for First Year BITians
        </div>

        <div className="relative animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="absolute inset-0 blur-3xl bg-[#00E5D4]/30 rounded-full scale-125" />
          <span className="logo-frame relative" style={{ padding: "10px", borderRadius: "24px" }}>
            <img
              src={LOGO_URL}
              alt="BITVERSE — Student Notes Library"
              className="w-48 h-48 md:w-64 md:h-64 object-contain block animate-pulse-glow"
              data-testid="hero-logo"
            />
          </span>
        </div>

        <h1
          className="mt-8 font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-center animate-fade-up"
          style={{ animationDelay: "0.2s" }}
          data-testid="hero-title"
        >
          BIT<span className="text-[#00E5D4]">VERSE</span>
        </h1>

        <p
          className="mt-5 text-lg md:text-2xl text-white/85 font-display tracking-wide text-center animate-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          The Digital Universe of <span className="text-[#00E5D4]">BIT Mesra</span>
        </p>

        <p
          className="mt-3 text-sm md:text-base text-[#B0B8C5] max-w-2xl text-center animate-fade-up"
          style={{ animationDelay: "0.4s" }}
        >
          Notes · PYQs · Syllabus · Resources — everything a First Year BITian needs, in one beautiful place.
        </p>

        <div
          className="mt-10 flex flex-col sm:flex-row gap-4 animate-fade-up"
          style={{ animationDelay: "0.5s" }}
        >
          <Link to="/notes" className="btn-neon primary" data-testid="explore-notes-button">
            <Rocket className="w-4 h-4" /> Explore Notes
          </Link>
          <Link to="/pyqs" className="btn-neon" data-testid="pyqs-button">
            <BookMarked className="w-4 h-4" /> Previous Year Questions
          </Link>
        </div>
      </section>

      {/* STATS */}
      <section className="relative px-6 py-16 md:py-24" data-testid="stats-section">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <AnimatedCounter target={stats.subjects} suffix="" label="Subjects" testid="stats-counter-subjects" />
            <AnimatedCounter target={stats.modules} suffix="+" label="Modules" testid="stats-counter-modules" />
            <AnimatedCounter target={stats.semesters} suffix="" label="Semesters" testid="stats-counter-semesters" />
            <AnimatedCounter target={stats.files} suffix="" label="Files Live" testid="stats-counter-files" />
          </div>
        </div>
      </section>

      {/* QUICK ACCESS */}
      <section className="relative px-6 py-16 md:py-24" data-testid="quick-access-section">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <div className="chip mb-3"><Zap className="w-3 h-3" /> Quick Access</div>
              <h2 className="section-title text-3xl md:text-5xl font-bold">
                Jump into your <span className="text-[#00E5D4]">library</span>
              </h2>
            </div>
            <p className="text-[#B0B8C5] text-sm md:text-base max-w-md">
              Every section is one tap away. Beautifully organized, always up to date.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {quickCards.map(({ to, title, desc, Icon, test }, i) => (
              <Link
                key={to}
                to={to}
                data-testid={test}
                className="card-glass p-7 group animate-fade-up shine"
                style={{ animationDelay: `${0.1 * i}s` }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#00E5D4]/10 border border-[#00E5D4]/30 mb-5 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-[#00E5D4]" />
                </div>
                <h3 className="font-display text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-[#B0B8C5] leading-relaxed">{desc}</p>
                <div className="mt-5 flex items-center gap-2 text-[#00E5D4] text-xs font-mono uppercase tracking-widest">
                  Enter <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE TRENDING CHART */}
      <TrendingChart />

      {/* HIGHLIGHT STRIP */}
      <section className="relative px-6 py-16" data-testid="highlight-strip">
        <div className="mx-auto max-w-6xl card-glass p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <div className="chip mb-3"><GraduationCap className="w-3 h-3" /> Built by students</div>
            <h3 className="section-title text-2xl md:text-3xl font-semibold">
              A modern SaaS-grade library — designed for BITians.
            </h3>
            <p className="mt-3 text-[#B0B8C5] text-sm md:text-base max-w-2xl">
              Semester → Subject → Module → Files. In-browser previews for PDF, PPT, DOC and
              images. No login. No noise. Just the material you need to crush your semester.
            </p>
          </div>
          <Link to="/notes" className="btn-neon primary" data-testid="highlight-cta">
            Browse the library <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
