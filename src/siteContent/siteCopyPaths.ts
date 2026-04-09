import type { SiteCopy } from "./defaultSiteCopy";

export type SiteCopyField = { path: string; label: string; rows?: number };

export type SiteCopyFieldGroup = { title: string; fields: SiteCopyField[] };

function tf(path: string, label: string, rows?: number): SiteCopyField {
  return rows ? { path, label, rows } : { path, label };
}

/** Поля формы админки (пути в дереве SiteCopy). */
export function buildSiteCopyFieldGroups(): SiteCopyFieldGroup[] {
  const groups: SiteCopyFieldGroup[] = [
    {
      title: "Доступность",
      fields: [tf("a11y.skipToMain", "Ссылка «к основному содержимому»")],
    },
    {
      title: "SEO и бренд",
      fields: [
        tf("siteSeo.title", "Title (вкладка браузера)", 2),
        tf("siteSeo.description", "Meta description", 4),
        tf("siteSeo.brandName", "Короткое имя бренда"),
      ],
    },
    {
      title: "Cookie-баннер",
      fields: [
        tf("cookieConsent.textBefore", "Текст до ссылки на политику", 3),
        tf("cookieConsent.privacyPolicyLabel", "Подпись ссылки"),
        tf("cookieConsent.textAfter", "Текст после ссылки"),
        tf("cookieConsent.textWithoutPolicyLink", "Текст, если ссылка отключена", 3),
        tf("cookieConsent.acceptLabel", "Кнопка «Принять»"),
      ],
    },
    {
      title: "Чат с ИИ",
      fields: [
        tf("aiChat.title", "Заголовок окна"),
        tf("aiChat.welcome", "Приветствие", 6),
        tf("aiChat.inputPlaceholder", "Плейсхолдер поля ввода"),
        tf("aiChat.sendLabel", "Кнопка отправки"),
        tf("aiChat.openLabel", "Подпись «открыть чат»"),
        tf("aiChat.closeLabel", "Подпись «закрыть»"),
      ],
    },
    {
      title: "Шапка — меню",
      fields: [0, 1, 2, 3].map((i) => tf(`headerNav.${i}.label`, `Пункт меню ${i + 1}`)),
    },
    {
      title: "Подвал — навигация",
      fields: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => tf(`nav.${i}.label`, `Ссылка ${i + 1}`)),
    },
    {
      title: "Презентация (кнопка)",
      fields: [tf("presentation.label", "Текст кнопки")],
    },
    {
      title: "Герой",
      fields: [
        tf("hero.kicker", "Строка над заголовком"),
        tf("hero.title", "Заголовок", 2),
        tf("hero.subtitle", "Подзаголовок", 5),
        tf("hero.trustLine", "Доверительная строка", 3),
        tf("hero.ctaTelegramLabel", "Кнопка Telegram"),
        tf("hero.ctaPresentationLabel", "Кнопка презентации / сценариев"),
        tf("hero.dashboardImageAlt", "Описание картинки (alt)", 3),
        tf("telegramDirectHref", "Ссылка Telegram (герой / CTA)"),
      ],
    },
    {
      title: "Блок «Проблемы»",
      fields: [
        tf("pain.titleLine1", "Заголовок, строка 1"),
        tf("pain.titleLine2", "Заголовок, строка 2"),
        tf("pain.intro", "Вступление", 5),
        ...[0, 1, 2, 3].flatMap((i) => [
          tf(`pain.cards.${i}.title`, `Карточка ${i + 1} — заголовок`, 2),
          tf(`pain.cards.${i}.text`, `Карточка ${i + 1} — текст`, 5),
        ]),
      ],
    },
    {
      title: "Картотека — заголовок секции",
      fields: [
        tf("archiveSection.title", "Заголовок", 2),
        tf("archiveSection.subtitle", "Подзаголовок"),
      ],
    },
  ];

  for (let s = 0; s < 6; s++) {
    groups.push({
      title: `Картотека — сценарий ${s + 1}`,
      fields: [
        tf(`scenarios.${s}.title`, "Заголовок вкладки", 2),
        ...([0, 1, 2] as const).flatMap((f) => [
          tf(`scenarios.${s}.files.${f}.label`, `Файл ${f + 1} — подпись`),
          tf(`scenarios.${s}.files.${f}.body`, `Файл ${f + 1} — текст (печать)`, 8),
        ]),
      ],
    });
  }

  groups.push(
    {
      title: "Соцсети",
      fields: [
        tf("social.title", "Заголовок", 2),
        tf("social.text", "Текст", 6),
        tf("social.telegramLabel", "Кнопка Telegram"),
        tf("social.vkLabel", "Кнопка ВК"),
        tf("social.cardsHint", "Подпись под кнопками (обе карточки)", 2),
      ],
    },
    {
      title: "Результаты",
      fields: [
        tf("businessResults.title", "Заголовок", 2),
        tf("businessResults.intro", "Вступление", 5),
        ...[0, 1, 2, 3, 4, 5, 6].flatMap((i) => [
          tf(`businessResults.items.${i}.title`, `Карточка ${i + 1} — заголовок`, 2),
          tf(`businessResults.items.${i}.text`, `Карточка ${i + 1} — текст`, 5),
        ]),
      ],
    },
    {
      title: "Направления",
      fields: [
        tf("directions.title", "Заголовок", 2),
        tf("directions.subtitle", "Подзаголовок", 4),
        ...[0, 1, 2, 3, 4, 5, 6, 7].flatMap((i) => [
          tf(`directions.items.${i}.title`, `Пункт ${i + 1} — заголовок`, 2),
          tf(`directions.items.${i}.text`, `Пункт ${i + 1} — текст`, 5),
        ]),
      ],
    },
    {
      title: "Подход",
      fields: [
        tf("approach.title", "Заголовок", 2),
        tf("approach.subtitle", "Подзаголовок", 4),
        ...[0, 1, 2, 3, 4, 5].flatMap((i) => [
          tf(`approach.steps.${i}.title`, `Шаг ${i + 1} — заголовок`, 2),
          tf(`approach.steps.${i}.text`, `Шаг ${i + 1} — текст`, 4),
        ]),
      ],
    },
    {
      title: "Почему мы",
      fields: [
        tf("whyQbit.title", "Заголовок", 2),
        tf("whyQbit.intro", "Вступление", 4),
        ...[0, 1, 2, 3].flatMap((i) => [
          tf(`whyQbit.items.${i}.title`, `Пункт ${i + 1} — заголовок`, 2),
          tf(`whyQbit.items.${i}.text`, `Пункт ${i + 1} — текст`, 4),
        ]),
      ],
    },
    {
      title: "FAQ",
      fields: [
        tf("faq.title", "Заголовок секции"),
        tf("faq.questionIconSrc", "Путь к иконке вопроса (/…webp)"),
        tf("faq.answerIconSrc", "Путь к иконке ответа (/…webp)"),
        ...[0, 1, 2, 3, 4, 5].flatMap((i) => [
          tf(`faq.items.${i}.q`, `Вопрос ${i + 1}`, 2),
          tf(`faq.items.${i}.a`, `Ответ ${i + 1}`, 6),
        ]),
      ],
    },
    {
      title: "Финальный CTA",
      fields: [
        tf("finalCta.title", "Заголовок", 2),
        tf("finalCta.intro", "Текст", 4),
        tf("finalCta.cards.0.label", "Карточка 1 — подпись"),
        tf("finalCta.cards.0.href", "Карточка 1 — ссылка"),
        tf("finalCta.cards.1.label", "Карточка 2 — подпись"),
        tf("finalCta.cards.1.href", "Карточка 2 — ссылка"),
      ],
    },
    {
      title: "Контакты (заголовки блока)",
      fields: [
        tf("contacts.title", "Заголовок"),
        tf("contacts.subtitle", "Подзаголовок", 3),
        tf("contacts.headingTelegram", "Подпись колонки Telegram"),
        tf("contacts.headingPhone", "Подпись колонки Телефон"),
        tf("contacts.headingVk", "Подпись колонки ВК"),
        tf("contacts.headingEmail", "Подпись колонки Email"),
      ],
    },
    {
      title: "Подвал",
      fields: [
        tf("footer.tagline", "Слоган", 2),
        tf("footer.copyright", "Копирайт", 2),
        tf("footer.sectionsTitle", "Заголовок колонки «Разделы»"),
        tf("footer.contactsColumnTitle", "Заголовок колонки «Контакты»"),
        tf("footer.linkTelegram", "Ссылка Telegram (текст)"),
        tf("footer.linkVk", "Ссылка ВК (текст)"),
      ],
    },
  );

  return groups;
}

export function getAtPath(root: SiteCopy, path: string): string {
  const parts = path.split(".");
  let cur: unknown = root;
  for (const p of parts) {
    if (cur === null || cur === undefined) return "";
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : cur === undefined || cur === null ? "" : String(cur);
}

export function setAtPath(root: SiteCopy, path: string, value: string): SiteCopy {
  const next = structuredClone(root);
  const parts = path.split(".");
  let cur: unknown = next;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    cur = (cur as Record<string, unknown>)[p];
  }
  (cur as Record<string, unknown>)[parts[parts.length - 1]] = value;
  return next;
}
