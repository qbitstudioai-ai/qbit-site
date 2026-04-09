/**
 * Логин и пароль задаются в корневом `.env`: VITE_ADMIN_LOGIN, VITE_ADMIN_PASSWORD
 * (см. `.env.example`). В собранном фронте значения всё равно попадут в JS — для
 * серьёзной защиты нужен сервер.
 */
const rawLogin = import.meta.env.VITE_ADMIN_LOGIN;
const rawPassword = import.meta.env.VITE_ADMIN_PASSWORD;

export const ADMIN_LOGIN = typeof rawLogin === "string" ? rawLogin.trim() : "";

export const ADMIN_PASSWORD = typeof rawPassword === "string" ? rawPassword : "";

export const ADMIN_SESSION_KEY = "qbit_admin_ok";

export function isAdminSession(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAdminSession(): void {
  try {
    sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function clearAdminSession(): void {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function verifyAdminCredentials(login: string, password: string): boolean {
  if (!ADMIN_LOGIN || !ADMIN_PASSWORD) return false;
  return login.trim() === ADMIN_LOGIN && password === ADMIN_PASSWORD;
}
