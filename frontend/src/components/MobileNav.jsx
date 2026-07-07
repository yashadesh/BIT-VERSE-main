import { NavLink, useLocation } from "react-router-dom";

const tabs = [
  { to: "/", label: "Home", emoji: "🏠", test: "mobile-nav-home" },
  { to: "/notes", label: "Notes", emoji: "📚", test: "mobile-nav-notes" },
  { to: "/pyqs", label: "PYQs", emoji: "📄", test: "mobile-nav-pyqs" },
  { to: "/syllabus", label: "Syllabus", emoji: "📖", test: "mobile-nav-syllabus" },
  { to: "/resources", label: "Books", emoji: "📕", test: "mobile-nav-resources" },
];

export default function MobileNav() {
  const loc = useLocation();
  if (loc.pathname.startsWith("/viewer")) return null;
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden glass pb-safe pt-2 px-2 flex justify-between border-t border-white/10"
      style={{ backdropFilter: "blur(24px)" }}
      data-testid="mobile-bottom-nav"
    >
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.to === "/"}
          data-testid={t.test}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl transition-all ${
              isActive
                ? "text-[#00E5D4]"
                : "text-white/60"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`text-xl ${isActive ? "drop-shadow-[0_0_10px_rgba(0,229,212,0.7)]" : ""}`}>
                {t.emoji}
              </span>
              <span className="text-[10px] font-medium tracking-wider uppercase font-mono">
                {t.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
