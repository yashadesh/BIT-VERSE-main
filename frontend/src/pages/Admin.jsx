import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, API } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import {
  Upload, Plus, Trash2, FileText, FolderPlus, LinkIcon, BookOpen, FileArchive, GraduationCap,
} from "lucide-react";

const TABS = [
  { key: "notes", label: "Notes", Icon: BookOpen },
  { key: "tutorial", label: "Tutorials", Icon: GraduationCap },
  { key: "pyq", label: "PYQs", Icon: FileText },
  { key: "syllabus", label: "Syllabus", Icon: FileArchive },
  { key: "book", label: "Books", Icon: LinkIcon },
  { key: "manage", label: "Manage", Icon: FolderPlus },
];

const DIRECT_FILE_SUBJECTS = new Set([
  "Programming for Problem Solving",
  "Workshop Practice",
  "NSS",
  "PT and Games",
  "Engineering Graphics",
]);
const isDirectFilesSubject = (name) =>
  /\b(lab|laboratory)\b/i.test(name || "") || DIRECT_FILE_SUBJECTS.has(name);

export default function Admin() {
  const [tab, setTab] = useState("notes");
  const [subjects, setSubjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [files, setFiles] = useState([]);
  const [resources, setResources] = useState([]);

  const loadAll = async () => {
    const [s1, s2] = await Promise.all([
      api.get("/subjects?semester=1"), api.get("/subjects?semester=2"),
    ]);
    setSubjects([...s1.data, ...s2.data]);
    const f = await api.get("/files");
    setFiles(f.data);
    const r = await api.get("/resources?resource_type=book");
    setResources(r.data);
  };
  useEffect(() => { loadAll(); }, []);

  const loadModules = async (subjectId) => {
    if (!subjectId) return setModules([]);
    const { data } = await api.get(`/subjects/${subjectId}/modules`);
    setModules(data);
  };

  return (
    <div className="page-enter mx-auto max-w-6xl px-6 pt-28 md:pt-32">
      <PageHeader
        chip="Admin Dashboard"
        title={<>Manage the <span className="text-[#00E5D4]">library</span></>}
        subtitle="Upload files, add subjects & modules, and curate books & subject material. Open access — no login."
        testid="admin-header"
      />

      <div className="mt-8 flex flex-wrap gap-2">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            data-testid={`admin-tab-${key}`}
            className={`px-4 py-2 rounded-full text-sm font-medium tracking-wide transition border inline-flex items-center gap-2 ${
              tab === key
                ? "bg-[#00E5D4]/15 text-[#00E5D4] border-[#00E5D4]/60 shadow-[0_0_20px_rgba(0,229,212,0.25)]"
                : "border-white/10 text-white/60 hover:text-white hover:border-white/25"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {tab === "notes" && (
          <UploadNotes subjects={subjects} modules={modules} onSubject={loadModules} refresh={loadAll} />
        )}
        {tab === "tutorial" && (
          <UploadTutorial subjects={subjects} refresh={loadAll} />
        )}
        {tab === "pyq" && (
          <UploadPYQ subjects={subjects} refresh={loadAll} />
        )}
        {tab === "syllabus" && (
          <UploadSyllabus refresh={loadAll} />
        )}
        {tab === "book" && (
          <>
            <UploadBookFile subjects={subjects} refresh={loadAll} />
            <AddBookLink subjects={subjects} refresh={loadAll} />
          </>
        )}
        {tab === "manage" && (
          <>
            <AddSubject refresh={loadAll} />
            <AddModule subjects={subjects} modules={modules} onSubject={loadModules} refresh={loadAll} />
          </>
        )}

        {tab !== "book" && <ListFiles files={files} tab={tab} refresh={loadAll} />}
        {tab === "book" && <ListResources resources={resources} refresh={loadAll} />}
      </div>
    </div>
  );
}

/* ----- Sub-forms ----- */
function GlassBox({ title, children, testid }) {
  return (
    <div className="card-glass p-6 md:p-8" data-testid={testid}>
      <h3 className="font-display text-lg font-semibold mb-5">{title}</h3>
      {children}
    </div>
  );
}
function Field({ label, children }) {
  return (
    <label className="block mb-4">
      <div className="text-xs font-mono uppercase tracking-widest text-white/60 mb-1.5">{label}</div>
      {children}
    </label>
  );
}
const inp = "w-full px-4 py-2.5 rounded-xl bg-[#0D1117]/70 border border-white/10 text-white text-sm focus:outline-none focus:border-[#00E5D4]/60 focus:ring-2 focus:ring-[#00E5D4]/20";

function UploadNotes({ subjects, modules, onSubject, refresh }) {
  const [subjectId, setSubjectId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const currentSubject = subjects.find((s) => s.id === subjectId);
  const isDirect = isDirectFilesSubject(currentSubject?.name);

  const submit = async (e) => {
    e.preventDefault();
    if (!subjectId || !file) return toast.error("Select subject and file");
    if (!isDirect && !moduleId) return toast.error("Select a module");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", "notes");
      fd.append("subject_id", subjectId);
      if (moduleId && !isDirect) fd.append("module_id", moduleId);
      if (name) fd.append("display_name", name);
      await api.post("/upload", fd);
      toast.success("Notes uploaded");
      setFile(null); setName("");
      refresh();
    } catch (e) { toast.error("Upload failed"); }
    setBusy(false);
  };

  return (
    <GlassBox title="Upload Notes" testid="admin-upload-notes">
      <form onSubmit={submit}>
        <Field label="Subject">
          <select className={inp} value={subjectId} onChange={(e)=>{setSubjectId(e.target.value); setModuleId(""); onSubject(e.target.value);}} data-testid="admin-notes-subject">
            <option value="">Select subject…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>Sem {s.semester}{s.semester === 1 ? " (C)" : " (P)"} · {s.name}</option>
            ))}
          </select>
        </Field>
        {isDirect ? (
          <div className="mb-4 chip">Direct-file subject — no modules needed</div>
        ) : (
          <Field label="Module">
            <select className={inp} value={moduleId} onChange={(e)=>setModuleId(e.target.value)} data-testid="admin-notes-module">
              <option value="">Select module…</option>
              {modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="Display Name (optional)">
          <input className={inp} value={name} onChange={(e)=>setName(e.target.value)} placeholder="e.g., Module 1 Notes" data-testid="admin-notes-name" />
        </Field>
        <Field label="File">
          <input type="file" onChange={(e)=>setFile(e.target.files?.[0] || null)} className={inp} data-testid="admin-notes-file" accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg" />
        </Field>
        <button type="submit" className="btn-neon primary w-full" disabled={busy} data-testid="admin-notes-submit">
          <Upload className="w-4 h-4" /> {busy ? "Uploading…" : "Upload Notes"}
        </button>
      </form>
    </GlassBox>
  );
}

function UploadTutorial({ subjects, refresh }) {
  const [subjectId, setSubjectId] = useState("");
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!subjectId || !file) return toast.error("Select subject and file");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", "tutorial");
      fd.append("subject_id", subjectId);
      if (name) fd.append("display_name", name);
      await api.post("/upload", fd);
      toast.success("Tutorial uploaded");
      setFile(null); setName("");
      refresh();
    } catch { toast.error("Upload failed"); }
    setBusy(false);
  };

  return (
    <GlassBox title="Upload Tutorial" testid="admin-upload-tutorial">
      <form onSubmit={submit}>
        <Field label="Subject">
          <select className={inp} value={subjectId} onChange={(e)=>setSubjectId(e.target.value)} data-testid="admin-tutorial-subject">
            <option value="">Select subject…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>Sem {s.semester}{s.semester === 1 ? " (C)" : " (P)"} · {s.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Display Name (optional)">
          <input className={inp} value={name} onChange={(e)=>setName(e.target.value)} placeholder="e.g., Tutorial Sheet 1" data-testid="admin-tutorial-name" />
        </Field>
        <Field label="File">
          <input type="file" onChange={(e)=>setFile(e.target.files?.[0] || null)} className={inp} data-testid="admin-tutorial-file" />
        </Field>
        <button type="submit" className="btn-neon primary w-full" disabled={busy} data-testid="admin-tutorial-submit">
          <Upload className="w-4 h-4" /> {busy ? "Uploading…" : "Upload Tutorial"}
        </button>
      </form>
    </GlassBox>
  );
}

function UploadPYQ({ subjects, refresh }) {
  const [subjectId, setSubjectId] = useState("");
  const [pyqType, setPyqType] = useState("mid");
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!subjectId || !file) return toast.error("Select subject and file");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", "pyq");
      fd.append("subject_id", subjectId);
      fd.append("pyq_type", pyqType);
      if (name) fd.append("display_name", name);
      await api.post("/upload", fd);
      toast.success("PYQ uploaded");
      setFile(null); setName("");
      refresh();
    } catch { toast.error("Upload failed"); }
    setBusy(false);
  };

  return (
    <GlassBox title="Upload PYQ" testid="admin-upload-pyq">
      <form onSubmit={submit}>
        <Field label="Subject">
          <select className={inp} value={subjectId} onChange={(e)=>setSubjectId(e.target.value)} data-testid="admin-pyq-subject">
            <option value="">Select subject…</option>
            {subjects.map((s) => (<option key={s.id} value={s.id}>Sem {s.semester}{s.semester === 1 ? " (C)" : " (P)"} · {s.name}</option>))}
          </select>
        </Field>
        <Field label="Paper Type">
          <select className={inp} value={pyqType} onChange={(e)=>setPyqType(e.target.value)} data-testid="admin-pyq-type">
            <option value="mid">Mid Semester</option>
            <option value="end">End Semester</option>
            <option value="solution">Solution</option>
          </select>
        </Field>
        <Field label="Display Name (optional)">
          <input className={inp} value={name} onChange={(e)=>setName(e.target.value)} placeholder="e.g., End Sem 2023" data-testid="admin-pyq-name" />
        </Field>
        <Field label="File">
          <input type="file" onChange={(e)=>setFile(e.target.files?.[0] || null)} className={inp} data-testid="admin-pyq-file" />
        </Field>
        <button type="submit" className="btn-neon primary w-full" disabled={busy} data-testid="admin-pyq-submit">
          <Upload className="w-4 h-4" /> {busy ? "Uploading…" : "Upload PYQ"}
        </button>
      </form>
    </GlassBox>
  );
}

function UploadSyllabus({ refresh }) {
  const [semester, setSemester] = useState(1);
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Select file");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", "syllabus");
      fd.append("semester", semester);
      if (name) fd.append("display_name", name);
      await api.post("/upload", fd);
      toast.success("Syllabus uploaded");
      setFile(null); setName("");
      refresh();
    } catch { toast.error("Upload failed"); }
    setBusy(false);
  };

  return (
    <GlassBox title="Upload Syllabus" testid="admin-upload-syllabus">
      <form onSubmit={submit}>
        <Field label="Semester">
          <select className={inp} value={semester} onChange={(e)=>setSemester(+e.target.value)} data-testid="admin-syl-sem">
            <option value={1}>Semester 1 (C)</option>
            <option value={2}>Semester 2 (P)</option>
          </select>
        </Field>
        <Field label="Display Name (optional)">
          <input className={inp} value={name} onChange={(e)=>setName(e.target.value)} data-testid="admin-syl-name" />
        </Field>
        <Field label="File">
          <input type="file" onChange={(e)=>setFile(e.target.files?.[0] || null)} className={inp} data-testid="admin-syl-file" />
        </Field>
        <button type="submit" className="btn-neon primary w-full" disabled={busy} data-testid="admin-syl-submit">
          <Upload className="w-4 h-4" /> {busy ? "Uploading…" : "Upload Syllabus"}
        </button>
      </form>
    </GlassBox>
  );
}

function UploadBookFile({ subjects, refresh }) {
  const [subjectId, setSubjectId] = useState("");
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!subjectId || !file) return toast.error("Select subject and file");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", "book");
      fd.append("subject_id", subjectId);
      if (name) fd.append("display_name", name);
      await api.post("/upload", fd);
      toast.success("Book uploaded");
      setFile(null); setName("");
      refresh();
    } catch { toast.error("Upload failed"); }
    setBusy(false);
  };

  return (
    <GlassBox title="Upload Book PDF" testid="admin-upload-book">
      <form onSubmit={submit}>
        <Field label="Subject">
          <select className={inp} value={subjectId} onChange={(e)=>setSubjectId(e.target.value)} data-testid="admin-book-subject">
            <option value="">Select subject…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>Sem {s.semester}{s.semester === 1 ? " (C)" : " (P)"} · {s.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Book Title (optional)">
          <input className={inp} value={name} onChange={(e)=>setName(e.target.value)} placeholder="e.g., NCERT Chemistry Vol. 1" data-testid="admin-book-name" />
        </Field>
        <Field label="File">
          <input type="file" onChange={(e)=>setFile(e.target.files?.[0] || null)} className={inp} data-testid="admin-book-file" />
        </Field>
        <button type="submit" className="btn-neon primary w-full" disabled={busy} data-testid="admin-book-submit">
          <Upload className="w-4 h-4" /> {busy ? "Uploading…" : "Upload Book"}
        </button>
      </form>
    </GlassBox>
  );
}

function AddBookLink({ subjects, refresh }) {
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!subjectId || !title || !url) return toast.error("Subject, title and URL required");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("url", url);
      fd.append("resource_type", "book");
      // Tag with subject id in description prefix for subject-wise grouping on Resources page
      fd.append("description", `[${subjectId}]:: ${desc}`.trim());
      await api.post("/resources", fd);
      toast.success("Book link added");
      setTitle(""); setUrl(""); setDesc("");
      refresh();
    } catch { toast.error("Failed"); }
    setBusy(false);
  };

  return (
    <GlassBox title="Add Book Link" testid="admin-add-book-link">
      <form onSubmit={submit}>
        <Field label="Subject">
          <select className={inp} value={subjectId} onChange={(e)=>setSubjectId(e.target.value)} data-testid="admin-book-link-subject">
            <option value="">Select subject…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>Sem {s.semester}{s.semester === 1 ? " (C)" : " (P)"} · {s.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Book Title">
          <input className={inp} value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="e.g., HC Verma — Concepts of Physics" data-testid="admin-book-link-title" />
        </Field>
        <Field label="URL">
          <input className={inp} value={url} onChange={(e)=>setUrl(e.target.value)} placeholder="https://…" data-testid="admin-book-link-url" />
        </Field>
        <Field label="Description (optional)">
          <textarea className={inp} value={desc} onChange={(e)=>setDesc(e.target.value)} rows={2} data-testid="admin-book-link-desc" />
        </Field>
        <button type="submit" className="btn-neon primary w-full" disabled={busy} data-testid="admin-book-link-submit">
          <Plus className="w-4 h-4" /> {busy ? "Adding…" : "Add Book Link"}
        </button>
      </form>
    </GlassBox>
  );
}

function AddSubject({ refresh }) {
  const [name, setName] = useState("");
  const [semester, setSemester] = useState(1);
  const [credits, setCredits] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("semester", semester);
      if (credits) fd.append("credits", credits);
      await api.post("/subjects", fd);
      toast.success("Subject added");
      setName(""); setCredits("");
      refresh();
    } catch { toast.error("Failed"); }
    setBusy(false);
  };

  return (
    <GlassBox title="Add Subject" testid="admin-add-subject">
      <form onSubmit={submit}>
        <Field label="Name"><input className={inp} value={name} onChange={(e)=>setName(e.target.value)} data-testid="admin-subject-name" /></Field>
        <Field label="Semester">
          <select className={inp} value={semester} onChange={(e)=>setSemester(+e.target.value)} data-testid="admin-subject-sem">
            <option value={1}>Semester 1 (C)</option>
            <option value={2}>Semester 2 (P)</option>
          </select>
        </Field>
        <Field label="Credits">
          <input className={inp} type="number" step="0.5" value={credits} onChange={(e)=>setCredits(e.target.value)} data-testid="admin-subject-credits" />
        </Field>
        <button type="submit" className="btn-neon primary w-full" disabled={busy} data-testid="admin-subject-submit">
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </form>
    </GlassBox>
  );
}

function AddModule({ subjects, modules, onSubject, refresh }) {
  const [subjectId, setSubjectId] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!subjectId || !name) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("subject_id", subjectId);
      fd.append("name", name);
      await api.post("/modules", fd);
      toast.success("Module added");
      setName("");
      onSubject(subjectId);
      refresh();
    } catch { toast.error("Failed"); }
    setBusy(false);
  };

  return (
    <GlassBox title="Add Module" testid="admin-add-module">
      <form onSubmit={submit}>
        <Field label="Subject">
          <select className={inp} value={subjectId} onChange={(e)=>{setSubjectId(e.target.value); onSubject(e.target.value);}} data-testid="admin-module-subject">
            <option value="">Select subject…</option>
            {subjects.filter(s => !isDirectFilesSubject(s.name)).map((s) => (<option key={s.id} value={s.id}>Sem {s.semester}{s.semester === 1 ? " (C)" : " (P)"} · {s.name}</option>))}
          </select>
        </Field>
        <Field label="Name"><input className={inp} value={name} onChange={(e)=>setName(e.target.value)} placeholder="e.g., Module 6" data-testid="admin-module-name" /></Field>
        <button type="submit" className="btn-neon primary w-full" disabled={busy} data-testid="admin-module-submit">
          <Plus className="w-4 h-4" /> Add Module
        </button>
        {modules.length > 0 && (
          <div className="mt-4 text-xs font-mono text-white/50">Existing: {modules.map(m=>m.name).join(", ")}</div>
        )}
      </form>
    </GlassBox>
  );
}

function ListFiles({ files, tab, refresh }) {
  const filtered = tab === "manage" ? files : files.filter((f) => f.category === tab);
  const remove = async (id) => {
    await api.delete(`/files/${id}`);
    toast.success("File removed");
    refresh();
  };
  return (
    <GlassBox title={`Uploaded (${filtered.length})`} testid="admin-file-list">
      <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
        {filtered.map((f) => (
          <div key={f.id} className="file-row" data-testid={`admin-file-${f.id}`}>
            <div className="w-9 h-9 rounded-lg bg-[#00E5D4]/10 border border-[#00E5D4]/30 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-[#00E5D4]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{f.display_name}</div>
              <div className="text-[10px] font-mono text-white/50 uppercase tracking-widest">{f.category} · {f.original_filename}</div>
            </div>
            <a href={`${API}/files/${f.id}/download`} className="text-white/60 hover:text-[#00E5D4] p-2" title="Download" data-testid={`admin-file-download-${f.id}`}>
              <FileText className="w-4 h-4" />
            </a>
            <button onClick={()=>remove(f.id)} className="text-white/60 hover:text-red-400 p-2" title="Delete" data-testid={`admin-file-delete-${f.id}`}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-white/50 text-sm text-center py-8">No files yet.</div>
        )}
      </div>
    </GlassBox>
  );
}

function ListResources({ resources, refresh }) {
  const remove = async (id) => {
    await api.delete(`/resources/${id}`);
    toast.success("Removed");
    refresh();
  };
  return (
    <GlassBox title={`Book Links (${resources.length})`} testid="admin-resource-list">
      <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
        {resources.map((r) => (
          <div key={r.id} className="file-row" data-testid={`admin-resource-${r.id}`}>
            <div className="w-9 h-9 rounded-lg bg-[#00E5D4]/10 border border-[#00E5D4]/30 flex items-center justify-center shrink-0">
              <LinkIcon className="w-4 h-4 text-[#00E5D4]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{r.title}</div>
              <div className="text-[10px] font-mono text-white/50 uppercase tracking-widest truncate">{r.url}</div>
            </div>
            <button onClick={()=>remove(r.id)} className="text-white/60 hover:text-red-400 p-2" data-testid={`admin-resource-delete-${r.id}`}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {resources.length === 0 && (<div className="text-white/50 text-sm text-center py-8">No book links yet.</div>)}
      </div>
    </GlassBox>
  );
}
