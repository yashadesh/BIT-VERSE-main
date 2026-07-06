import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, API } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import FileCard from "@/components/FileCard";
import { ArrowLeft, FileX2 } from "lucide-react";

export default function ModulePage() {
  const { moduleId } = useParams();
  const [mod, setMod] = useState(null);
  const [subject, setSubject] = useState(null);
  const [files, setFiles] = useState([]);

  const load = () => {
    api.get(`/modules/${moduleId}`).then(async ({ data }) => {
      setMod(data);
      if (data?.subject_id) {
        const s = await api.get(`/subjects/${data.subject_id}`);
        setSubject(s.data);
      }
    });
    api.get(`/files?module_id=${moduleId}&category=notes`).then(({ data }) => setFiles(data));
  };
  useEffect(load, [moduleId]);

  return (
    <div className="page-enter mx-auto max-w-6xl px-6 pt-28 md:pt-32">
      <Link
        to={subject ? `/notes/subject/${subject.id}` : "/notes"}
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#00E5D4] mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <PageHeader
        chip={subject ? subject.name : ""}
        title={mod ? <>{mod.name}</> : "Loading..."}
        subtitle="All files uploaded to this module."
        testid="module-header"
      />

      <div className="mt-10 space-y-3">
        {files.map((f) => (
          <FileCard key={f.id} file={f} apiBase={API} />
        ))}
        {files.length === 0 && (
          <div className="card-glass p-12 flex flex-col items-center gap-3 text-center">
            <FileX2 className="w-10 h-10 text-[#00E5D4]/60" />
            <p className="text-white/70">No files here yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
