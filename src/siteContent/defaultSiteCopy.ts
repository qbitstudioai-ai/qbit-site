import {
  aiChat,
  archiveSection,
  approach,
  businessResults,
  contacts,
  cookieConsent,
  directions,
  faq,
  finalCta,
  footer,
  headerNav,
  hero,
  nav,
  pain,
  presentation,
  scenarios,
  siteSeo,
  social,
  telegramDirectHref,
  whyQbit,
} from "../content";

/** Все редактируемые тексты/строки (иконки — пути в public). Мерджится с сохранённым JSON. */
export function buildDefaultSiteCopy() {
  return {
    a11y: { skipToMain: "К основному содержимому" },
    siteSeo: { ...siteSeo },
    cookieConsent: { ...cookieConsent },
    aiChat: { ...aiChat },
    headerNav: headerNav.map((x) => ({ ...x })),
    nav: nav.map((x) => ({ ...x })),
    presentation: { ...presentation },
    telegramDirectHref,
    hero: {
      ...hero,
      ctaTelegramLabel: "Написать в Telegram",
      ctaPresentationLabel: "Посмотреть сценарии автоматизации",
      dashboardImageAlt:
        "Панель показателей: рост прибыли, ускорение обработки данных, рентабельность и динамика по месяцам",
    },
    pain: {
      titleLine1: pain.titleLine1,
      titleLine2: pain.titleLine2,
      intro: pain.intro,
      cards: pain.cards.map((c) => ({ title: c.title, text: c.text, iconSrc: c.iconSrc })),
    },
    scenarios: structuredClone(scenarios),
    archiveSection: { ...archiveSection },
    social: {
      ...social,
      cardsHint: "Разборы, примеры, сценарии",
    },
    businessResults: {
      title: businessResults.title,
      intro: businessResults.intro,
      items: businessResults.items.map((i) => ({
        title: i.title,
        text: i.text,
        ...(i.iconSrc ? { iconSrc: i.iconSrc } : {}),
        ...(i.iconSrcRight ? { iconSrcRight: i.iconSrcRight } : {}),
        ...(i.fullWidth !== undefined ? { fullWidth: i.fullWidth } : {}),
      })),
    },
    directions: {
      title: directions.title,
      subtitle: directions.subtitle,
      items: directions.items.map((i) => ({ ...i })),
    },
    approach: {
      title: approach.title,
      subtitle: approach.subtitle,
      steps: approach.steps.map((s) => ({ ...s })),
    },
    whyQbit: {
      title: whyQbit.title,
      intro: whyQbit.intro,
      items: whyQbit.items.map((i) => ({
        title: i.title,
        text: i.text,
        ...(i.iconSrc ? { iconSrc: i.iconSrc } : {}),
      })),
    },
    faq: {
      title: faq.title,
      questionIconSrc: faq.questionIconSrc,
      answerIconSrc: faq.answerIconSrc,
      items: faq.items.map((x) => ({ ...x })),
    },
    finalCta: {
      title: finalCta.title,
      intro: finalCta.intro,
      cards: finalCta.cards.map((c) => ({
        label: c.label,
        href: c.href,
        ...(c.iconSrc ? { iconSrc: c.iconSrc } : {}),
      })),
    },
    contacts: {
      ...contacts,
      headingTelegram: "Telegram",
      headingPhone: "Телефон",
      headingVk: "ВКонтакте",
      headingEmail: "Email",
    },
    footer: {
      ...footer,
      sectionsTitle: "Разделы",
      contactsColumnTitle: "Контакты",
      linkTelegram: "Telegram",
      linkVk: "ВКонтакте",
    },
  };
}

export type SiteCopy = ReturnType<typeof buildDefaultSiteCopy>;
