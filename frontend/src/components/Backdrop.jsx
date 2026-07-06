import { useEffect, useRef } from "react";

/* Background layers: aurora + starfield + floating triangles + grid + mouse spotlight */
export default function Backdrop() {
  const spotRef = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      if (!spotRef.current) return;
      spotRef.current.style.background = `radial-gradient(400px circle at ${e.clientX}px ${e.clientY}px, rgba(0,229,212,0.10), transparent 60%)`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const stars = Array.from({ length: 90 });
  const tris = Array.from({ length: 14 });

  return (
    <>
      <div className="fixed inset-0 z-0 grid-pattern opacity-40 pointer-events-none" />
      <div className="fixed inset-0 z-0 aurora pointer-events-none" />
      <div className="starfield" aria-hidden="true">
        {stars.map((_, i) => (
          <span
            key={i}
            className="star animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              animationDelay: `${Math.random() * 4}s`,
              opacity: 0.15 + Math.random() * 0.6,
            }}
          />
        ))}
        {tris.map((_, i) => (
          <span
            key={`t-${i}`}
            className="tri"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `-20px`,
              animation: `float-up ${18 + Math.random() * 22}s linear infinite`,
              animationDelay: `${Math.random() * 20}s`,
              opacity: 0.4 + Math.random() * 0.4,
              transform: `scale(${0.6 + Math.random() * 1.2})`,
            }}
          />
        ))}
      </div>
      <div
        ref={spotRef}
        className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden="true"
      />
    </>
  );
}
