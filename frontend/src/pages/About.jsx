import PageHeader from "@/components/PageHeader";
import { LOGO_URL } from "@/lib/api";
import { Sparkles, Users, ShieldCheck, Zap } from "lucide-react";

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
          <img src={LOGO_URL} alt="BITVERSE" className="w-32 h-32 logo-glow object-contain" />
          <p className="text-[#B0B8C5] leading-relaxed">
            BITVERSE provides organized notes, previous year papers, syllabi, and academic
            resources — all in one beautiful and easy-to-use platform. Semester-wise
            structure, in-browser file viewers and zero login friction. Everything a First
            Year BITian needs to breeze through their first year at Mesra.
          </p>
          <div className="chip">Notes · PYQs · Syllabus · Resources</div>
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
    </div>
  );
}
