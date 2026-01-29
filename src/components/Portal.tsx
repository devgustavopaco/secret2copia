// components/Portal.tsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [el, setEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const div = document.createElement("div");
    div.id = "modal-root";
    document.body.appendChild(div);
    setEl(div);
    setMounted(true);

    return () => {
      if (div.parentNode) div.parentNode.removeChild(div);
    };
  }, []);

  if (!mounted || !el) return null;
  return createPortal(children, el);
}
