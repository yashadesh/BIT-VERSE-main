import { Link, useLocation } from "react-router-dom";
import { LOGO_URL } from "@/lib/api";
import { Github, Mail, Heart } from "lucide-react";

export default function Footer() {
  const loc = useLocation();
  if (loc.pathname.startsWith("/viewer")) return null;
  return (
    <footer className="relative z-10 mt-32 border-t border-white/5" data-testid="footer">
      <div className="mx-auto max-w-6xl px-6 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="BITVERSE" className="w-10 h-10 logo-glow rounded-lg" />
            <span className="font-display text-xl font-bold tracking-wider">
              BIT<span className="text-[#00E5D4]">VERSE</span>
            </span>
          </div>
          <p className="mt-4 text-sm text-[#B0B8C5] max-w-md leading-relaxed">
            A student-driven digital notes library exclusively for First Year students of
            Birla Institute of Technology, Mesra. Notes, PYQs, syllabi, and resources — all
            in one beautiful place.
          </p>
        </div>
        <div>
          <h4 className="font-display text-xs tracking-[0.2em] uppercase text-[#00E5D4] mb-4">
            Quick Links
          </h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/notes" className="hover:text-[#00E5D4]">Notes</Link></li>
            <li><Link to="/pyqs" className="hover:text-[#00E5D4]">Previous Year Questions</Link></li>
            <li><Link to="/syllabus" className="hover:text-[#00E5D4]">Syllabus</Link></li>
            <li><Link to="/resources" className="hover:text-[#00E5D4]">Resources</Link></li>
            <li><Link to="/about" className="hover:text-[#00E5D4]">About</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-xs tracking-[0.2em] uppercase text-[#00E5D4] mb-4">
            Contact
          </h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> hello@bitverse.in</li>
            <li>BIT Mesra, Ranchi</li>
            <li>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 hover:text-[#00E5D4]"
                data-testid="footer-github"
              >
                <Github className="w-4 h-4" /> GitHub
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-6 text-center text-xs text-white/50 flex items-center justify-center gap-2 font-mono">
        Built with <Heart className="w-3.5 h-3.5 text-[#00E5D4] fill-[#00E5D4]" /> for BIT Mesra Students · © {new Date().getFullYear()} BITVERSE
      </div>
    </footer>
  );
}
