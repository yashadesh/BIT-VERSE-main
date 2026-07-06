import { Link } from "react-router-dom";
import { Download, Eye, FileText, FileImage, Presentation, FileType2 } from "lucide-react";

function iconFor(name) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["pdf"].includes(ext)) return { Icon: FileText, color: "#ff5c5c" };
  if (["ppt", "pptx"].includes(ext)) return { Icon: Presentation, color: "#ff9f43" };
  if (["doc", "docx"].includes(ext)) return { Icon: FileType2, color: "#2e86de" };
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return { Icon: FileImage, color: "#00E5D4" };
  return { Icon: FileText, color: "#B0B8C5" };
}

function fmtSize(n) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return ""; }
}

export default function FileCard({ file, apiBase }) {
  const { Icon, color } = iconFor(file.original_filename);
  const downloadHref = `${apiBase}/files/${file.id}/download`;
  const viewHref = `/viewer/${file.id}`;

  return (
    <div className="file-row" data-testid={`file-card-${file.id}`}>
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}45` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white truncate">{file.display_name}</div>
        <div className="text-xs text-white/50 font-mono mt-0.5 flex gap-3">
          <span>{fmtDate(file.created_at)}</span>
          <span>·</span>
          <span>{fmtSize(file.size)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          to={viewHref}
          target="_blank"
          rel="noreferrer"
          className="btn-neon"
          style={{ padding: "0.5rem 0.9rem", fontSize: "0.7rem" }}
          data-testid={`file-view-${file.id}`}
        >
          <Eye className="w-3.5 h-3.5" /> View
        </Link>
        <a
          href={downloadHref}
          className="btn-neon primary"
          style={{ padding: "0.5rem 0.9rem", fontSize: "0.7rem" }}
          data-testid={`file-download-${file.id}`}
        >
          <Download className="w-3.5 h-3.5" /> Download
        </a>
      </div>
    </div>
  );
}
