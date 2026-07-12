import { useEffect, useState } from "react";

export function AnimatedNumber({ value, className }: { value: string | number; className?: string }) {
  const [display, setDisplay] = useState(0);
  const numeric = parseFloat(String(value)) || 0;

  useEffect(() => {
    if (numeric === 0) {
      setDisplay(0);
      return;
    }
    let frame: number;
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutExpo for smoother feeling
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.floor(ease * numeric));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [numeric]);

  if (value === '--' || Number.isNaN(numeric)) {
    return <div className={className}>{value}</div>;
  }

  const suffix = String(value).includes('%') ? '%' : '';
  return <div className={className}>{display}{suffix}</div>;
}
