import { useEffect, useState } from "react";

function parseAdmin(): boolean {
  const raw = window.location.hash.replace(/^#/, "").replace(/^\/+/, "");
  return raw === "admin";
}

export function useHashAdmin() {
  const [isAdmin, setIsAdmin] = useState(parseAdmin);
  useEffect(() => {
    const onHash = () => setIsAdmin(parseAdmin());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return isAdmin;
}
