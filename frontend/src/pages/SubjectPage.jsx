import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import { FolderOpen, ChevronRight, ArrowLeft } from "lucide-react";

export default function SubjectPage() {
  const { subjectId } = useParams();
  const [subject, setSubject] = useState(null);
  const [modules, setModules] = useState([]);

  useEffect(() => {
    api.get(`/subjects/${subjectId}`).then(({ data }) => setSubject(data)).catch(() => {});
    api.get(`/subjects/${subjectId}/modules`).then(({ data }) => setModules(data)).catch(() => {});
  }, [subjectId]);

  return (
    <div className="page-enter mx-auto max-w-6xl px-6 pt-28 md:pt-32">
      <Link
        to={subject ? `/notes/sem/${subject.semester}` : "/notes"}
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#00E5D4] mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <PageHeader
        chip={subject ? `Semester ${subject.semester}` : "Loading"}
        title={subject ? <>{subject.name}</> : "Loading..."}
        subtitle="Choose a module to open its files."
        testid="subject-header"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-12">
        {modules.map((m, i) => (
          <Link
            key={m.id}
            to={`/notes/module/${m.id}`}
            className="card-glass p-6 group animate-fade-up flex items-center gap-4"
            style={{ animationDelay: `${i * 0.05}s` }}
            data-testid={`module-card-${m.id}`}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#00E5D4]/10 border border-[#00E5D4]/30">
              <FolderOpen className="w-6 h-6 text-[#00E5D4]" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold text-lg">{m.name}</h3>
              <div className="text-xs font-mono text-white/50 mt-0.5">Open module</div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-[#00E5D4] group-hover:translate-x-1 transition" />
          </Link>
        ))}
        {modules.length === 0 && (
          <div className="col-span-full text-center text-white/50 text-sm py-16">
            No modules yet — add via Admin.
          </div>
        )}
      </div>
    </div>
  );
}
