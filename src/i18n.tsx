import { createContext, useContext, type ReactNode } from "react";

export type Lang = "es" | "en";

export const messages: Record<Lang, Record<string, ReactNode>> = {
  es: {
    "app.title": "Calculadora IP y de Subredes Online",
    "app.subtitle": (
      <>
        Calculadora IPv4 (estilo <code>ipcalc</code>) e IPv6 con recálculo en tiempo real. Los
        resultados se actualizan mientras escribes.
      </>
    ),
    "theme.light": "Tema claro",
    "theme.dark": "Tema oscuro",
    "season.label": "Estación",
    "season.auto": "Automático",
    "season.spring": "Primavera",
    "season.summer": "Verano",
    "season.autumn": "Otoño",
    "season.winter": "Invierno",
    "host.label": "Dirección (Host o Red)",
    "netmask.label": "Netmask (i.e. 24 o /24)",
    "prefix.label": "Prefix (i.e. 64 o /64)",
    "mask2.label": "Netmask para sub/superred (opcional)",
    "host.hint": (
      <>
        Acepta <code>192.168.0.1/24</code> o <code>2001:db8::1/64</code>
      </>
    ),
    "presets.label": "Presets:",
    "copy.text": "Copiar texto",
    "copy.done": "Copiado",
    "legend.summary": "¿Qué significa cada campo?",
    "legend.1": (
      <>
        <strong>Address:</strong> la dirección IP (host o red) que escribiste. En IPv4 también
        puedes escribirla con prefijo: <code>192.168.0.1/24</code>.
      </>
    ),
    "legend.2": (
      <>
        <strong>Netmask:</strong> máscara de red (CIDR <code>/24</code>, decimal{" "}
        <code>255.255.255.0</code> o wildcard inversa <code>0.0.0.255</code>). Separa la parte de
        red de la de host.
      </>
    ),
    "legend.3": (
      <>
        <strong>Wildcard:</strong> comodín inverso de la máscara (los bits de host a 1); se usa en
        ACLs.
      </>
    ),
    "legend.4": (
      <>
        <strong>Network:</strong> la dirección base de la subred.
      </>
    ),
    "legend.5": (
      <>
        <strong>HostMin / HostMax:</strong> primer y último host utilizables de la subred.
      </>
    ),
    "legend.6": (
      <>
        <strong>Broadcast:</strong> dirección de difusión a todos los hosts de la subred.
      </>
    ),
    "legend.7": (
      <>
        <strong>Hosts/Net:</strong> direcciones utilizables (el clásico <code>2ⁿ − 2</code>, salvo{" "}
        <code>/31</code> con 2 y <code>/32</code> con 1).
      </>
    ),
    "legend.8": (
      <>
        <strong>Second netmask:</strong> si es mayor que la primera divide en subredes; si es menor,
        calcula la superred que las agrupa.
      </>
    ),
    "tabs.ip": "Calculadora IP",
    "tabs.base": "Convertidor de Bases",
    "tabs.sci": "Calculadora Científica",
    "footer.developer": "Desarrollado por",
    "hostsNet.label": "Hosts/Red",
    "subnets.heading": "Subredes",
    "totals.subnets": "Subredes",
    "totals.hosts": "Hosts",
    "truncated": "Mostrando las primeras {first} subredes de {total} (límite de renderizado).",
    "addressesNet.label": "Direcciones/Red",
  },
  en: {
    "app.title": "IP Subnet Calculator Online",
    "app.subtitle": (
      <>
        IPv4 (ipcalc-style) and IPv6 calculator with real-time recalculation. Results update as you
        type.
      </>
    ),
    "theme.light": "Light theme",
    "theme.dark": "Dark theme",
    "season.label": "Season",
    "season.auto": "Automatic",
    "season.spring": "Spring",
    "season.summer": "Summer",
    "season.autumn": "Autumn",
    "season.winter": "Winter",
    "host.label": "Address (Host or Network)",
    "netmask.label": "Netmask (i.e. 24 or /24)",
    "prefix.label": "Prefix (i.e. 64 or /64)",
    "mask2.label": "Netmask for sub/supernet (optional)",
    "host.hint": (
      <>
        Accepts <code>192.168.0.1/24</code> or <code>2001:db8::1/64</code>
      </>
    ),
    "presets.label": "Presets:",
    "copy.text": "Copy text",
    "copy.done": "Copied",
    "legend.summary": "What does each field mean?",
    "legend.1": (
      <>
        <strong>Address:</strong> the IP (host or network) you typed. In IPv4 you can also write it
        with a prefix: <code>192.168.0.1/24</code>.
      </>
    ),
    "legend.2": (
      <>
        <strong>Netmask:</strong> network mask (CIDR <code>/24</code>, decimal{" "}
        <code>255.255.255.0</code> or inverse wildcard <code>0.0.0.255</code>). It separates the
        network part from the host part.
      </>
    ),
    "legend.3": (
      <>
        <strong>Wildcard:</strong> inverse mask (host bits set to 1); used in ACLs.
      </>
    ),
    "legend.4": (
      <>
        <strong>Network:</strong> the base address of the subnet.
      </>
    ),
    "legend.5": (
      <>
        <strong>HostMin / HostMax:</strong> first and last usable hosts of the subnet.
      </>
    ),
    "legend.6": (
      <>
        <strong>Broadcast:</strong> address used to broadcast to every host on the subnet.
      </>
    ),
    "legend.7": (
      <>
        <strong>Hosts/Net:</strong> usable addresses (the classic <code>2ⁿ − 2</code>, except{" "}
        <code>/31</code> with 2 and <code>/32</code> with 1).
      </>
    ),
    "legend.8": (
      <>
        <strong>Second netmask:</strong> if larger than the first it splits into subnets; if smaller,
        it computes the supernet that aggregates them.
      </>
    ),
    "tabs.ip": "IP Calculator",
    "tabs.base": "Base Converter",
    "tabs.sci": "Scientific Calculator",
    "footer.developer": "Develop by",
    "hostsNet.label": "Hosts/Net",
    "subnets.heading": "Subnets",
    "totals.subnets": "Subnets",
    "totals.hosts": "Hosts",
    "truncated": "Showing the first {first} subnets of {total} (render limit).",
    "addressesNet.label": "Addresses/Net",
  },
};

export interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => ReactNode;
  ti: (key: string, params?: Record<string, string | number>) => string;
}

export const LangContext = createContext<LangContextValue | null>(null);

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}