import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, API } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import FileCard from "@/components/FileCard";
import { FolderOpen, ChevronRight, ArrowLeft, GraduationCap, FileX2 } from "lucide-react";

const isLabName = (name) =>
  /\b(lab|laboratory)\b/i.test(name || "");

export default function SubjectPage() {
  const { subjectId } = useParams();
  const [subject, setSubject] = useState(null);
  const [modules, setModules] = useState([]);
  const [labFiles, setLabFiles] = useState([]);
  const [tutorials, setTutorials] = useState([]);

  useEffect(() => {
    api.get(`/subjects/${subjectId}`).then(({ data }) => setSubject(data)).catch(() => {});
    api.get(`/subjects/${subjectId}/modules`).then(({ data }) => setModules(data)).catch(() => {});
    api.get(`/files?category=notes&subject_id=${subjectId}`).then(({ data }) => setLabFiles(data)).catch(() => {});
    api.get(`/files?category=tutorial&subject_id=${subjectId}`).then(({ data }) => setTutorials(data)).catch(() => {});
  }, [subjectId]);

  const isLab = isLabName(subject?.name);

  return (
    <div className="page-enter mx-auto max-w-6xl px-6 pt-28 md:pt-32">
      <Link
        to={subject ? `/notes/sem/${subject.semester}` : "/notes"}
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#00E5D4] mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <PageHeader
        chip={subject ? `Semester ${subject.semester}${subject.semester === 1 ? " (C)" : " (P)"}` : "Loading"}
        title={subject ? <>{subject.name}</> : "Loading..."}
        subtitle={isLab ? "All lab files uploaded for this subject." : "Choose a module to open its files."}
        testid="subject-header"
      />

      {/* LAB SUBJECTS: direct files, no modules */}
      {isLab && (
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Lab Files</h2>
            <span className="chip">{labFiles.filter(f => !f.module_id).length} Files</span>
          </div>
          <div className="space-y-3">
            {labFiles.filter(f => !f.module_id).map((f) => (
              <FileCard key={f.id} file={f} apiBase={API} />
            ))}
            {labFiles.filter(f => !f.module_id).length === 0 && (
              <div className="card-glass p-12 flex flex-col items-center gap-3 text-center">
                <FileX2 className="w-10 h-10 text-[#00E5D4]/60" />
                <p className="text-white/70">No lab files yet.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* NON-LAB: Modules grid */}
      {!isLab && (
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Modules</h2>
            <span className="chip">{modules.length} Modules</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                No modules yet.
              </div>
            )}
          </div>
        </section>
      )}

      {/* TUTORIALS SECTION — for every subject, shown after modules */}
      <section className="mt-16" data-testid="tutorials-section">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#00E5D4]/10 border border-[#00E5D4]/30">
              <GraduationCap className="w-5 h-5 text-[#00E5D4]" />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold">Tutorials</h2>
              <div className="text-xs font-mono text-white/50">Extra practice, tutorial sheets & handouts</div>
            </div>
          </div>
          <span className="chip">{tutorials.length} Files</span>
        </div>
        <div className="space-y-3">
          {tutorials.map((f) => (
            <FileCard key={f.id} file={f} apiBase={API} />
          ))}
          {tutorials.length === 0 && (
            <div className="card-glass p-8 text-center text-white/60 text-sm">
              No tutorials uploaded yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
