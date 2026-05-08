import { useEffect, useState, ReactNode } from "react";

export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  if (!m) return <>{fallback}</>;
  return <>{children}</>;
}
