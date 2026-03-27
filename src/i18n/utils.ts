import { ui, defaultLang, languages } from './ui';

export type Lang = keyof typeof ui;

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as Lang;
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]): string {
    return ui[lang][key] || ui[defaultLang][key];
  };
}

export function getLocalizedPath(lang: Lang, path: string): string {
  if (lang === defaultLang) return path;
  return `/${lang}${path}`;
}

export function getAlternateLangs(currentPath: string, currentLang: Lang) {
  return Object.keys(languages).map((lang) => {
    const l = lang as Lang;
    // Strip current lang prefix if present
    let basePath = currentPath;
    if (currentLang !== defaultLang) {
      basePath = currentPath.replace(`/${currentLang}`, '') || '/';
    }
    return {
      lang: l,
      label: languages[l],
      href: getLocalizedPath(l, basePath),
      active: l === currentLang,
    };
  });
}
