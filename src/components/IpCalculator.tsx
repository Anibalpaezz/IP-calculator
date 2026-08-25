import { useEffect, useMemo, useState } from "react";
import { calculateIpCalc } from "../lib/ipcalc";
import { calculateIpv6Calc } from "../lib/ipv6calc";
import { ipv4ToText, ipv6ToText } from "../lib/export";
import { LanguageProvider } from "./LanguageProvider";
import { useLang, type Lang } from "../i18n";
import { ErrorPanel } from "./ErrorPanel";
import { IpLineRow } from "./IpLineRow";
import { NetCard } from "./NetCard";
import { SubnetSectionView } from "./SubnetSectionView";
import { SupernetSectionView } from "./SupernetSectionView";
import { Ipv6SectionView } from "./Ipv6SectionView";

const DEFAULT_HOST = "192.168.0.1";
const DEFAULT_MASK1 = "24";

const IPv4_PRESETS = [8, 12, 16, 24, 25, 26, 27, 28, 30, 32];
const IPv6_PRESETS = [32, 48, 56, 64, 80, 96, 128];

function getParams() {
  return new URLSearchParams(window.location.search);
}

interface Props {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  lang: Lang;
  onLangChange: (l: Lang) => void;
}

export function IpCalculator({ theme, onToggleTheme, lang, onLangChange }: Props) {
  const [host, setHost] = useState(() => getParams().get("host") ?? DEFAULT_HOST);
  const [mask1, setMask1] = useState(() => {
    const hostCidr = (getParams().get("host") ?? "").match(/^(.+)\/(\d{1,3})$/);
    if (hostCidr) return hostCidr[2];
    return getParams().get("mask1") ?? DEFAULT_MASK1;
  });
  const [mask2, setMask2] = useState(() => getParams().get("mask2") ?? "");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const sp = new URLSearchParams();
    if (host) sp.set("host", host);
    if (mask1) sp.set("mask1", mask1);
    if (mask2) sp.set("mask2", mask2);
    const qs = sp.toString();
    const fullQs = new URLSearchParams(qs);
    if (theme) fullQs.set("theme", theme);
    if (lang) fullQs.set("lang", lang);
    const url = `${window.location.pathname}?${fullQs.toString()}`;
    window.history.replaceState(null, "", url);
  }, [host, mask1, mask2, theme, lang]);

  const split = useMemo(() => {
    const m = host.match(/^(.+)\/(\d{1,3})$/);
    return m ? { address: m[1], cidr: m[2] } : { address: host, cidr: null };
  }, [host]);

  const isIpv6 = split.address.includes(":");
  const effectiveHost = split.address;
  const effectiveMask1 = split.cidr ?? mask1;
  const effectiveMask2 = isIpv6 ? "" : mask2;

  const ipv4 = useMemo(
    () => (!isIpv6 ? calculateIpCalc({ host: effectiveHost, mask1: effectiveMask1, mask2: effectiveMask2 }) : null),
    [isIpv6, effectiveHost, effectiveMask1, effectiveMask2],
  );

  const ipv6 = useMemo(
    () => (isIpv6 ? calculateIpv6Calc({ host: effectiveHost, prefixStr: effectiveMask1 }) : null),
    [isIpv6, effectiveHost, effectiveMask1],
  );

  const errors = (isIpv6 ? ipv6?.errors : ipv4?.errors) ?? [];

  const handleHostChange = (value: string) => {
    setHost(value);
    const m = value.match(/^(.+)\/(\d{1,3})$/);
    if (m) {
      const c = Number(m[2]);
      if (c >= 0 && c <= 128) setMask1(m[2]);
    }
  };

  const handleMask1Change = (value: string) => {
    setMask1(value);
    const slash = host.indexOf("/");
    if (slash !== -1) setHost(host.slice(0, slash));
  };

  const applyPreset = (bits: number) => {
    setMask1(String(bits));
    const slash = host.indexOf("/");
    if (slash !== -1) setHost(host.slice(0, slash));
  };

  const copyResult = async () => {
    const text = isIpv6 ? (ipv6 ? ipv6ToText(ipv6) : "") : ipv4 ? ipv4ToText(ipv4) : "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const presets = isIpv6 ? IPv6_PRESETS : IPv4_PRESETS;

  return (
    <LanguageProvider lang={lang} onLangChange={onLangChange}>
      <IpCalculatorContent
        host={host}
        onHostChange={handleHostChange}
        mask1={mask1}
        onMask1Change={handleMask1Change}
        mask2={mask2}
        onMask2Change={setMask2}
        theme={theme}
        onToggleTheme={onToggleTheme}
        lang={lang}
        onLangChange={onLangChange}
        isIpv6={isIpv6}
        effectiveMask1={effectiveMask1}
        presets={presets}
        onApplyPreset={applyPreset}
        copied={copied}
        onCopy={copyResult}
        errors={errors}
        ipv4={ipv4}
        ipv6={ipv6}
      />
    </LanguageProvider>
  );
}

interface IpCalculatorContentProps {
  host: string;
  onHostChange: (v: string) => void;
  mask1: string;
  onMask1Change: (v: string) => void;
  mask2: string;
  onMask2Change: (v: string) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  lang: Lang;
  onLangChange: (l: Lang) => void;
  isIpv6: boolean;
  effectiveMask1: string;
  presets: number[];
  onApplyPreset: (b: number) => void;
  copied: boolean;
  onCopy: () => void;
  errors: string[];
  ipv4: ReturnType<typeof calculateIpCalc> | null;
  ipv6: ReturnType<typeof calculateIpv6Calc> | null;
}

function IpCalculatorContent(props: IpCalculatorContentProps) {
  const { t } = useLang();

  return (
    <>
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
          <button type="button" className="theme-toggle" onClick={props.onToggleTheme}>
            {props.theme === "dark" ? t("theme.light") : t("theme.dark")}
          </button>
        </div>
        <h1>{t("app.title")}</h1>
        <p>{t("app.subtitle")}</p>
      </header>

      <form className="card form-card" onSubmit={(e) => e.preventDefault()}>
        <div className="field">
          <label htmlFor="host">{t("host.label")}</label>
          <input
            id="host"
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="192.168.0.1"
            value={props.host}
            onChange={(e) => props.onHostChange(e.target.value)}
          />
          <span className="field-hint">{t("host.hint")}</span>
        </div>
        <div className="field">
          <label htmlFor="mask1">{props.isIpv6 ? t("prefix.label") : t("netmask.label")}</label>
          <input
            id="mask1"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            placeholder="24"
            value={props.mask1}
            onChange={(e) => props.onMask1Change(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="mask2">{t("mask2.label")}</label>
          <input
            id="mask2"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            placeholder="26"
            value={props.mask2}
            onChange={(e) => props.onMask2Change(e.target.value)}
          />
        </div>
      </form>

      <div className="presets">
        <span className="presets-label">{t("presets.label")}</span>
        {props.presets.map((bits) => (
          <button
            key={bits}
            type="button"
            className={`preset-btn ${Number(props.effectiveMask1) === bits ? "is-active" : ""}`}
            onClick={() => props.onApplyPreset(bits)}
          >
            /{bits}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <span className={`mode-badge ${props.isIpv6 ? "ipv6" : "ipv4"}`}>{props.isIpv6 ? "IPv6" : "IPv4"}</span>
        <button type="button" className={`tool-btn ${props.copied ? "copied" : ""}`} onClick={props.onCopy}>
          {props.copied ? t("copy.done") : t("copy.text")}
        </button>
      </div>

      <ErrorPanel errors={props.errors} />

      <main className="results">
        {props.ipv4 && (
          <section className="card main-section" aria-label="Result">
            {props.ipv4.netInfo.lines.slice(0, 3).map((line) => (
              <IpLineRow key={line.label} line={line} />
            ))}
            <NetCard info={{ ...props.ipv4.netInfo, lines: props.ipv4.netInfo.lines.slice(3) }} showArrow />
          </section>
        )}

        {props.ipv4?.subnetSection && <SubnetSectionView section={props.ipv4.subnetSection} />}
        {props.ipv4?.supernetSection && <SupernetSectionView section={props.ipv4.supernetSection} />}

        {props.ipv6 && <Ipv6SectionView result={props.ipv6} />}
      </main>

      <details className="legend card">
        <summary>{t("legend.summary")}</summary>
        <ul>
          <li>{t("legend.1")}</li>
          <li>{t("legend.2")}</li>
          <li>{t("legend.3")}</li>
          <li>{t("legend.4")}</li>
          <li>{t("legend.5")}</li>
          <li>{t("legend.6")}</li>
          <li>{t("legend.7")}</li>
          <li>{t("legend.8")}</li>
        </ul>
      </details>
    </>
  );
}
