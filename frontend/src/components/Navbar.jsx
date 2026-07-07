import { NavLink, Link, useLocation } from "react-router-dom";
import { LOGO_URL } from "@/lib/api";
import { Shield } from "lucide-react";

const links = [
  { to: "/", label: "Home" },
  { to: "/notes", label: "Notes" },
  { to: "/pyqs", label: "PYQs" },
  { to: "/syllabus", label: "Syllabus" },
  { to: "/resources", label: "Books" },
  { to: "/about", label: "About" },
];

export default function Navbar() {
  const loc = useLocation();
  if (loc.pathname.startsWith("/viewer")) return null;
  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 hidden md:block"
      data-testid="navbar"
    >
      <div className="mx-auto mt-4 max-w-6xl px-6">
        <nav className="glass rounded-2xl px-5 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group" data-testid="nav-logo">
            <span className="logo-frame">
              <img
                src={LOGO_URL}
                alt="BITVERSE"
                className="w-11 h-11 object-contain block"
              />
            </span>
            <span className="font-display text-lg font-bold tracking-wider">
              BIT<span className="text-[#00E5D4]">VERSE</span>
            </span>
          </Link>
          <ul className="flex items-center gap-1">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.to === "/"}
                  data-testid={`nav-${l.label.toLowerCase()}`}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-xl text-sm font-medium tracking-wide transition-all ${
                      isActive
                        ? "text-[#00E5D4] bg-[#00E5D4]/10"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <Link
            to="/admin"
            className="btn-neon"
            data-testid="nav-admin-link"
            style={{ padding: "0.55rem 1.1rem", fontSize: "0.75rem" }}
          >
            <Shield className="w-4 h-4" /> Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
