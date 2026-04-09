import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { buildDefaultSiteCopy, type SiteCopy } from "../siteContent/defaultSiteCopy";
import { deepMergeSiteCopy, diffSiteCopyPayload } from "../siteContent/siteCopyMerge";
import { loadLocalSiteCopyPayload, saveLocalSiteCopyPayload } from "../siteContent/siteCopyStorage";
import { links, presentation } from "../content";
import { getSupabaseClient } from "../lib/supabaseClient";
import {
  bustUrl,
  callDeleteSiteAsset,
  callUploadSiteAsset,
  fetchSiteAssetRows,
  publicStorageObjectUrl,
  type SiteAssetRow,
} from "../lib/siteAssetRemote";
import { callSaveSiteCopy, fetchSiteCopyPayloadFromDb } from "../lib/siteCopyRemote";
import {
  IDB_PRESENTATION,
  IDB_PRIVACY,
  type SiteContacts,
  type StoredSiteConfig,
  loadStoredConfig,
  mergeContacts,
  saveStoredConfig,
} from "./configStorage";
import { idbFileDelete, idbFileGet, idbFileSet } from "./idbFiles";

export type SiteSettingsContextValue = {
  ready: boolean;
  presentationEnabled: boolean;
  setPresentationEnabled: (v: boolean) => void;
  chatEnabled: boolean;
  setChatEnabled: (v: boolean) => void;
  privacyPolicyLinkEnabled: boolean;
  setPrivacyPolicyLinkEnabled: (v: boolean) => void;
  presentationHref: string;
  presentationDownloadName: string;
  privacyPolicyHref: string;
  resolvedContacts: SiteContacts;
  updateContacts: (next: Partial<SiteContacts>) => void;
  uploadPresentation: (file: File) => Promise<void>;
  clearPresentationUpload: () => Promise<void>;
  uploadPrivacyPolicy: (file: File) => Promise<void>;
  clearPrivacyUpload: () => Promise<void>;
  stored: StoredSiteConfig;
  /** true — ссылки на файлы из Supabase Storage (общие для всех посетителей) */
  usesServerAssets: boolean;
  /** Тексты страницы (мердж дефолтов и сохранённых правок) */
  siteCopy: SiteCopy;
  /** Увеличивается после загрузки/сохранения текстов — для сброса черновика в админке */
  siteCopyRevision: number;
  saveSiteCopyDraft: (draft: SiteCopy) => Promise<void>;
};

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

function revokeIfBlobUrl(url: string | null) {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [stored, setStored] = useState<StoredSiteConfig>(() => loadStoredConfig());
  const [presentationBlobUrl, setPresentationBlobUrl] = useState<string | null>(null);
  const [privacyBlobUrl, setPrivacyBlobUrl] = useState<string | null>(null);
  const [assetRows, setAssetRows] = useState<SiteAssetRow[]>([]);
  const [siteCopy, setSiteCopy] = useState<SiteCopy>(() => buildDefaultSiteCopy());
  const [siteCopyRevision, setSiteCopyRevision] = useState(0);

  const presUrlRef = useRef<string | null>(null);
  const privUrlRef = useRef<string | null>(null);

  const usesServerAssets = Boolean(getSupabaseClient());
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";

  const refreshAssetRows = useCallback(async () => {
    if (!usesServerAssets) return;
    const rows = await fetchSiteAssetRows();
    setAssetRows(rows);
  }, [usesServerAssets]);

  const persist = useCallback((updater: (prev: StoredSiteConfig) => StoredSiteConfig) => {
    setStored((prev) => {
      const next = updater(prev);
      saveStoredConfig(next);
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (usesServerAssets) {
        await refreshAssetRows();
        if (!cancelled) setReady(true);
        return;
      }
      const [pBlob, yBlob] = await Promise.all([
        idbFileGet(IDB_PRESENTATION),
        idbFileGet(IDB_PRIVACY),
      ]);
      if (cancelled) return;
      if (pBlob) {
        const u = URL.createObjectURL(pBlob);
        presUrlRef.current = u;
        setPresentationBlobUrl(u);
      }
      if (yBlob) {
        const u = URL.createObjectURL(yBlob);
        privUrlRef.current = u;
        setPrivacyBlobUrl(u);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [usesServerAssets, refreshAssetRows]);

  useEffect(() => {
    let cancelled = false;
    const defaults = buildDefaultSiteCopy();
    void (async () => {
      if (usesServerAssets) {
        const remote = await fetchSiteCopyPayloadFromDb();
        if (cancelled) return;
        setSiteCopy(deepMergeSiteCopy(defaults, remote ?? {}));
      } else {
        if (cancelled) return;
        setSiteCopy(deepMergeSiteCopy(defaults, loadLocalSiteCopyPayload()));
      }
      if (!cancelled) setSiteCopyRevision((n) => n + 1);
    })();
    return () => {
      cancelled = true;
    };
  }, [usesServerAssets]);

  const saveSiteCopyDraft = useCallback(
    async (draft: SiteCopy) => {
      const defaults = buildDefaultSiteCopy();
      const payload = diffSiteCopyPayload(defaults, draft);
      if (usesServerAssets) {
        await callSaveSiteCopy(payload);
      } else {
        saveLocalSiteCopyPayload(payload);
      }
      setSiteCopy(structuredClone(draft));
      setSiteCopyRevision((n) => n + 1);
    },
    [usesServerAssets],
  );

  useEffect(() => {
    return () => {
      revokeIfBlobUrl(presUrlRef.current);
      revokeIfBlobUrl(privUrlRef.current);
    };
  }, []);

  const setPresentationEnabled = useCallback((v: boolean) => {
    persist((prev) => ({ ...prev, presentationEnabled: v }));
  }, [persist]);

  const setChatEnabled = useCallback((v: boolean) => {
    persist((prev) => ({ ...prev, chatEnabled: v }));
  }, [persist]);

  const setPrivacyPolicyLinkEnabled = useCallback((v: boolean) => {
    persist((prev) => ({ ...prev, privacyPolicyLinkEnabled: v }));
  }, [persist]);

  const updateContacts = useCallback(
    (patch: Partial<SiteContacts>) => {
      persist((prev) => {
        const merged = mergeContacts({ ...prev.contacts, ...patch });
        return {
          ...prev,
          contacts: {
            telegram: merged.telegram,
            vk: merged.vk,
            phone: merged.phone,
            phoneDisplay: merged.phoneDisplay,
            email: merged.email,
            emailDisplay: merged.emailDisplay,
            telegramDisplay: merged.telegramDisplay,
            vkDisplay: merged.vkDisplay,
          },
        };
      });
    },
    [persist],
  );

  const uploadPresentation = useCallback(
    async (file: File) => {
      if (usesServerAssets) {
        await callUploadSiteAsset(file, "presentation");
        await refreshAssetRows();
        persist((prev) => ({
          ...prev,
          presentationFileName: file.name,
        }));
        return;
      }
      revokeIfBlobUrl(presUrlRef.current);
      const u = URL.createObjectURL(file);
      presUrlRef.current = u;
      setPresentationBlobUrl(u);
      await idbFileSet(IDB_PRESENTATION, file);
      persist((prev) => ({
        ...prev,
        presentationFileName: file.name,
      }));
    },
    [usesServerAssets, refreshAssetRows, persist],
  );

  const clearPresentationUpload = useCallback(async () => {
    if (usesServerAssets) {
      await callDeleteSiteAsset("presentation");
      await refreshAssetRows();
      persist((prev) => {
        const next = { ...prev };
        delete next.presentationFileName;
        return next;
      });
      return;
    }
    revokeIfBlobUrl(presUrlRef.current);
    presUrlRef.current = null;
    setPresentationBlobUrl(null);
    await idbFileDelete(IDB_PRESENTATION);
    persist((prev) => {
      const next = { ...prev };
      delete next.presentationFileName;
      return next;
    });
  }, [usesServerAssets, refreshAssetRows, persist]);

  const uploadPrivacyPolicy = useCallback(
    async (file: File) => {
      if (usesServerAssets) {
        await callUploadSiteAsset(file, "privacy_policy");
        await refreshAssetRows();
        persist((prev) => ({
          ...prev,
          privacyPolicyFileName: file.name,
        }));
        return;
      }
      revokeIfBlobUrl(privUrlRef.current);
      const u = URL.createObjectURL(file);
      privUrlRef.current = u;
      setPrivacyBlobUrl(u);
      await idbFileSet(IDB_PRIVACY, file);
      persist((prev) => ({
        ...prev,
        privacyPolicyFileName: file.name,
      }));
    },
    [usesServerAssets, refreshAssetRows, persist],
  );

  const clearPrivacyUpload = useCallback(async () => {
    if (usesServerAssets) {
      await callDeleteSiteAsset("privacy_policy");
      await refreshAssetRows();
      persist((prev) => {
        const next = { ...prev };
        delete next.privacyPolicyFileName;
        return next;
      });
      return;
    }
    revokeIfBlobUrl(privUrlRef.current);
    privUrlRef.current = null;
    setPrivacyBlobUrl(null);
    await idbFileDelete(IDB_PRIVACY);
    persist((prev) => {
      const next = { ...prev };
      delete next.privacyPolicyFileName;
      return next;
    });
  }, [usesServerAssets, refreshAssetRows, persist]);

  const resolvedContacts = useMemo(() => mergeContacts(stored.contacts), [stored.contacts]);

  const presentationHref = useMemo(() => {
    if (usesServerAssets && supabaseUrl) {
      const row = assetRows.find((r) => r.asset_key === "presentation");
      if (row?.storage_path) {
        return bustUrl(publicStorageObjectUrl(supabaseUrl, row.storage_path), row.updated_at);
      }
      return presentation.fileUrl;
    }
    return presentationBlobUrl ?? presentation.fileUrl;
  }, [usesServerAssets, supabaseUrl, assetRows, presentationBlobUrl]);

  const presentationDownloadName = stored.presentationFileName ?? "presentation.pdf";

  const privacyPolicyHref = useMemo(() => {
    if (usesServerAssets && supabaseUrl) {
      const row = assetRows.find((r) => r.asset_key === "privacy_policy");
      if (row?.storage_path) {
        return bustUrl(publicStorageObjectUrl(supabaseUrl, row.storage_path), row.updated_at);
      }
      return links.privacyPolicy;
    }
    return privacyBlobUrl ?? links.privacyPolicy;
  }, [usesServerAssets, supabaseUrl, assetRows, privacyBlobUrl]);

  const value = useMemo<SiteSettingsContextValue>(
    () => ({
      ready,
      presentationEnabled: stored.presentationEnabled,
      setPresentationEnabled,
      chatEnabled: stored.chatEnabled,
      setChatEnabled,
      privacyPolicyLinkEnabled: stored.privacyPolicyLinkEnabled,
      setPrivacyPolicyLinkEnabled,
      presentationHref,
      presentationDownloadName,
      privacyPolicyHref,
      resolvedContacts,
      updateContacts,
      uploadPresentation,
      clearPresentationUpload,
      uploadPrivacyPolicy,
      clearPrivacyUpload,
      stored,
      usesServerAssets,
      siteCopy,
      siteCopyRevision,
      saveSiteCopyDraft,
    }),
    [
      ready,
      stored,
      setPresentationEnabled,
      setChatEnabled,
      setPrivacyPolicyLinkEnabled,
      presentationHref,
      presentationDownloadName,
      privacyPolicyHref,
      resolvedContacts,
      updateContacts,
      uploadPresentation,
      clearPresentationUpload,
      uploadPrivacyPolicy,
      clearPrivacyUpload,
      usesServerAssets,
      siteCopy,
      siteCopyRevision,
      saveSiteCopyDraft,
    ],
  );

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

/** Хук рядом с Provider — разделение файла даёт мало выгоды для этого модуля */
// eslint-disable-next-line react-refresh/only-export-components -- useSiteSettings экспортируется вместе с Provider
export function useSiteSettings(): SiteSettingsContextValue {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) {
    throw new Error("useSiteSettings must be used within SiteSettingsProvider");
  }
  return ctx;
}
