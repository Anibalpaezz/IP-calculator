import { useEffect, useState } from "react";
import { LanguageProvider } from "./components/LanguageProvider";
import { useLang, type Lang } from "./i18n";
import { IpCalculator } from "./components/IpCalculator";
import { BaseConverter } from "./components/BaseConverter";
import { SimpleCalculator } from "./components/SimpleCalculator";
import { effectiveSeason, type SeasonMode } from "./lib/seasons";

type Theme = "light" | "dark";
type CalcTab = "ip" | "base" | "sci";

function initialTheme(): Theme {
  const param = new URLSearchParams(window.location.search).get("theme");
  if (param === "light" || param === "dark") return param;
  try {
    const stored = localStorage.getItem("ipcalc-theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* ignore */
  }
  return "light";
}

function initialLang(): Lang {
  const param = new URLSearchParams(window.location.search).get("lang");
  if (param === "es" || param === "en") return param;
  try {
    const stored = localStorage.getItem("ipcalc-lang");
    if (stored === "es" || stored === "en") return stored;
  } catch {
    /* ignore */
  }
  return "es";
}

function initialTab(): CalcTab {
  const param = new URLSearchParams(window.location.search).get("tab");
  if (param === "ip" || param === "base" || param === "sci") return param;
  return "ip";
}

const SEASON_MODES: SeasonMode[] = ["auto", "spring", "summer", "autumn", "winter"];

const TAB_TITLES: Record<CalcTab, Record<Lang, string>> = {
  ip: {
    es: "Calculadora IP Online | Cálculo de Subredes, CIDR y Máscaras",
    en: "IP Calculator Online | Subnet, CIDR and Mask Calculator",
  },
  base: {
    es: "Convertidor de Bases | Calculadora de Binario, Octal y Hexadecimal",
    en: "Base Converter | Binary, Octal and Hexadecimal Calculator",
  },
  sci: {
    es: "Calculadora Online | Calculadora Simple con Logaritmos",
    en: "Online Calculator | Simple Calculator with Logarithms",
  },
};

function tabTitle(tab: CalcTab, lang: Lang): string {
  return TAB_TITLES[tab][lang];
}

function initialSeason(): SeasonMode {
  const param = new URLSearchParams(window.location.search).get("season");
  if ((SEASON_MODES as string[]).includes(param ?? "")) return param as SeasonMode;
  try {
    const stored = localStorage.getItem("ipcalc-season");
    if ((SEASON_MODES as string[]).includes(stored ?? "")) return stored as SeasonMode;
  } catch {
    /* ignore */
  }
  return "auto";
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [lang, setLang] = useState<Lang>(initialLang);
  const [tab, setTab] = useState<CalcTab>(initialTab);
  const [season, setSeason] = useState<SeasonMode>(initialSeason);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("ipcalc-theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.season = effectiveSeason(season);
    try {
      localStorage.setItem("ipcalc-season", season);
    } catch {
      /* ignore */
    }
  }, [season]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = tabTitle(tab, lang);
    try {
      localStorage.setItem("ipcalc-lang", lang);
    } catch {
      /* ignore */
    }
  }, [tab, lang]);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (tab !== "ip") sp.set("tab", tab);
    else sp.delete("tab");
    if (theme) sp.set("theme", theme);
    if (lang) sp.set("lang", lang);
    sp.set("season", season);
    const qs = sp.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [tab, theme, lang, season]);

  return (
    <LanguageProvider lang={lang} onLangChange={setLang}>
      <AppShell
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        lang={lang}
        onLangChange={setLang}
        tab={tab}
        onTabChange={setTab}
        season={season}
        onSeasonChange={setSeason}
      />
    </LanguageProvider>
  );
}

interface AppShellProps {
  theme: Theme;
  onToggleTheme: () => void;
  lang: Lang;
  onLangChange: (l: Lang) => void;
  tab: CalcTab;
  onTabChange: (t: CalcTab) => void;
  season: SeasonMode;
  onSeasonChange: (s: SeasonMode) => void;
}

function AppShell(props: AppShellProps) {
  const { t } = useLang();

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-actions">
          <div className="lang-switch" role="group" aria-label="Language / Idioma">
            <button
              type="button"
              className={props.lang === "es" ? "is-active" : ""}
              onClick={() => props.onLangChange("es")}
            >
              ES
            </button>
            <button
              type="button"
              className={props.lang === "en" ? "is-active" : ""}
              onClick={() => props.onLangChange("en")}
            >
              EN
            </button>
          </div>
          <label className="season-label">
            <select
              className="season-select"
              value={props.season}
              onChange={(e) => props.onSeasonChange(e.target.value as SeasonMode)}
              aria-label={t("season.label") as string}
            >
              <option value="auto">{t("season.auto") as string}</option>
              <option value="spring">{t("season.spring") as string}</option>
              <option value="summer">{t("season.summer") as string}</option>
              <option value="autumn">{t("season.autumn") as string}</option>
              <option value="winter">{t("season.winter") as string}</option>
            </select>
          </label>
          <button type="button" className="theme-toggle" onClick={props.onToggleTheme}>
            {props.theme === "dark" ? t("theme.light") : t("theme.dark")}
          </button>
        </div>
        <h1>{t("app.title")}</h1>
        <p>{t("app.subtitle")}</p>
      </header>

      {/* Calculator tab switcher */}
      <nav className="calc-tabs" role="tablist" aria-label="Calculator type">
        <button
          type="button"
          role="tab"
          aria-selected={props.tab === "ip"}
          className={`calc-tab ${props.tab === "ip" ? "is-active" : ""}`}
          onClick={() => props.onTabChange("ip")}
        >
          {t("tabs.ip")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={props.tab === "base"}
          className={`calc-tab ${props.tab === "base" ? "is-active" : ""}`}
          onClick={() => props.onTabChange("base")}
        >
          {t("tabs.base")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={props.tab === "sci"}
          className={`calc-tab ${props.tab === "sci" ? "is-active" : ""}`}
          onClick={() => props.onTabChange("sci")}
        >
          {t("tabs.sci")}
        </button>
      </nav>

      {/* Active calculator — only one renders at a time for isolation */}
      {props.tab === "ip" && (
        <IpCalculator
          theme={props.theme}
          onToggleTheme={props.onToggleTheme}
          lang={props.lang}
          onLangChange={props.onLangChange}
        />
      )}
      {props.tab === "base" && <BaseConverter />}
      {props.tab === "sci" && <SimpleCalculator />}

      <footer className="footer">
        <p>
          {t("footer.developer")}{" "}
          <a className="footer-link" href="https://anibalpaezzgallego.com" target="_blank" rel="noreferrer">
            Anibal Paez Gallego
          </a>
        </p>
      </footer>
    </div>
  );
}
