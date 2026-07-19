import { useEffect, useState } from "react";

export function Toast({ message, type = "info", onClose }: { message: string; type?: "info" | "error" | "success"; onClose?: () => void }) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => { setShow(false); onClose?.(); }, 3200);
    return () => clearTimeout(t);
  }, [onClose]);
  if (!show) return null;
  const bg = type === "error" ? "bg-[color:var(--destructive)] text-white"
    : type === "success" ? "bg-[color:var(--sky)] text-[color:var(--secondary-foreground)]"
    : "bg-white text-[color:var(--foreground)]";
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl shadow-lg border border-[color:var(--border)] ${bg}`}>
      {message}
    </div>
  );
}
