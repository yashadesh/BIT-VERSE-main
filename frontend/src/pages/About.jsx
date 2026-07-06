import PageHeader from "@/components/PageHeader";
import { LOGO_URL, DEV_PHOTO_URL } from "@/lib/api";
import { Sparkles, Users, ShieldCheck, Zap, Linkedin, Instagram, Mail, Code2 } from "lucide-react";

const points = [
  { Icon: Zap, title: "Fast & focused", desc: "No noise. Just notes, PYQs, syllabus and resources." },
  { Icon: ShieldCheck, title: "No accounts needed", desc: "Open for every First Year BITian — instant access." },
  { Icon: Users, title: "Built by students", desc: "Curated and maintained by students of BIT Mesra." },
  { Icon: Sparkles, title: "Beautifully designed", desc: "A premium interface that feels like a modern SaaS." },
];

export default function About() {
  return (
    <div className="page-enter mx-auto max-w-6xl px-6 pt-28 md:pt-32" data-testid="about-page">
      <PageHeader
        chip="About"
        title={<>The Digital Universe of <span className="text-[#00E5D4]">BIT Mesra</span></>}
        subtitle="BITVERSE is a student-driven digital notes library designed exclusively for First Year students of Birla Institute of Technology, Mesra."
      />

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="card-glass p-8 md:p-10 flex flex-col items-start gap-6">
          <img
            src={LOGO_URL}
            alt="BITVERSE — Student Notes Library"
            className="w-40 h-40 md:w-48 md:h-48 logo-glow object-contain"
          />
          <p className="text-[#B0B8C5] leading-relaxed">
            BITVERSE provides organized notes, previous year papers, syllabi, and academic
            resources — all in one beautiful and easy-to-use platform. Semester-wise
            structure, in-browser file viewers and zero login friction. Everything a First
            Year BITian needs to breeze through their first year at Mesra.
          </p>
          <div className="chip">Notes · PYQs · Syllabus · Tutorials · YouTube</div>
        </div>
        <div className="grid gap-4">
          {points.map(({ Icon, title, desc }, i) => (
            <div key={title} className="card-glass p-6 flex items-start gap-4 animate-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="w-11 h-11 rounded-xl bg-[#00E5D4]/10 border border-[#00E5D4]/30 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-[#00E5D4]" />
              </div>
              <div>
                <div className="font-display font-semibold">{title}</div>
                <div className="text-sm text-[#B0B8C5] mt-1">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meet the Developer */}
      <section className="mt-20" data-testid="about-developer">
        <div className="text-center mb-10 animate-fade-up">
          <div className="chip mb-3 mx-auto">
            <Code2 className="w-3 h-3" /> Meet the Developer
          </div>
          <h2 className="section-title text-3xl md:text-5xl font-bold tracking-tighter">
            The mind behind <span className="text-[#00E5D4]">BITVERSE</span>
          </h2>
        </div>

        <div className="card-glass p-8 md:p-12 grid gap-10 md:grid-cols-[auto,1fr] items-center">
          <div className="relative mx-auto md:mx-0">
            <div className="absolute inset-0 bg-[#00E5D4]/35 blur-3xl rounded-full scale-110 animate-pulse-glow" />
            <img
              src={DEV_PHOTO_URL}
              alt="Adesh Yash"
              className="relative w-56 h-56 md:w-64 md:h-64 rounded-full object-cover border-4 border-[#00E5D4]/60 shadow-[0_0_50px_rgba(0,229,212,0.5)]"
              data-testid="developer-photo"
            />
            <div className="absolute -bottom-2 -right-2 chip bg-[#05070A]/90">
              <Sparkles className="w-3 h-3" /> Founder
            </div>
          </div>

          <div className="text-center md:text-left">
            <div className="text-xs font-mono tracking-[0.2em] uppercase text-[#00E5D4] mb-2">
              Founder · Content Manager · Lead Developer
            </div>
            <h3 className="font-display text-4xl md:text-5xl font-bold">
              Adesh <span className="text-[#00E5D4]">Yash</span>
            </h3>
            <p className="mt-5 text-[#B0B8C5] leading-relaxed max-w-2xl">
              Adesh built BITVERSE from the ground up — designing every pixel, writing
              every line of code, and curating the content that makes first year at BIT
              Mesra a little less overwhelming. A believer in beautiful software and open
              student communities.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
              <a
                href="https://www.linkedin.com/in/adesh-yash-624a87383/"
                target="_blank"
                rel="noreferrer"
                data-testid="about-dev-linkedin"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border border-[#0077B5]/40 bg-[#0077B5]/10 text-[#7cc4ff] hover:bg-[#0077B5]/20 hover:border-[#0077B5]/80 hover:shadow-[0_0_20px_rgba(0,119,181,0.4)] transition"
              >
                <Linkedin className="w-4 h-4" /> LinkedIn
              </a>
              <a
                href="https://www.instagram.com/_adesh__.y/?hl=en"
                target="_blank"
                rel="noreferrer"
                data-testid="about-dev-instagram"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border border-pink-500/40 bg-pink-500/10 text-pink-300 hover:bg-pink-500/20 hover:border-pink-500/80 hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition"
              >
                <Instagram className="w-4 h-4" /> Instagram
              </a>
              <a
                href="mailto:yashadesh.13@gmail.com"
                data-testid="about-dev-email"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border border-[#00E5D4]/40 bg-[#00E5D4]/10 text-[#00E5D4] hover:bg-[#00E5D4]/20 hover:border-[#00E5D4]/80 hover:shadow-[0_0_20px_rgba(0,229,212,0.4)] transition"
              >
                <Mail className="w-4 h-4" /> yashadesh.13@gmail.com
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
