import { useEffect } from "react";
import { useSiteContent } from "../siteContent/useSiteContent";
import { useSiteSettings } from "../siteSettings/SiteSettingsContext";

function siteBaseUrl() {
  return (import.meta.env.VITE_SITE_URL ?? "https://allqbit.ru").replace(/\/+$/, "");
}

function telephoneE164(telHref: string) {
  return telHref.replace(/^tel:/i, "");
}

/** JSON-LD Organization + WebSite; title страницы из siteCopy */
export function StructuredDataLd() {
  const { siteSeo } = useSiteContent();
  const L = useSiteSettings().resolvedContacts;
  const base = siteBaseUrl();
  const orgId = `${base}/#organization`;
  const websiteId = `${base}/#website`;

  useEffect(() => {
    document.title = siteSeo.title;
  }, [siteSeo.title]);

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: siteSeo.brandName,
        url: `${base}/`,
        description: siteSeo.description,
        logo: `${base}/favicon.svg`,
        email: L.emailDisplay,
        telephone: telephoneE164(L.phone),
        sameAs: [L.telegram, L.vk],
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: `${base}/`,
        name: siteSeo.brandName,
        description: siteSeo.description,
        inLanguage: "ru-RU",
        publisher: { "@id": orgId },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
