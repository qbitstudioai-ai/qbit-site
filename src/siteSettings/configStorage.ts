import { links } from "../content";

export type SiteContacts = {
  telegram: string;
  vk: string;
  phone: string;
  phoneDisplay: string;
  email: string;
  emailDisplay: string;
  telegramDisplay: string;
  vkDisplay: string;
};

export type StoredSiteConfig = {
  presentationEnabled: boolean;
  chatEnabled: boolean;
  privacyPolicyLinkEnabled: boolean;
  /** Сохранённые поля контактов (полный набор после первого сохранения из админки) */
  contacts: Partial<SiteContacts>;
  presentationFileName?: string;
  privacyPolicyFileName?: string;
};

const LS_KEY = "qbit_site_config_v1";

export const IDB_PRESENTATION = "presentation";
export const IDB_PRIVACY = "privacyPolicy";

export function defaultContacts(): SiteContacts {
  return {
    telegram: links.telegram,
    vk: links.vk,
    phone: links.phone,
    phoneDisplay: links.phoneDisplay,
    email: links.email,
    emailDisplay: links.emailDisplay,
    telegramDisplay: links.telegram.replace(/^https?:\/\//i, ""),
    vkDisplay: links.vk.replace(/^https?:\/\//i, ""),
  };
}

export function defaultStoredConfig(): StoredSiteConfig {
  return {
    presentationEnabled: true,
    chatEnabled: true,
    privacyPolicyLinkEnabled: true,
    contacts: {},
  };
}

export function loadStoredConfig(): StoredSiteConfig {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultStoredConfig();
    const parsed = JSON.parse(raw) as Partial<StoredSiteConfig>;
    return {
      presentationEnabled: parsed.presentationEnabled ?? true,
      chatEnabled: parsed.chatEnabled ?? true,
      privacyPolicyLinkEnabled: parsed.privacyPolicyLinkEnabled ?? true,
      contacts: parsed.contacts ?? {},
      presentationFileName: parsed.presentationFileName,
      privacyPolicyFileName: parsed.privacyPolicyFileName,
    };
  } catch {
    return defaultStoredConfig();
  }
}

export function saveStoredConfig(cfg: StoredSiteConfig): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cfg));
  } catch {
    /* quota / private mode */
  }
}

export function mergeContacts(partial: Partial<SiteContacts> | undefined): SiteContacts {
  const d = defaultContacts();
  if (!partial) return d;
  return {
    telegram: partial.telegram ?? d.telegram,
    vk: partial.vk ?? d.vk,
    phone: partial.phone ?? d.phone,
    phoneDisplay: partial.phoneDisplay ?? d.phoneDisplay,
    email: partial.email ?? d.email,
    emailDisplay: partial.emailDisplay ?? d.emailDisplay,
    telegramDisplay: partial.telegramDisplay ?? d.telegramDisplay,
    vkDisplay: partial.vkDisplay ?? d.vkDisplay,
  };
}
