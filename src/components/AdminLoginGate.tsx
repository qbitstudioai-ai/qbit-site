import { useEffect, useState, type FormEvent } from "react";
import { AdminPanel } from "./AdminPanel";
import {
  isAdminSession,
  setAdminSession,
  verifyAdminCredentials,
} from "../siteSettings/adminAuth";

export function AdminLoginGate() {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    meta.setAttribute("data-qbit-admin", "");
    document.head.appendChild(meta);
    return () => {
      meta.remove();
    };
  }, []);

  const [authed, setAuthed] = useState(() => isAdminSession());
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (verifyAdminCredentials(login, password)) {
      setAdminSession();
      setAuthed(true);
      setPassword("");
      return;
    }
    setError("Неверный логин или пароль.");
  }

  if (authed) {
    return <AdminPanel />;
  }

  return (
    <div className="admin-page admin-login">
      <header className="admin-page__head">
        <h1 className="admin-page__title">Вход в админ-панель</h1>
        <a className="admin-page__back" href="#/">
          ← На сайт
        </a>
      </header>

      <form className="admin-card admin-login__form" onSubmit={handleSubmit} noValidate>
        <p className="admin-login__warn">
          Авторизация выполняется в браузере. Не используйте тот же пароль на других сервисах.
        </p>
        <label className="admin-field">
          <span className="admin-label">Логин</span>
          <input
            className="admin-input"
            type="text"
            name="login"
            autoComplete="username"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            required
          />
        </label>
        <label className="admin-field">
          <span className="admin-label">Пароль</span>
          <input
            className="admin-input"
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error ? <p className="admin-login__error">{error}</p> : null}
        <button type="submit" className="admin-btn admin-btn--primary admin-login__submit">
          Войти
        </button>
      </form>
    </div>
  );
}
