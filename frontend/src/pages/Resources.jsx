import { useEffect, useState } from "react";
import { api, API } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import FileCard from "@/components/FileCard";
import { BookOpen, Youtube, Code2, GraduationCap, LinkIcon, ExternalLink } from "lucide-react";

const CATS = [
  { key: "book", label: "Books", Icon: BookOpen },
  { key: "youtube", label: "YouTube Playlists", Icon: Youtube },
  { key: "coding", label: "Coding Resources", Icon: Code2 },
  { key: "semester", label: "Semester Resources", Icon: GraduationCap },
  { key: "link", label: "Important Links", Icon: LinkIcon },
];

export default function Resources() {
  const [tab, setTab] = useState("book");
  const [links, setLinks] = useState([]);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    api.get(`/resources?resource_type=${tab}`).then(({ data }) => setLinks(data));
    api.get(`/files?category=resource&resource_type=${tab}`).then(({ data }) => setFiles(data));
  }, [tab]);

  const active = CATS.find((c) => c.key === tab);
  const Icon = active.Icon;

  return (
    <div className="page-enter mx-auto max-w-6xl px-6 pt-28 md:pt-32">
      <PageHeader
        chip="Resource Library"
        title={<>Curated <span className="text-[#00E5D4]">resources</span> for BITians</>}
        subtitle="Books, playlists, coding tools and every useful link — handpicked."
        testid="resources-header"
      />

      <div className="mt-8 flex flex-wrap gap-2">
        {CATS.map(({ key, label, Icon: I }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            data-testid={`resource-tab-${key}`}
            className={`px-4 py-2 rounded-full text-sm font-medium tracking-wide transition border inline-flex items-center gap-2 ${
              tab === key
                ? "bg-[#00E5D4]/15 text-[#00E5D4] border-[#00E5D4]/60 shadow-[0_0_20px_rgba(0,229,212,0.25)]"
                : "border-white/10 text-white/60 hover:text-white hover:border-white/25"
            }`}
          >
            <I className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {links.map((l, i) => (
          <a
            key={l.id}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="card-glass p-6 group animate-fade-up flex items-start gap-4"
            style={{ animationDelay: `${i * 0.04}s` }}
            data-testid={`resource-link-${l.id}`}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#00E5D4]/10 border border-[#00E5D4]/30 shrink-0">
              <Icon className="w-5 h-5 text-[#00E5D4]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-semibold truncate">{l.title}</div>
              {l.description && (
                <p className="text-sm text-white/60 mt-1 line-clamp-2">{l.description}</p>
              )}
              <div className="text-xs font-mono text-white/40 mt-2 truncate">{l.url}</div>
            </div>
            <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-[#00E5D4] transition" />
          </a>
        ))}
        {links.length === 0 && files.length === 0 && (
          <div className="col-span-full card-glass p-10 text-center text-white/60">
            No resources here yet — add via Admin.
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-10 space-y-3">
          <div className="text-xs font-mono text-white/50 uppercase tracking-widest">Uploaded Files</div>
          {files.map((f) => <FileCard key={f.id} file={f} apiBase={API} />)}
        </div>
      )}
    </div>
  );
}
