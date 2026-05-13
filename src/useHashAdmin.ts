import { useEffect, useState } from "react";

/** Должен совпадать с логикой в `App` / `main` (прямой заход на #/admin). */
export function isAdminHash(): boolean {
  const raw = window.location.hash.replace(/^#/, "").replace(/^\/+/, "");
  return raw === "admin";
}

export function useHashAdmin() {
  const [isAdmin, setIsAdmin] = useState(isAdminHash);
  useEffect(() => {
    const onHash = () => setIsAdmin(isAdminHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return isAdmin;
}
