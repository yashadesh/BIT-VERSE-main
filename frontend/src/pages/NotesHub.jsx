import { Link } from "react-router-dom";
import { BookOpenText, ArrowRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const semesters = [
  {
    n: 1,
    title: "Semester 1 (C)",
    subtitle: "Foundation semester — Chemistry, Maths-I, Electronics, Mechanical & more.",
    count: 10,
  },
  {
    n: 2,
    title: "Semester 2 (P)",
    subtitle: "Programming, Physics, Electrical, Maths-II and Communication skills.",
    count: 10,
  },
];

export default function NotesHub() {
  return (
    <div className="page-enter mx-auto max-w-6xl px-6 pt-28 md:pt-32">
      <PageHeader
        chip="Notes Library"
        title={<>Choose your <span className="text-[#00E5D4]">semester</span></>}
        subtitle="First Year Notes — carefully organized by subject and module."
        testid="notes-hub"
      />
      <div className="grid gap-6 md:grid-cols-2 mt-12">
        {semesters.map((s, i) => (
          <Link
            key={s.n}
            to={`/notes/sem/${s.n}`}
            className="card-glass p-8 md:p-10 group animate-fade-up shine"
            style={{ animationDelay: `${i * 0.1}s` }}
            data-testid={`semester-card-${s.n}`}
          >
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#00E5D4]/10 border border-[#00E5D4]/30 group-hover:scale-110 transition">
                <BookOpenText className="w-7 h-7 text-[#00E5D4]" />
              </div>
              <span className="chip">{s.count} Subjects</span>
            </div>
            <h3 className="font-display text-3xl md:text-4xl font-bold mt-6">{s.title}</h3>
            <p className="mt-3 text-sm md:text-base text-[#B0B8C5] max-w-md">{s.subtitle}</p>
            <div className="mt-6 flex items-center gap-2 text-[#00E5D4] text-xs font-mono uppercase tracking-widest">
              Open Semester <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
