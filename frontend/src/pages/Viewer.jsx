import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, API, LOGO_URL } from "@/lib/api";
import { Download, ExternalLink, ArrowLeft } from "lucide-react";

const isMobile = () =>
  typeof window !== "undefined" &&
  (/Mobi|Android|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768);

export default function Viewer() {
  const { fileId } = useParams();
  const [f, setF] = useState(null);
  const [error, setError] = useState("");
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMobile(isMobile());
    api
      .get(`/files/${fileId}`)
      .then(({ data }) => setF(data))
      .catch(() => setError("File not found"));
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
  // Google Docs Viewer (drive-like) works on all devices for PDF/Office — used universally
  const gviewUrl = `https://docs.google.com/gview?url=${encodeURIComponent(rawUrl)}&embedded=true`;
  const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(rawUrl)}`;

  // PDF & Office: use Google Docs Viewer everywhere (mobile + desktop) for consistent Drive-like UX
  const pdfSrc = gviewUrl;
  const officeSrc = mobile ? gviewUrl : officeUrl;

  return (
    <div className="fixed inset-0 z-50 bg-[#05070A] flex flex-col" data-testid="file-viewer">
      <header className="glass border-b border-white/10 px-3 md:px-4 py-2.5 md:py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button
            onClick={() => { if (window.history.length > 1) window.history.back(); else window.close(); }}
            className="text-white/60 hover:text-white shrink-0"
            data-testid="viewer-close"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="logo-frame shrink-0">
            <img src={LOGO_URL} alt="BITVERSE" className="w-8 h-8 md:w-9 md:h-9 object-contain block" />
          </span>
          <div className="min-w-0">
            <div className="text-white text-xs md:text-sm font-medium truncate">{f.display_name}</div>
            <div className="text-[9px] md:text-[10px] font-mono text-white/50 uppercase tracking-widest">
              {ext} · BITVERSE Viewer
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={rawUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-neon hidden sm:inline-flex"
            style={{ padding: "0.4rem 0.8rem", fontSize: "0.7rem" }}
            data-testid="viewer-open-raw"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open Raw
          </a>
          <a
            href={`${API}/files/${f.id}/download`}
            className="btn-neon primary"
            style={{ padding: "0.4rem 0.8rem", fontSize: "0.7rem" }}
            data-testid="viewer-download"
          >
            <Download className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Download</span>
          </a>
        </div>
      </header>
      <div className="flex-1 bg-black overflow-hidden">
        {isImage && (
          <div className="w-full h-full flex items-center justify-center overflow-auto p-2 md:p-4">
            <img src={rawUrl} alt={f.display_name} className="max-w-full max-h-full object-contain" />
          </div>
        )}
        {isPdf && (
          <iframe
            title="pdf-preview"
            src={pdfSrc}
            className="w-full h-full border-0"
            allow="fullscreen"
          />
        )}
        {isOffice && (
          <iframe
            title="office-preview"
            src={officeSrc}
            className="w-full h-full border-0"
            allow="fullscreen"
          />
        )}
        {!isImage && !isPdf && !isOffice && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white/70 px-6 text-center">
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
