import { Link, useLocation } from "react-router-dom";
import { LOGO_URL, DEV_PHOTO_URL } from "@/lib/api";
import { Github, Mail, Heart, Linkedin, Instagram } from "lucide-react";

export default function Footer() {
  const loc = useLocation();
  if (loc.pathname.startsWith("/viewer")) return null;
  return (
    <footer className="relative z-10 mt-32 border-t border-white/5" data-testid="footer">
      {/* Developer credit card */}
      <div className="mx-auto max-w-6xl px-6 pt-14">
        <div
          className="card-glass p-8 md:p-10 flex flex-col md:flex-row items-center md:items-center gap-8"
          data-testid="developer-credit"
        >
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-[#00E5D4]/30 blur-2xl rounded-full scale-110" />
            <img
              src={DEV_PHOTO_URL}
              alt="Adesh Yash"
              className="relative w-32 h-32 md:w-36 md:h-36 rounded-full object-cover border-2 border-[#00E5D4]/60 shadow-[0_0_30px_rgba(0,229,212,0.45)]"
              data-testid="dev-photo"
            />
          </div>
          <div className="flex-1 min-w-0 text-center md:text-left">
            <div className="chip mb-2">Built by</div>
            <h3 className="font-display text-2xl md:text-3xl font-bold">
              Adesh <span className="text-[#00E5D4]">Yash</span>
            </h3>
            <p className="text-sm text-[#B0B8C5] mt-1">
              Founder · Content Manager · Lead Developer
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
              <a
                href="https://www.linkedin.com/in/adesh-yash-624a87383/"
                target="_blank"
                rel="noreferrer"
                data-testid="dev-linkedin"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm border border-[#0077B5]/40 bg-[#0077B5]/10 text-[#7cc4ff] hover:bg-[#0077B5]/20 hover:border-[#0077B5]/70 transition"
              >
                <Linkedin className="w-4 h-4" /> LinkedIn
              </a>
              <a
                href="https://www.instagram.com/_adesh__.y/?hl=en"
                target="_blank"
                rel="noreferrer"
                data-testid="dev-instagram"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm border border-pink-500/40 bg-pink-500/10 text-pink-300 hover:bg-pink-500/20 hover:border-pink-500/70 transition"
              >
                <Instagram className="w-4 h-4" /> Instagram
              </a>
              <a
                href="mailto:yashadesh.13@gmail.com"
                data-testid="dev-email"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm border border-[#00E5D4]/40 bg-[#00E5D4]/10 text-[#00E5D4] hover:bg-[#00E5D4]/20 hover:border-[#00E5D4]/70 transition"
              >
                <Mail className="w-4 h-4" /> yashadesh.13@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <span className="logo-frame">
              <img src={LOGO_URL} alt="BITVERSE" className="w-16 h-16 object-contain block" />
            </span>
            <span className="font-display text-2xl font-bold tracking-wider">
              BIT<span className="text-[#00E5D4]">VERSE</span>
            </span>
          </div>
          <p className="mt-4 text-sm text-[#B0B8C5] max-w-md leading-relaxed">
            A student-driven digital notes library exclusively for First Year students of
            Birla Institute of Technology, Mesra. Notes, PYQs, syllabi, tutorials and
            subject-wise books — all in one beautiful place.
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
            <li><Link to="/resources" className="hover:text-[#00E5D4]">Books</Link></li>
            <li><Link to="/about" className="hover:text-[#00E5D4]">About</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-xs tracking-[0.2em] uppercase text-[#00E5D4] mb-4">
            Connect
          </h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> yashadesh.13@gmail.com</li>
            <li>BIT Mesra, Ranchi</li>
            <li>
              <a
                href="https://www.linkedin.com/in/adesh-yash-624a87383/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 hover:text-[#00E5D4]"
                data-testid="footer-linkedin"
              >
                <Linkedin className="w-4 h-4" /> Adesh Yash
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-6 text-center text-xs text-white/50 flex flex-col md:flex-row items-center justify-center gap-2 font-mono px-6">
        <span className="flex items-center gap-2">
          Built with <Heart className="w-3.5 h-3.5 text-[#00E5D4] fill-[#00E5D4]" /> for BIT Mesra Students
        </span>
        <span className="hidden md:inline">·</span>
        <span>© {new Date().getFullYear()} BITVERSE · Crafted by Adesh Yash</span>
      </div>
    </footer>
  );
}
