import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, API } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import FileCard from "@/components/FileCard";
import { ArrowLeft } from "lucide-react";

const TABS = [
  { key: "mid", label: "Mid Semester" },
  { key: "end", label: "End Semester" },
  { key: "solution", label: "Solutions" },
];

export default function PYQSubject() {
  const { subjectId } = useParams();
  const [subject, setSubject] = useState(null);
  const [tab, setTab] = useState("mid");
  const [files, setFiles] = useState([]);

  useEffect(() => {
    api.get(`/subjects/${subjectId}`).then(({ data }) => setSubject(data));
  }, [subjectId]);

  useEffect(() => {
    api.get(`/files?category=pyq&subject_id=${subjectId}&pyq_type=${tab}`)
      .then(({ data }) => setFiles(data));
  }, [subjectId, tab]);

  return (
    <div className="page-enter mx-auto max-w-6xl px-6 pt-28 md:pt-32">
      <Link to="/pyqs" className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#00E5D4] mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <PageHeader
        chip={subject ? `Semester ${subject.semester}${subject.semester === 1 ? " (C)" : " (P)"}` : ""}
        title={subject ? <>{subject.name} <span className="text-[#00E5D4]">— PYQs</span></> : "Loading…"}
        subtitle="Pick a paper set below."
        testid="pyq-subject-header"
      />

      <div className="mt-8 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            data-testid={`pyq-tab-${t.key}`}
            className={`px-5 py-2.5 rounded-full text-sm font-medium tracking-wide transition-all border ${
              tab === t.key
                ? "bg-[#00E5D4]/15 text-[#00E5D4] border-[#00E5D4]/60 shadow-[0_0_20px_rgba(0,229,212,0.35)]"
                : "border-white/10 text-white/60 hover:text-white hover:border-white/25"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        {files.map((f) => <FileCard key={f.id} file={f} apiBase={API} />)}
        {files.length === 0 && (
          <div className="card-glass p-10 text-center text-white/60">No {TABS.find(t=>t.key===tab).label} papers uploaded yet.</div>
        )}
      </div>
    </div>
  );
}
