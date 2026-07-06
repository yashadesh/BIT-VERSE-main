import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import { Youtube, ExternalLink, PlayCircle } from "lucide-react";

export default function Resources() {
  const [links, setLinks] = useState([]);

  useEffect(() => {
    api.get(`/resources?resource_type=youtube`).then(({ data }) => setLinks(data));
  }, []);

  return (
    <div className="page-enter mx-auto max-w-6xl px-6 pt-28 md:pt-32">
      <PageHeader
        chip="Resource Library"
        title={<>Curated <span className="text-[#00E5D4]">YouTube playlists</span> for BITians</>}
        subtitle="Handpicked video lectures and playlists to help you crush every subject."
        testid="resources-header"
      />

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
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#00E5D4]/10 border border-[#00E5D4]/30 shrink-0">
              <PlayCircle className="w-6 h-6 text-[#00E5D4]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-semibold truncate">{l.title}</div>
              {l.description && (
                <p className="text-sm text-white/60 mt-1 line-clamp-2">{l.description}</p>
              )}
              <div className="text-xs font-mono text-white/40 mt-2 truncate flex items-center gap-1.5">
                <Youtube className="w-3 h-3 text-red-400" /> {l.url}
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-[#00E5D4] transition" />
          </a>
        ))}
        {links.length === 0 && (
          <div className="col-span-full card-glass p-14 text-center">
            <PlayCircle className="w-12 h-12 text-[#00E5D4]/60 mx-auto mb-3" />
            <p className="text-white/70">No YouTube playlists added yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
