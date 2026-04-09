import { useEffect, useState } from "react";
import type { SiteCopy } from "../siteContent/defaultSiteCopy";
import { buildSiteCopyFieldGroups, getAtPath, setAtPath } from "../siteContent/siteCopyPaths";
import { useSiteSettings } from "../siteSettings/SiteSettingsContext";

export function AdminSiteTextsSection() {
  const { siteCopy, siteCopyRevision, saveSiteCopyDraft, usesServerAssets } = useSiteSettings();
  const [draft, setDraft] = useState<SiteCopy>(() => structuredClone(siteCopy));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setDraft(structuredClone(siteCopy));
  }, [siteCopy, siteCopyRevision]);

  const groups = buildSiteCopyFieldGroups();

  async function handleSave() {
    setErr("");
    setSaving(true);
    try {
      await saveSiteCopyDraft(draft);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-card admin-card--wide">
      <h2 className="admin-card__title">Тексты сайта</h2>
      <p className="admin-hint">
        {usesServerAssets ? (
          <>
            Сохранение уходит в Supabase; тексты видят все посетители. На сервере должна быть задеплоена Edge
            Function <code>save-site-copy</code> (тот же пароль, что у <code>upload-site-asset</code>).
          </>
        ) : (
          <>Без Supabase тексты хранятся только в этом браузере (localStorage).</>
        )}
      </p>
      {groups.map((g) => (
        <details key={g.title} className="admin-copy-group">
          <summary className="admin-copy-group__title">{g.title}</summary>
          <div className="admin-copy-group__fields">
            {g.fields.map((f) => (
              <label key={f.path} className="admin-field">
                <span className="admin-label">{f.label}</span>
                <textarea
                  className="admin-input admin-textarea"
                  rows={f.rows ?? 2}
                  value={getAtPath(draft, f.path)}
                  onChange={(e) => setDraft((d) => setAtPath(d, f.path, e.target.value))}
                />
              </label>
            ))}
          </div>
        </details>
      ))}
      {err ? <p className="admin-login__error">{err}</p> : null}
      <button
        type="button"
        className="admin-btn admin-btn--primary"
        onClick={() => void handleSave()}
        disabled={saving}
      >
        {saving ? "Сохранение…" : "Сохранить тексты"}
      </button>
      {saved ? <span className="admin-saved"> Сохранено</span> : null}
    </section>
  );
}
