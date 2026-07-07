import { useEffect, useMemo, useState } from "react";
import { api, API } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import FileCard from "@/components/FileCard";
import { BookOpen, ExternalLink, ChevronDown } from "lucide-react";

export default function Resources() {
  const [subjects, setSubjects] = useState([]);
  const [books, setBooks] = useState([]);        // file uploads (category=book)
  const [bookLinks, setBookLinks] = useState([]); // external book links (resource_type=book)
  const [openSubjectId, setOpenSubjectId] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/subjects?semester=1"),
      api.get("/subjects?semester=2"),
    ]).then(([a, b]) => setSubjects([...a.data, ...b.data]));
    api.get("/files?category=book").then(({ data }) => setBooks(data));
    api.get("/resources?resource_type=book").then(({ data }) => setBookLinks(data));
  }, []);

  const grouped = useMemo(() => {
    const map = {};
    subjects.forEach((s) => { map[s.id] = { subject: s, files: [], links: [] }; });
    books.forEach((f) => { if (map[f.subject_id]) map[f.subject_id].files.push(f); });
    // For links: match by subject_id stored inside description prefix "sid:<id>|" (kept simple)
    // Cleaner: allow bookLinks with an optional subject_id field via resources API — we tag links
    // by embedding subject id in description like "[subject_id]::description text".
    bookLinks.forEach((l) => {
      const m = /^\[([a-f0-9-]+)\]::/i.exec(l.description || "");
      if (m && map[m[1]]) {
        map[m[1]].links.push({ ...l, description: l.description.replace(m[0], "").trim() });
      } else {
        // unassigned links — attach to a virtual "general" bucket at the end
        if (!map._general) map._general = { subject: { id: "_general", name: "General", semester: 0 }, files: [], links: [] };
        map._general.links.push(l);
      }
    });
    return map;
  }, [subjects, books, bookLinks]);

  const order = [...subjects.map(s => s.id), ...(grouped._general ? ["_general"] : [])];

  return (
    <div className="page-enter mx-auto max-w-6xl px-6 pt-28 md:pt-32">
      <PageHeader
        chip="Book Library"
        title={<>Subject-wise <span className="text-[#00E5D4]">books</span> for BITians</>}
        subtitle="Every recommended textbook and reference, organized by subject."
        testid="resources-header"
      />

      <div className="mt-10 space-y-4">
        {order.map((sid) => {
          const g = grouped[sid];
          if (!g) return null;
          const total = g.files.length + g.links.length;
          const isOpen = openSubjectId === sid;
          return (
            <div key={sid} className="card-glass overflow-hidden" data-testid={`book-subject-${sid}`}>
              <button
                onClick={() => setOpenSubjectId(isOpen ? null : sid)}
                className="w-full flex items-center gap-4 p-5 md:p-6 text-left hover:bg-white/[0.02] transition"
                data-testid={`book-subject-toggle-${sid}`}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#00E5D4]/10 border border-[#00E5D4]/30 shrink-0">
                  <BookOpen className="w-5 h-5 text-[#00E5D4]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-semibold truncate">{g.subject.name}</div>
                  <div className="text-xs font-mono text-white/50 mt-0.5">
                    {sid === "_general" ? "General" : `Semester ${g.subject.semester}${g.subject.semester === 1 ? " (C)" : " (P)"}`} · {total} {total === 1 ? "book" : "books"}
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-white/50 transition ${isOpen ? "rotate-180 text-[#00E5D4]" : ""}`} />
              </button>

              {isOpen && (
                <div className="border-t border-white/5 p-4 md:p-6 space-y-3">
                  {g.files.length === 0 && g.links.length === 0 && (
                    <div className="text-center text-white/50 text-sm py-6">No books added yet for this subject.</div>
                  )}
                  {g.files.map((f) => <FileCard key={f.id} file={f} apiBase={API} />)}
                  {g.links.map((l) => (
                    <a
                      key={l.id}
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="file-row"
                      data-testid={`book-link-${l.id}`}
                    >
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#00B8FF]/10 border border-[#00B8FF]/30 shrink-0">
                        <BookOpen className="w-5 h-5 text-[#00B8FF]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">{l.title}</div>
                        {l.description && <div className="text-xs text-white/50 mt-0.5 line-clamp-1">{l.description}</div>}
                      </div>
                      <ExternalLink className="w-4 h-4 text-white/40" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
