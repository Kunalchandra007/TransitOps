import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatedNumber } from "../components/AnimatedNumber";

function SignatureVisual() {
  return (
    <div className="relative w-full h-48 mt-12 mb-8 overflow-hidden rounded-xl border border-hairline bg-bg-panel-alt flex items-center justify-center">
      {/* Subtle Grid Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(var(--hairline) 1px, transparent 1px), linear-gradient(90deg, var(--hairline) 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}
      />
      {/* SVG Animated Route connecting depot dots */}
      <svg className="absolute w-full h-full max-w-2xl px-10" viewBox="0 0 600 100" preserveAspectRatio="xMidYMid meet">
        {/* Route Line */}
        <path
          d="M 50,50 L 150,20 L 300,80 L 450,40 L 550,50"
          fill="none"
          stroke="var(--ink-low)"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        {/* Animated active path overlay */}
        <path
          d="M 50,50 L 150,20 L 300,80 L 450,40 L 550,50"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeDasharray="600"
          strokeDashoffset="600"
          style={{ animation: 'dash 3s ease-in-out forwards infinite' }}
        />
        
        {/* Depot Dots */}
        <circle cx="50" cy="50" r="5" fill="var(--ink-hi)" />
        <circle cx="150" cy="20" r="5" fill="var(--ink-mid)" />
        <circle cx="300" cy="80" r="5" fill="var(--ink-mid)" />
        <circle cx="450" cy="40" r="5" fill="var(--ink-hi)" />
        
        {/* Live Truck Indicator */}
        <circle cx="550" cy="50" r="8" fill="var(--status-warn)" className="animate-pulse-live" />
        
        <style>{`
          @keyframes dash {
            to { stroke-dashoffset: 0; }
          }
        `}</style>
      </svg>
    </div>
  );
}

function LiveStatStrip() {
  const [kpis, setKpis] = useState<any>(null);

  useEffect(() => {
    // Initial realistic mock data for the landing page
    setKpis({
      utilization_pct: 92,
      active_conflicts: 1,
      in_shop: 2
    });

    // Simulate live updates every few seconds
    const interval = setInterval(() => {
      setKpis((prev: any) => ({
        utilization_pct: Math.min(100, Math.max(85, prev.utilization_pct + (Math.random() > 0.5 ? 1 : -1))),
        active_conflicts: Math.random() > 0.7 ? (prev.active_conflicts === 0 ? 1 : 0) : prev.active_conflicts,
        in_shop: 2
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const utilPct = kpis ? kpis.utilization_pct : 0;
  const utilDot = utilPct > 80 ? 'var(--status-good)' : utilPct > 50 ? 'var(--status-warn)' : 'var(--status-bad)';

  const activeConflicts = kpis?.active_conflicts ?? 0;
  const conflictDot = activeConflicts === 0 ? 'var(--status-good)' : activeConflicts < 3 ? 'var(--status-warn)' : 'var(--status-bad)';

  const inShop = kpis?.in_shop ?? 0;
  const shopDot = inShop === 0 ? 'var(--status-good)' : inShop < 2 ? 'var(--status-warn)' : 'var(--status-bad)';

  const stats = [
    { label: "FLEET UTILIZATION", value: kpis ? `${utilPct}%` : '--', dot: utilDot },
    { label: "ACTIVE CONFLICTS", value: kpis ? activeConflicts : '--', dot: conflictDot },
    { label: "VEHICLES IN SHOP", value: kpis ? inShop : '--', dot: shopDot },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 border-t border-hairline mt-16">
      {stats.map((s, i) => (
        <div key={i} className="p-8 border-b md:border-b-0 md:border-r border-hairline last:border-r-0 last:border-b-0 flex flex-col justify-center items-center text-center bg-bg-panel transition-colors hover:bg-bg-panel-alt">
          <div className="flex items-center gap-2 font-mono text-xs tracking-wider text-ink-low uppercase mb-4">
            <span className="w-2 h-2 rounded-full" style={{ background: s.dot }} />
            {s.label}
          </div>
          <AnimatedNumber value={s.value} className="font-mono text-4xl text-ink-hi tracking-tight" />
        </div>
      ))}
    </div>
  );
}

export default function Landing() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-bg-deep text-ink-mid min-h-screen font-body selection:bg-accent-dim selection:text-accent">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-6 border-b border-hairline bg-bg-panel">
        <div className="flex items-center gap-2 font-display tracking-widest text-lg text-ink-hi uppercase">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse-live" />
          TransitOps
        </div>
        <Link to="/demo" className="font-body text-sm font-semibold bg-accent text-bg-deep rounded-full px-5 py-2 hover:opacity-90 transition-opacity">
          Launch Demo
        </Link>
      </nav>

      {/* Hero */}
      <section className="px-6 md:px-10 pt-20 pb-8 reveal max-w-5xl mx-auto text-center">
        <h1 className="font-display uppercase leading-tight text-5xl md:text-7xl tracking-wide text-ink-hi">
          COMMAND THE NIGHT.<br/>PREDICT THE <span className="text-accent">INVISIBLE</span>.
        </h1>
        <p className="mt-6 font-body text-lg text-ink-mid max-w-2xl mx-auto leading-relaxed">
          The premium logistics operations center. Real-time fleet visibility, predictive conflict detection, and smart dispatch for modern freight networks.
        </p>
        
        <div className="mt-10">
          <Link to="/demo" className="inline-block font-body font-semibold text-lg bg-accent text-bg-deep rounded-full px-8 py-3 hover:opacity-90 transition-all shadow-[0_0_15px_rgba(255,107,74,0.3)] hover:shadow-[0_0_25px_rgba(255,107,74,0.5)]">
            Launch Operations Console
          </Link>
        </div>

        {/* Signature Visual Moment */}
        <SignatureVisual />
      </section>

      {/* Live stat strip */}
      <div className="reveal">
        <LiveStatStrip />
      </div>
    </div>
  );
}
