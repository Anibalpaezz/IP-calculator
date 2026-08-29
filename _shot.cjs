const puppeteer = require("puppeteer-core");
const path = require("path");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const URL = "http://localhost:5173/?tab=sci";
const OUT = "C:\\Users\\Anibal\\AppData\\Local\\Temp\\opencode";
const TAG = process.env.TAG || "after";

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function info(page, label) {
  const data = await page.evaluate(() => {
    const zones = document.querySelectorAll(
      ".sci-ctrlzone-grid, .sci-numpad, .sci-fn-panel .sci-grid, .sci-mem-grid, .sci-zone",
    );
    const lines = [];
    zones.forEach((z) => {
      const buttons = Array.from(z.querySelectorAll("button")).filter((b) => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      if (!buttons.length) return;
      const first = buttons[0].getBoundingClientRect();
      const widths = [...new Set(buttons.map((b) => Math.round(b.getBoundingClientRect().width)))];
      const heights = [...new Set(buttons.map((b) => Math.round(b.getBoundingClientRect().height)))];
      lines.push({
        zone: z.className,
        cols: getComputedStyle(z).gridTemplateColumns,
        width: Math.round(z.getBoundingClientRect().width),
        btn: buttons.length,
        cellW: Math.round(first.width),
        cellH: Math.round(first.height),
        distinctW: widths,
        distinctH: heights,
      });
    });

    // Overlap check: any two buttons overlapping vertically/horizontally from different zones
    const allBtns = Array.from(document.querySelectorAll(".calc-card button")).filter((b) => {
      const r = b.getBoundingClientRect();
      return r.width > 2 && r.height > 2;
    });
    let overlaps = 0;
    for (let i = 0; i < allBtns.length; i++) {
      const a = allBtns[i].getBoundingClientRect();
      for (let j = i + 1; j < allBtns.length; j++) {
        const c = allBtns[j].getBoundingClientRect();
        const ox = Math.min(a.right, c.right) - Math.max(a.left, c.left);
        const oy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
        if (ox > 1 && oy > 1) {
          overlaps++;
        }
      }
    }

    // Header overlap check: hero-actions vs h1
    const actions = document.querySelector(".hero-actions");
    const title = document.querySelector(".hero h1");
    let headerOverlap = null;
    if (actions && title) {
      const a = actions.getBoundingClientRect();
      const t = title.getBoundingClientRect();
      const ox = Math.min(a.right, t.right) - Math.max(a.left, t.left);
      const oy = Math.min(a.bottom, t.bottom) - Math.max(a.top, t.top);
      headerOverlap = ox > 1 && oy > 1;
    }

    const card = document.querySelector(".calc-card");
    const cs = card ? getComputedStyle(card) : null;
    return {
      overlaps,
      cardH: card ? Math.round(card.getBoundingClientRect().height) : null,
      cardHeightCss: cs ? cs.height : null,
      cardOverflow: cs ? cs.overflow : null,
      cardMinHeight: cs ? cs.minHeight : null,
      lines,
    };
  });
  console.log("=== " + label + " === viewport " + JSON.stringify(await page.evaluate(() => ({ w: innerWidth, h: innerHeight }))));
  console.log("OVERLAPS=" + data.overlaps + " cardH=" + data.cardH + " cssH=" + data.cardHeightCss + " minH=" + data.cardMinHeight + " overflow=" + data.cardOverflow + " headerOverlap=" + data.headerOverlap);
  data.lines.forEach((l) => {
    console.log(`[${l.zone}] cols=${l.cols} w=${l.width} btn=${l.btn} cell=${l.cellW}x${l.cellH} distinctW=[${l.distinctW.join(",")}] distinctH=[${l.distinctH.join(",")}]`);
  });
}

async function openMem(page) {
  const btns = await page.$$(".sci-mode-btn");
  for (const b of btns) {
    const txt = await page.evaluate((el) => el.textContent, b);
    if (txt && txt.trim() === "MEM") { await b.click(); break; }
  }
  await sleep(300);
  const panelBtns = await page.$$(".sci-btn-fn");
  for (const b of panelBtns) {
    const txt = await page.evaluate((el) => el.textContent, b);
    if (txt && txt.trim().toLowerCase() === "panel") { await b.click(); break; }
  }
  await sleep(300);
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=1"],
  });

  const page = await browser.newPage();

  // Desktop
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(URL, { waitUntil: "networkidle0" });
  await sleep(600);
  await page.screenshot({ path: path.join(OUT, TAG + "-desktop.png") });
  await info(page, "DESKTOP 1280 " + TAG);

  // Panel (mem mode) desktop
  await page.goto(URL, { waitUntil: "networkidle0" });
  await sleep(400);
  await openMem(page);
  await page.screenshot({ path: path.join(OUT, TAG + "-panel-desktop.png") });
  await info(page, "DESKTOP PANEL " + TAG);

  // Mobile
  await page.evaluate(() => localStorage.setItem("ipcalc-season", "auto"));
  await page.setViewport({ width: 375, height: 812 });
  await page.goto(URL, { waitUntil: "networkidle0" });
  await sleep(600);
  await page.screenshot({ path: path.join(OUT, TAG + "-mobile.png") });
  await info(page, "MOBILE 375 " + TAG);

  // Tablet
  await page.setViewport({ width: 768, height: 1024 });
  await page.goto(URL, { waitUntil: "networkidle0" });
  await sleep(600);
  await page.screenshot({ path: path.join(OUT, TAG + "-tablet.png") });
  await info(page, "TABLET 768 " + TAG);

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
