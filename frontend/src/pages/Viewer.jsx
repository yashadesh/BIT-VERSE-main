import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, API, LOGO_URL } from "@/lib/api";
import { Download, ExternalLink, ArrowLeft } from "lucide-react";

export default function Viewer() {
  const { fileId } = useParams();
  const [f, setF] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/files/${fileId}`).then(({ data }) => setF(data)).catch(() => setError("File not found"));
  }, [fileId]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/70" data-testid="viewer-error">
        {error}
      </div>
    );
  }
  if (!f) {
    return <div className="min-h-screen flex items-center justify-center text-white/70">Loading…</div>;
  }

  const rawUrl = `${API}/files/${f.id}/view`;
  const ext = (f.original_filename.split(".").pop() || "").toLowerCase();
  const isPdf = ext === "pdf";
  const isImage = ["png", "jpg", "jpeg", "webp", "gif"].includes(ext);
  const isOffice = ["ppt", "pptx", "doc", "docx", "xls", "xlsx"].includes(ext);
  const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(rawUrl)}`;

  return (
    <div className="fixed inset-0 z-50 bg-[#05070A] flex flex-col" data-testid="file-viewer">
      <header className="glass border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => window.close()} className="text-white/60 hover:text-white shrink-0" data-testid="viewer-close">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img src={LOGO_URL} alt="BITVERSE" className="w-10 h-10 logo-glow object-contain shrink-0" />
          <div className="min-w-0">
            <div className="text-white text-sm font-medium truncate">{f.display_name}</div>
            <div className="text-[10px] font-mono text-white/50 uppercase tracking-widest">{ext} · BITVERSE Viewer</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={rawUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-neon"
            style={{ padding: "0.5rem 0.9rem", fontSize: "0.7rem" }}
            data-testid="viewer-open-raw"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open Raw
          </a>
          <a
            href={`${API}/files/${f.id}/download`}
            className="btn-neon primary"
            style={{ padding: "0.5rem 0.9rem", fontSize: "0.7rem" }}
            data-testid="viewer-download"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </a>
        </div>
      </header>
      <div className="flex-1 bg-black">
        {isImage && (
          <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
            <img src={rawUrl} alt={f.display_name} className="max-w-full max-h-full object-contain" />
          </div>
        )}
        {isPdf && (
          <iframe title="pdf" src={rawUrl} className="w-full h-full" />
        )}
        {isOffice && (
          <iframe title="office" src={officeUrl} className="w-full h-full" />
        )}
        {!isImage && !isPdf && !isOffice && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white/70">
            <p>Preview not available for .{ext} files.</p>
            <a href={`${API}/files/${f.id}/download`} className="btn-neon primary">
              <Download className="w-4 h-4" /> Download
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
